import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ followId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Await params before accessing properties (Next.js 15+ requirement)
    const { followId } = await params;

    // Convert UUID to XID (profile.id)
    let userIdStr: string;

    // Try to get the profile.id (XID) from the auth_user_id (UUID)
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, auth_user_id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // Use XID if found, otherwise fallback to original userId
    if (profileData && profileData.id) {
      userIdStr = profileData.id;
    } else {
      // Fallback: assume userId is already an XID
      userIdStr = userId;
    }

    // Get the friendship record first to verify ownership
    const { data: friendship, error: fetchError } = await supabase
      .from("friendships")
      .select("*")
      .eq("id", followId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Follow relationship not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Verify that the requesting user is involved in this relationship (using XID)
    if (friendship.requester_id !== userIdStr && friendship.addressee_id !== userIdStr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Simply delete the relationship (unfollow)
    const { error: deleteError } = await supabase.from("friendships").delete().eq("id", followId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      message: "Unfollowed successfully"
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ followId: string }> }
) {
  try {
    const body = await request.json();
    const { userId, action } = body; // action: 'accept', 'decline', 'block', or 'unblock'

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!action || !["accept", "decline", "block", "unblock"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action (accept/decline/block/unblock) is required" },
        { status: 400 }
      );
    }

    // Await params before accessing properties (Next.js 15+ requirement)
    const { followId } = await params;

    // Convert UUID to XID (profile.id)
    let userIdStr: string;

    // Try to get the profile.id (XID) from the auth_user_id (UUID)
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, auth_user_id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // Use XID if found, otherwise fallback to original userId
    if (profileData && profileData.id) {
      userIdStr = profileData.id;
    } else {
      // Fallback: assume userId is already an XID
      userIdStr = userId;
    }

    // Get the friendship record first
    const { data: friendship, error: fetchError } = await supabase
      .from("friendships")
      .select("*")
      .eq("id", followId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Verify that the requesting user is involved in this relationship (using XID)
    if (friendship.requester_id !== userIdStr && friendship.addressee_id !== userIdStr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "accept") {
      // Accept follow request - only addressee can accept (using XID)
      if (friendship.addressee_id !== userIdStr) {
        return NextResponse.json(
          { error: "Only the addressee can accept requests" },
          { status: 403 }
        );
      }

      if (friendship.status !== "pending") {
        return NextResponse.json({ error: "Request is not pending" }, { status: 400 });
      }

      // Update status to accepted
      const { data, error: updateError } = await supabase
        .from("friendships")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString()
        })
        .eq("id", followId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Check if it's mutual (addressee also follows requester)
      const { data: reverseFollow } = await supabase
        .from("friendships")
        .select("*")
        .eq("requester_id", friendship.addressee_id)
        .eq("addressee_id", friendship.requester_id)
        .eq("status", "accepted")
        .single();

      const isMutual = !!reverseFollow;

      return NextResponse.json({
        message: isMutual
          ? "Follow request accepted - You are now friends!"
          : "Follow request accepted",
        data,
        mutual: isMutual
      });
    } else if (action === "decline") {
      // Decline follow request - only addressee can decline
      if (friendship.addressee_id !== userId) {
        return NextResponse.json(
          { error: "Only the addressee can decline requests" },
          { status: 403 }
        );
      }

      if (friendship.status !== "pending") {
        return NextResponse.json({ error: "Request is not pending" }, { status: 400 });
      }

      // Delete the request (decline)
      const { error: deleteError } = await supabase.from("friendships").delete().eq("id", followId);

      if (deleteError) throw deleteError;

      return NextResponse.json({
        message: "Follow request declined"
      });
    } else if (action === "block") {
      // Block the user - update status to blocked and make sure current user is the requester
      const { data, error: updateError } = await supabase
        .from("friendships")
        .update({
          status: "blocked",
          requester_id: userId, // Make the blocker the requester
          addressee_id:
            friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id,
          updated_at: new Date().toISOString()
        })
        .eq("id", followId)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        message: "User blocked successfully",
        data
      });
    } else if (action === "unblock") {
      // Unblock - just delete the relationship
      const { error: deleteError } = await supabase.from("friendships").delete().eq("id", followId);

      if (deleteError) throw deleteError;

      return NextResponse.json({
        message: "User unblocked successfully"
      });
    }
  } catch (error) {
    console.error("Error updating follow relationship:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
