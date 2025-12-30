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
    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
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

    // Unblock the user (set is_blocked to false and clear blocked_at)
    const { error: unblockError } = await supabase
      .from("profiles")
      .update({
        is_blocked: false,
        blocked_at: null,
      })
      .eq("id", userId);

    if (unblockError) {
      console.error("Unblock user error:", unblockError);
      return NextResponse.json(
        { error: `Failed to unblock user: ${unblockError.message}` },
        { status: 500 }
      );
    }

    // Log admin action
    try {
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "user_unblock",
        target_user_id: userId,
        target_content_type: "user",
        target_content_id: userId,
        description: `User unblocked by admin: ${
          targetUser.username || targetUser.email
        }`,
        reason: "User unblocked",
        metadata: {
          target_username: targetUser.username,
          action_type: "unblock",
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
      } has been successfully unblocked`,
      data: {
        unblockedUserId: userId,
        unblockedUsername: targetUser.username,
        unblockedEmail: targetUser.email,
      },
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

