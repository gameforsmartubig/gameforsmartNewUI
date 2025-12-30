import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
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
        { error: "Cannot delete your own account or invalid user ID" },
        { status: 400 }
      );
    }

    // Get target user info first for logging
    const { data: targetUser, error: targetUserError } = await supabase
      .from("profiles")
      .select("username, email")
      .eq("id", userId)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use the safe_delete_user function
    const { data: deleteResult, error: deleteError } = await supabase.rpc(
      "safe_delete_user",
      {
        target_user_id: userId,
        admin_user_id: user.id,
      }
    );

    if (deleteError) {
      console.error("Safe delete error:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete user: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Try to delete from auth system (this is optional and may fail)
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
        userId,
        true // shouldSoftDelete = true
      );

      if (authDeleteError) {
        console.warn("Auth delete warning:", authDeleteError);
        // This is not critical since profile is already deleted
      }
    } catch (authError) {
      console.warn("Auth delete failed:", authError);
      // Continue anyway since profile deletion succeeded
    }

    return NextResponse.json({
      success: true,
      message: `User ${
        targetUser.username || targetUser.email
      } has been successfully deleted from the system`,
      data: {
        deletedUserId: userId,
        deletedUsername: targetUser.username,
        deletedEmail: targetUser.email,
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
