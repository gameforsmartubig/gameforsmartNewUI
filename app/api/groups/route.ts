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

// Helper function to get profile XID from auth UUID
const getProfileIdFromAuthId = async (
  authUserId: string
): Promise<string | null> => {
  const { data, error } = await supabaseServer
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) {
    console.error("Error fetching profile ID:", error);
    return null;
  }

  return data?.id || null;
};

// GET - Get user's group information
export async function GET(request: NextRequest) {
  try {
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

    // Get user's profile XID
    const profileId = await getProfileIdFromAuthId(user.id);
    if (!profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get groups where user is a member (from JSONB members column)
    const { data: allGroups, error: groupsError } = await supabaseServer
      .from("groups")
      .select(
        "id, name, description, avatar_url, invite_code, settings, members, created_at, creator_id"
      );

    if (groupsError) {
      console.error("Error fetching groups:", groupsError);
      return NextResponse.json(
        { error: "Failed to fetch groups" },
        { status: 500 }
      );
    }

    // Find groups where user is a member or creator
    const userGroups = (allGroups || []).filter((group) => {
      // Check if user is creator (compare XID with XID)
      if (group.creator_id === profileId) return true;

      // Check if user is in members JSONB
      const members = group.members || [];
      return members.some((member: any) => member.user_id === profileId);
    });

    let userGroup = null;
    if (userGroups.length > 0) {
      const group = userGroups[0]; // Get first group
      const members = group.members || [];

      // Get user role
      let userRole = "member";
      if (group.creator_id === profileId) {
        userRole = "owner";
      } else {
        const userMember = members.find(
          (member: any) => member.user_id === profileId
        );
        userRole = userMember?.role || "member";
      }

      userGroup = {
        group_id: group.id,
        group_name: group.name,
        group_description: group.description,
        group_avatar_url: group.avatar_url,
        member_role: userRole,
        member_count: members.length,
        invite_code: group.invite_code,
        max_members: group.settings?.max_members || "50",
        status: group.settings?.status || "private",
        created_at: group.created_at,
        joined_at: null, // Could be derived from members JSONB if needed
      };
    }

    return NextResponse.json({
      group: userGroup,
      hasGroup: !!userGroup,
    });
  } catch (error) {
    console.error("Error in GET /api/groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new group
export async function POST(request: NextRequest) {
  try {
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
    const { name, description, avatar_url, status } = body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "Group name must be 50 characters or less" },
        { status: 400 }
      );
    }

    if (description && description.length > 200) {
      return NextResponse.json(
        { error: "Description must be 200 characters or less" },
        { status: 400 }
      );
    }

    // Validate status
    const groupStatus = status || "private";
    if (!["public", "private", "secret"].includes(groupStatus)) {
      return NextResponse.json(
        { error: "Invalid status. Must be public, private, or secret" },
        { status: 400 }
      );
    }

    // Get user's profile XID
    const profileId = await getProfileIdFromAuthId(user.id);
    if (!profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if user already created maximum groups (5)
    const { data: createdGroups, error: checkError } = await supabaseServer
      .from("groups")
      .select("id")
      .eq("creator_id", profileId);

    if (checkError) {
      console.error("Error checking existing groups:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing groups" },
        { status: 500 }
      );
    }

    if (createdGroups && createdGroups.length >= 5) {
      return NextResponse.json(
        { error: "You can only create maximum 5 groups" },
        { status: 400 }
      );
    }

    // Check if user is already in maximum groups (15) by checking JSONB members column
    const { data: allGroups, error: memberError } = await supabaseServer
      .from("groups")
      .select("id, members, creator_id");

    if (memberError) {
      console.error("Error checking group memberships:", memberError);
      return NextResponse.json(
        { error: "Failed to check group memberships" },
        { status: 500 }
      );
    }

    // Count groups where user is member or creator
    let userGroupCount = 0;
    if (allGroups) {
      userGroupCount = allGroups.filter((group) => {
        // Check if user is creator (compare XID with XID)
        if (group.creator_id === profileId) return true;

        // Check if user is in members JSONB
        const members = group.members || [];
        return members.some((member: any) => member.user_id === user.id);
      }).length;
    }

    if (userGroupCount >= 15) {
      return NextResponse.json(
        { error: "You can only be in maximum 15 groups" },
        { status: 400 }
      );
    }

    // Generate unique invite code
    const generateInviteCode = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    let inviteCode = generateInviteCode();

    // Ensure invite code is unique
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      const { data: existingCode } = await supabaseServer
        .from("groups")
        .select("id")
        .eq("invite_code", inviteCode)
        .single();

      if (!existingCode) {
        codeExists = false;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    // Prepare creator member data (normalized structure)
    // Only store user_id and role
    // Username, fullname, avatar_url will be fetched from profiles table via JOIN
    const creatorMember = {
      user_id: profileId, // Use profile XID, not auth UUID
      role: "owner",
    };

    // Create the group with default settings and creator as member
    const { data: groupDetails, error: createError } = await supabaseServer
      .from("groups")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        avatar_url: avatar_url || null,
        creator_id: profileId,
        invite_code: inviteCode,
        members: [creatorMember], // Add creator as owner immediately
        settings: {
          members_can_invite: false,
          admins_approval: groupStatus === "public" ? false : true, // Public groups don't require approval by default
          status: groupStatus,
          max_members: "50",
        },
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating group:", createError);
      return NextResponse.json(
        { error: createError.message || "Failed to create group" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Group created successfully",
        group: groupDetails,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
