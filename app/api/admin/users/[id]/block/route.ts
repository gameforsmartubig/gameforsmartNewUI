import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties (Next.js 15+ requirement)
    const { id: userId } = await params;

    // Get the current user
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authorization token" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    const isAdmin = ["admin", "moderator"].includes(profile?.role);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    // Validate userId
    if (!userId || userId === user.id) {
      return NextResponse.json(
        { error: "Cannot block your own account or invalid user ID" },
        { status: 400 }
      );
    }

    // Get target user info first
    const { data: targetUser, error: targetUserError } = await supabase
      .from("profiles")
      .select("username, email, is_blocked")
      .eq("id", userId)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get reason from request body
    const body = await request.json();
    const reason = body.reason || "No reason provided";

    // Block the user (set is_blocked to true and set blocked_at)
    const { error: blockError } = await supabase
      .from("profiles")
      .update({
        is_blocked: true,
        blocked_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (blockError) {
      console.error("Block user error:", blockError);
      return NextResponse.json(
        { error: `Failed to block user: ${blockError.message}` },
        { status: 500 }
      );
    }

    // Log admin action
    try {
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "user_block",
        target_user_id: userId,
        target_content_type: "user",
        target_content_id: userId,
        description: `User blocked (hidden) by admin: ${
          targetUser.username || targetUser.email
        }`,
        reason: reason,
        metadata: {
          target_username: targetUser.username,
          action_type: "block",
          reason: reason,
        },
      });
    } catch (logError) {
      console.warn("Failed to log admin action:", logError);
      // Continue anyway since the main action succeeded
    }

    return NextResponse.json({
      success: true,
      message: `User ${
        targetUser.username || targetUser.email
      } has been successfully blocked (hidden)`,
      data: {
        blockedUserId: userId,
        blockedUsername: targetUser.username,
        blockedEmail: targetUser.email,
      },
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

