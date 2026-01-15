import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Get notification permissions for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // 'sent' | 'received' | 'pending'

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    let query = supabase.from("notification_permissions").select(`
      *,
      requester:requester_id(id, username, fullname, avatar_url),
      receiver:receiver_id(id, username, fullname, avatar_url)
    `);

    if (type === "sent") {
      query = query.eq("requester_id", userId);
    } else if (type === "received") {
      query = query.eq("receiver_id", userId);
    } else if (type === "pending") {
      query = query.eq("receiver_id", userId).eq("status", "pending");
    } else {
      query = query.or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Request notification permission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requesterId, receiverId } = body;

    if (!requesterId || !receiverId) {
      return NextResponse.json({ error: "requesterId and receiverId required" }, { status: 400 });
    }

    if (requesterId === receiverId) {
      return NextResponse.json({ error: "Cannot request permission to yourself" }, { status: 400 });
    }

    // Check if permission already exists
    const { data: existing } = await supabase
      .from("notification_permissions")
      .select("id, status")
      .eq("requester_id", requesterId)
      .eq("receiver_id", receiverId)
      .single();

    if (existing) {
      if (existing.status === "declined") {
        // Update declined to pending (re-request)
        const { data, error } = await supabase
          .from("notification_permissions")
          .update({ status: "pending", updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ data, message: "Permission re-requested" });
      }
      return NextResponse.json(
        { error: "Permission request already exists", status: existing.status },
        { status: 409 }
      );
    }

    // Get requester info for notification
    const { data: requesterData } = await supabase
      .from("profiles")
      .select("username, fullname, avatar_url")
      .eq("id", requesterId)
      .single();

    // Create new permission request
    const { data, error } = await supabase
      .from("notification_permissions")
      .insert({ requester_id: requesterId, receiver_id: receiverId })
      .select()
      .single();

    if (error) throw error;

    // Send in-app notification to receiver
    const { data: receiverProfile } = await supabase
      .from("profiles")
      .select("notifications")
      .eq("id", receiverId)
      .single();

    if (receiverProfile) {
      const currentNotifications = receiverProfile.notifications || [];
      const newNotification = {
        id: crypto.randomUUID(),
        type: "notification_permission_request",
        title: "Permintaan Notifikasi",
        msg: `Ingin mengirimkan notifikasi hasil quiz kepada Anda`,
        is_read: false,
        created: new Date().toISOString(),
        data: {
          permission_id: data.id,
          requester_id: requesterId,
          requester_username: requesterData?.username,
          requester_fullname: requesterData?.fullname,
          requester_avatar: requesterData?.avatar_url
        }
      };

      await supabase
        .from("profiles")
        .update({
          notifications: [newNotification, ...currentNotifications].slice(0, 50)
        })
        .eq("id", receiverId);
    }

    return NextResponse.json({ data, message: "Permission requested" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Accept or decline permission
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { permissionId, status, userId } = body;

    if (!permissionId || !status || !userId) {
      return NextResponse.json(
        { error: "permissionId, status, and userId required" },
        { status: 400 }
      );
    }

    if (!["accepted", "declined"].includes(status)) {
      return NextResponse.json({ error: "status must be accepted or declined" }, { status: 400 });
    }

    // Verify user is the receiver
    const { data: permission } = await supabase
      .from("notification_permissions")
      .select("receiver_id")
      .eq("id", permissionId)
      .single();

    if (!permission || permission.receiver_id !== userId) {
      return NextResponse.json(
        { error: "Not authorized to update this permission" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("notification_permissions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", permissionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, message: `Permission ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove permission
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get("permissionId");
    const userId = searchParams.get("userId");

    if (!permissionId || !userId) {
      return NextResponse.json({ error: "permissionId and userId required" }, { status: 400 });
    }

    // Verify user is requester or receiver
    const { data: permission } = await supabase
      .from("notification_permissions")
      .select("requester_id, receiver_id")
      .eq("id", permissionId)
      .single();

    if (!permission || (permission.requester_id !== userId && permission.receiver_id !== userId)) {
      return NextResponse.json(
        { error: "Not authorized to delete this permission" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("notification_permissions")
      .delete()
      .eq("id", permissionId);

    if (error) throw error;

    return NextResponse.json({ message: "Permission removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
