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

// GET - Search public groups
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    // Search public groups
    let queryBuilder = supabaseServer
      .from("groups")
      .select(
        `
        id,
        name,
        description,
        avatar_url,
        created_at,
        settings,
        members
      `
      )
      .filter("settings->is_public", "eq", true)
      .limit(limit)
      .order("created_at", { ascending: false });

    if (query.trim()) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`
      );
    }

    const { data: groups, error } = await queryBuilder;

    if (error) {
      console.error("Error searching groups:", error);
      return NextResponse.json(
        { error: "Failed to search groups" },
        { status: 500 }
      );
    }

    // Get member count for each group from JSONB members
    const groupsWithMemberCount = (groups || []).map((group) => {
      const members = group.members || [];
      return {
        ...group,
        member_count: members.length,
        max_members: group.settings?.max_members || "50",
        is_public: group.settings?.is_public || false,
      };
    });

    return NextResponse.json({
      groups: groupsWithMemberCount,
      total: groupsWithMemberCount.length,
    });
  } catch (error) {
    console.error("Error in GET /api/groups/search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
