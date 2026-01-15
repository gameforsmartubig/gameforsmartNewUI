import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Location filters
    const countryId = searchParams.get("countryId");
    const stateId = searchParams.get("stateId");
    const cityId = searchParams.get("cityId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Allow search if query >= 2 chars OR if location filter is set
    if (query.length < 2 && !countryId) {
      return NextResponse.json({ data: [] });
    }

    // Get profile.id (XID) from either auth_user_id (UUID) or profiles.id (XID)
    let userIdStr: string;

    // Try by auth_user_id first (most common)
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, auth_user_id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (!profileData) {
      // Fallback: Try by id (XID)
      const { data: profileByIdData } = await supabase
        .from("profiles")
        .select("id, auth_user_id")
        .eq("id", userId)
        .maybeSingle();

      if (!profileByIdData) {
        console.error("User profile not found:", { userId, error: profileError });
        return NextResponse.json({ error: "User profile not found" }, { status: 404 });
      }
      userIdStr = profileByIdData.id;
    } else {
      userIdStr = profileData.id; // This is the XID from profiles.id
    }

    // Search for users excluding the current user (by XID, not auth_user_id)
    let searchQuery = supabase
      .from("profiles")
      .select(
        "id, username, fullname, nickname, avatar_url, last_active, country_id, state_id, city_id, countries (name), states (name), cities (name)"
      )
      .neq("id", userIdStr); // Exclude by XID

    // Apply text search if query provided
    if (query && query.length >= 2) {
      searchQuery = searchQuery.or(`username.ilike.%${query}%,fullname.ilike.%${query}%`);
    }

    // Apply location filters
    if (countryId) {
      searchQuery = searchQuery.eq("country_id", parseInt(countryId));
    }
    if (stateId) {
      searchQuery = searchQuery.eq("state_id", parseInt(stateId));
    }
    if (cityId) {
      searchQuery = searchQuery.eq("city_id", parseInt(cityId));
    }

    const { data: users, error: searchError } = await searchQuery.limit(limit);

    if (searchError) throw searchError;

    if (!users || users.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get follow status for each user
    // users.id is already XID (TEXT) from profiles table
    const userIds = users.map((u) => u.id);

    // Build separate queries for better compatibility with XID
    const { data: outgoingRelations, error: outgoingError } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id, status")
      .eq("requester_id", userIdStr)
      .in("addressee_id", userIds);

    if (outgoingError) throw outgoingError;

    const { data: incomingRelations, error: incomingError } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id, status")
      .eq("addressee_id", userIdStr)
      .in("requester_id", userIds);

    if (incomingError) throw incomingError;

    // Combine both relations
    const followRelations = [...(outgoingRelations || []), ...(incomingRelations || [])];

    // Process results with follow status
    const processedResults = users.map((user) => {
      const userIdString = user.id; // Already XID (TEXT)

      // Check if current user follows this user (current user is requester)
      const isFollowing =
        followRelations?.some(
          (rel) =>
            rel.requester_id === userIdStr &&
            rel.addressee_id === userIdString &&
            rel.status === "accepted"
        ) || false;

      // Check if this user follows current user (this user is requester)
      const isFollowedBy =
        followRelations?.some(
          (rel) =>
            rel.requester_id === userIdString &&
            rel.addressee_id === userIdStr &&
            rel.status === "accepted"
        ) || false;

      // Check if they are friends (mutual accepted status)
      const areFriends =
        followRelations?.some(
          (rel) =>
            rel.requester_id === userIdStr &&
            rel.addressee_id === userIdString &&
            rel.status === "accepted"
        ) &&
        followRelations?.some(
          (rel) =>
            rel.requester_id === userIdString &&
            rel.addressee_id === userIdStr &&
            rel.status === "accepted"
        );

      // Check if current user blocked this user
      const isBlocked =
        followRelations?.some(
          (rel) =>
            rel.requester_id === userIdStr &&
            rel.addressee_id === userIdString &&
            rel.status === "blocked"
        ) || false;

      // Check if this user blocked current user
      const isBlockedBy =
        followRelations?.some(
          (rel) =>
            rel.requester_id === userIdString &&
            rel.addressee_id === userIdStr &&
            rel.status === "blocked"
        ) || false;

      let follow_status = "none";
      if (isBlocked) follow_status = "blocked";
      else if (isBlockedBy) follow_status = "blocked_by";
      else if (areFriends) follow_status = "friends";
      else if (isFollowing && isFollowedBy) follow_status = "mutual";
      else if (isFollowing) follow_status = "following";
      else if (isFollowedBy) follow_status = "followed_by";

      return {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        nickname: (user as any).nickname,
        avatar_url: user.avatar_url,
        last_active: user.last_active,
        is_online:
          user.last_active && new Date(user.last_active) > new Date(Date.now() - 15 * 60 * 1000),
        countries: (user as any).countries,
        states: (user as any).states,
        cities: (user as any).cities,
        follow_status,
        is_following: isFollowing,
        is_followed_by: isFollowedBy,
        is_blocked: isBlocked,
        is_blocked_by: isBlockedBy
      };
    });

    return NextResponse.json({ data: processedResults });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
