import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Environment variables with fallbacks
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-key";

// Initialize Supabase client for server operations
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/groups/invite-user
 * Invite user to join a group with notification
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🚀 POST /api/groups/invite-user called");

    // Get auth token from headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the user
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, userId } = body;

    console.log("📥 Request data:", { groupId, userId });

    // Validate input
    if (!groupId || !userId) {
      return NextResponse.json(
        { error: "Group ID and User ID are required" },
        { status: 400 }
      );
    }

    // Get inviter profile info
    const { data: inviterProfile, error: inviterError } = await supabaseServer
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("auth_user_id", user.id)
      .single();

    if (inviterError || !inviterProfile) {
      console.error("❌ Inviter profile not found:", inviterError);
      return NextResponse.json(
        { error: "Inviter profile not found" },
        { status: 404 }
      );
    }

    // Get group info and verify permission
    const { data: groupData, error: groupError } = await supabaseServer
      .from("groups")
      .select("id, name, avatar_url, creator_id, members")
      .eq("id", groupId)
      .single();

    if (groupError || !groupData) {
      console.error("❌ Group not found:", groupError);
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Check if inviter has permission (owner, admin, or moderator)
    let hasPermission = false;
    if (groupData.creator_id === inviterProfile.id) {
      hasPermission = true;
    } else {
      const members = groupData.members || [];
      const inviterMember = members.find(
        (m: any) => m.user_id === inviterProfile.id
      );
      if (inviterMember && ["admin", "moderator"].includes(inviterMember.role)) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to invite users to this group" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const members = groupData.members || [];
    const isAlreadyMember = members.some((m: any) => m.user_id === userId);

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: "User is already a member of this group" },
        { status: 400 }
      );
    }

    // Get target user info - get both id and auth_user_id
    const { data: targetUser, error: targetError } = await supabaseServer
      .from("profiles")
      .select("id, auth_user_id, username, fullname")
      .eq("id", userId)
      .single();

    if (targetError || !targetUser) {
      console.error("❌ Target user not found:", targetError);
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    const inviterName = inviterProfile.username || "Someone";
    const groupName = groupData.name || "Unknown Group";

    // Create notification using RPC - use auth_user_id (UUID) not id (XID)
    const { data: notificationId, error: rpcError } = await supabaseServer.rpc(
      "add_user_notification",
      {
        p_user_id: targetUser.auth_user_id, // Use UUID not XID
        p_type: "group_invitation",
        p_title: "👥 Undangan Bergabung Grup!",
        p_message: `${inviterName} mengundang kamu untuk bergabung ke grup "${groupName}"`,
        p_data: {
          group_id: groupId,
          group_name: groupName,
          group_avatar: groupData.avatar_url,
          inviter_name: inviterName,
          inviter_id: inviterProfile.id,
          inviter_avatar: inviterProfile.avatar_url,
          invitation_type: "group_join",
        },
        p_expires_at: null,
      }
    );

    if (rpcError) {
      console.error("❌ Error creating notification:", rpcError);
      return NextResponse.json(
        { error: `Failed to create notification: ${rpcError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully invited ${targetUser.username} to ${groupName}`);

    return NextResponse.json({
      success: true,
      message: `Successfully invited ${targetUser.username} to ${groupName}`,
      notificationId,
      targetUser: {
        id: targetUser.id,
        username: targetUser.username,
        fullname: targetUser.fullname,
      },
    });
  } catch (error) {
    console.error("💥 API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send group invitation",
      },
      { status: 500 }
    );
  }
}

// GET handler for testing
export async function GET() {
  return NextResponse.json({
    message: "Group user invite API is working - JSONB Notifications",
    methods: ["POST"],
    endpoint: "/api/groups/invite-user",
    features: [
      "Invite users to join groups",
      "Notifications stored in profiles.notifications JSONB",
      "Permission-based (owner/admin/moderator only)",
      "Real-time delivery",
    ],
    usage: {
      method: "POST",
      body: {
        groupId: "string (UUID)",
        userId: "string (UUID)",
      },
    },
  });
}

