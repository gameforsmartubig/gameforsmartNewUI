import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverUsername, type, title, message, data } = await request.json();

    if (!senderId || !receiverUsername || !type || !title || !message) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: senderId, receiverUsername, type, title, and message are required"
        },
        { status: 400 }
      );
    }

    // Get sender's profile ID
    const { data: senderProfile, error: senderError } = await supabase
      .from("profiles")
      .select("id, username, fullname")
      .eq("auth_user_id", senderId)
      .single();

    if (senderError || !senderProfile) {
      return NextResponse.json({ error: "Sender profile not found" }, { status: 404 });
    }

    // Get receiver's profile by username
    const { data: receiverProfile, error: receiverError } = await supabase
      .from("profiles")
      .select("id, auth_user_id")
      .eq("username", receiverUsername)
      .single();

    if (receiverError || !receiverProfile) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    // Check if sender and receiver are different
    if (senderProfile.id === receiverProfile.id) {
      return NextResponse.json({ error: "Cannot send notification to yourself" }, { status: 400 });
    }

    // Create notification
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: receiverProfile.id,
        sender_id: senderProfile.id,
        type,
        title,
        message,
        data: data || {},
        is_read: false
      })
      .select()
      .single();

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
    }

    // Try to send push notification if user has subscription
    try {
      const { data: pushSub } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", receiverProfile.id)
        .single();

      if (pushSub) {
        // Send push notification (you can implement web-push here)
        // For now, just log that we would send a push
        console.log("Would send push notification to:", receiverUsername);
      }
    } catch (pushError) {
      // Push notification failed, but database notification was created
      console.error("Push notification failed:", pushError);
    }

    return NextResponse.json({
      success: true,
      notification,
      message: `Notification sent to @${receiverUsername}`
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
