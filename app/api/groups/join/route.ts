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

// POST - Join group by invite code
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
    const { invite_code } = body;

    // Validate input
    if (!invite_code || invite_code.trim().length === 0) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    // Get user profile to get XID
    const { data: userProfile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !userProfile) {
      console.error("Error fetching user profile:", profileError);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const userId = userProfile.id; // XID of the user

    // Check if user is already in maximum groups (15) by counting groups where user is in members JSONB
    const { data: allGroups, error: allGroupsError } = await supabaseServer
      .from("groups")
      .select("id, members");

    if (allGroupsError) {
      console.error("Error checking memberships:", allGroupsError);
      return NextResponse.json(
        { error: "Failed to check memberships" },
        { status: 500 }
      );
    }

    // Count groups where user is a member
    const userGroupsCount = allGroups?.filter((group) => {
      const members = group.members || [];
      return members.some((m: any) => m.user_id === userId);
    }).length || 0;

    if (userGroupsCount >= 15) {
      return NextResponse.json(
        { error: "You can only join maximum 15 groups" },
        { status: 400 }
      );
    }

    // Find the group by invite code and get settings and members
    const { data: targetGroup, error: groupError } = await supabaseServer
      .from("groups")
      .select("id, name, settings, members")
      .eq("invite_code", invite_code.trim().toUpperCase())
      .single();

    if (groupError) {
      console.error("Error finding group:", groupError);
      return NextResponse.json(
        { error: "Invalid invite code or group not found" },
        { status: 400 }
      );
    }

    // Check if group is full by counting members in JSONB
    const currentMembers = targetGroup.members || [];
    const memberCount = currentMembers.length;
    const maxMembers = parseInt(targetGroup.settings?.max_members || "50");

    if (memberCount >= maxMembers) {
      return NextResponse.json({ error: "Group is full" }, { status: 400 });
    }

    // Check if user is already in this specific group
    const isAlreadyMember = currentMembers.some(
      (m: any) => m.user_id === userId
    );

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: "You are already a member of this group" },
        { status: 400 }
      );
    }

    // Check if admin approval is required
    const requiresApproval =
      targetGroup.settings?.admins_approval || false;

    if (requiresApproval) {
      // Get current join_requests from group
      const { data: groupWithRequests, error: requestsError } =
        await supabaseServer
          .from("groups")
          .select("join_requests")
          .eq("id", targetGroup.id)
          .single();

      if (requestsError) {
        console.error("Error fetching join requests:", requestsError);
        return NextResponse.json(
          { error: "Failed to check pending requests" },
          { status: 500 }
        );
      }

      // Check if user already has a pending request
      const existingRequests = groupWithRequests?.join_requests || [];
      const existingRequest = existingRequests.find(
        (req: any) => req.user_id === userId && req.status === "pending"
      );

      if (existingRequest) {
        return NextResponse.json(
          {
            error: "You already have a pending request for this group",
            requiresApproval: true,
            status: "pending",
          },
          { status: 400 }
        );
      }

      // Get user info for the request
      const { data: requestingUser, error: userError } = await supabaseServer
        .from("profiles")
        .select("id, username, fullname, avatar_url")
        .eq("id", userId)
        .single();

      if (userError || !requestingUser) {
        console.error("Error fetching user info:", userError);
        return NextResponse.json(
          { error: "Failed to fetch user info" },
          { status: 500 }
        );
      }

      // Create new join request object
      const newRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        user: {
          username: requestingUser.username,
          fullname: requestingUser.fullname || requestingUser.username,
          avatar_url: requestingUser.avatar_url,
        },
        invite_code_used: invite_code.trim().toUpperCase(),
        status: "pending",
        requested_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // Add to join_requests array
      const updatedRequests = [...existingRequests, newRequest];

      // Update group with new request
      const { error: updateError } = await supabaseServer
        .from("groups")
        .update({ join_requests: updatedRequests })
        .eq("id", targetGroup.id);

      if (updateError) {
        console.error("Error creating join request:", updateError);
        return NextResponse.json(
          { error: "Failed to create join request" },
          { status: 500 }
        );
      }

      // Get group data to find owners and admins from JSONB members
      const { data: groupData, error: groupDataError } = await supabaseServer
        .from("groups")
        .select("members, creator_id")
        .eq("id", targetGroup.id)
        .single();

      if (!groupDataError && groupData) {
        const userName =
          requestingUser.fullname || requestingUser.username || "Someone";

        // Get all owners and admins from JSONB members
        const members = groupData.members || [];
        const adminMembers = members.filter(
          (m: any) => m.role === "owner" || m.role === "admin"
        );

        // Also include creator if not in members list
        const adminUserIds = adminMembers.map((m: any) => m.user_id);
        if (
          groupData.creator_id &&
          !adminUserIds.includes(groupData.creator_id)
        ) {
          adminUserIds.push(groupData.creator_id);
        }

        // Get auth_user_id for all admins
        if (adminUserIds.length > 0) {
          const { data: adminProfiles, error: profilesError } =
            await supabaseServer
              .from("profiles")
              .select("id, auth_user_id")
              .in("id", adminUserIds);

          if (!profilesError && adminProfiles) {
            // Send notification to all owners and admins
            for (const profile of adminProfiles) {
              if (profile.auth_user_id) {
                await supabaseServer.rpc("add_user_notification", {
                  p_user_id: profile.auth_user_id,
                  p_type: "group_join_request",
                  p_title: "📝 Permintaan Bergabung Grup",
                  p_message: `${userName} ingin bergabung ke grup "${targetGroup.name}"`,
                  p_data: {
                    group_id: targetGroup.id,
                    group_name: targetGroup.name,
                    requester_id: userId,
                    requester_name: userName,
                    invite_code: invite_code.trim().toUpperCase(),
                  },
                });
              }
            }
          }
        }
      }

      return NextResponse.json(
        {
          message:
            "Join request submitted successfully. Waiting for admin approval.",
          requiresApproval: true,
          status: "pending",
          group: {
            id: targetGroup.id,
            name: targetGroup.name,
          },
        },
        { status: 200 }
      );
    }

    // Join the group directly (no approval required)
    // Get group data and user profile
    const { data: groupDetails, error: detailsError } = await supabaseServer
      .from("groups")
      .select(
        `
        id,
        name,
        description,
        avatar_url,
        invite_code,
        settings,
        created_at,
        members
      `
      )
      .eq("invite_code", invite_code.trim().toUpperCase())
      .single();

    if (detailsError || !groupDetails) {
      console.error("Error fetching group details:", detailsError);
      return NextResponse.json(
        { error: "Failed to fetch group details" },
        { status: 500 }
      );
    }

    // Add user to members JSONB array (normalized structure)
    // Only store user_id and role
    // Username, fullname, avatar_url will be fetched from profiles table via JOIN
    const groupMembers = groupDetails.members || [];
    const newMember = {
      user_id: userId,
      role: "member",
    };

    const updatedMembers = [...groupMembers, newMember];

    // Update group with new member
    const { error: updateError } = await supabaseServer
      .from("groups")
      .update({ members: updatedMembers })
      .eq("id", targetGroup.id);

    if (updateError) {
      console.error("Error adding member to group:", updateError);
      return NextResponse.json(
        { error: "Failed to join group" },
        { status: 500 }
      );
    }

    // Remove members from response to avoid sending large JSONB
    const { members, ...groupResponse } = groupDetails;

    return NextResponse.json(
      {
        message: "Successfully joined group",
        group: groupResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/groups/join:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
