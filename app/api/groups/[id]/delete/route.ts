import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Environment variables with fallbacks
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-key";

// Create Supabase client with service role
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// DELETE - Delete a group and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // Verify the user with the token
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Await params before accessing properties (Next.js 15+ requirement)
    const { id: groupId } = await params;

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // First, check if the group exists and get group info with members
    const { data: group, error: groupError } = await supabaseServer
      .from("groups")
      .select("id, name, creator_id, members")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: "Group not found or already deleted" },
        { status: 404 }
      );
    }

    // First get the user's profile ID from auth_user_id
    const { data: profileData, error: profileError } = await supabaseServer
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const userProfileId = profileData.id;

    // Check if user is the creator (owner) or admin from JSONB members
    let userRole = "";

    // Check if user is the creator (always owner)
    if (group.creator_id === userProfileId) {
      userRole = "owner";
    } else {
      // Check if user is in the members JSONB
      const members = group.members || [];
      const userMember = members.find(
        (member: any) => member.user_id === userProfileId
      );

      if (!userMember) {
        return NextResponse.json(
          { error: "You are not a member of this group" },
          { status: 403 }
        );
      }

      userRole = userMember.role;
    }

    // Only owners can delete the group
    if (userRole !== "owner") {
      return NextResponse.json(
        { error: "Only group owners can delete the group" },
        { status: 403 }
      );
    }

    // Get member count from JSONB for logging
    const memberCount = (group.members || []).length;

    console.log(
      `Deleting group "${group.name}" (ID: ${groupId}) with ${memberCount} members`
    );

    // Delete the group - this will cascade delete all related data due to foreign key constraints
    const { error: deleteError } = await supabaseServer
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (deleteError) {
      console.error("Error deleting group:", deleteError);
      return NextResponse.json(
        {
          error: "Failed to delete group",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    // Log successful deletion
    console.log(
      `Successfully deleted group "${group.name}" and all related data`
    );

    // Return success response with deletion summary
    return NextResponse.json({
      success: true,
      message: `Group "${group.name}" has been permanently deleted`,
      deleted_data: {
        group_name: group.name,
        members_removed: memberCount,
        related_data: [
          "group data",
          "group members (JSONB)",
          "join requests (JSONB)",
          "group settings (JSONB)",
        ],
      },
    });
  } catch (error: any) {
    console.error("Unexpected error during group deletion:", error);
    return NextResponse.json(
      {
        error: "Internal server error during group deletion",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
