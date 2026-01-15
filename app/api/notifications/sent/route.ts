import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const filter = searchParams.get("filter") || "all";

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Build query for sent notifications
    let query = supabase
      .from("notifications")
      .select(
        `
        id,
        type,
        title,
        message,
        data,
        is_read,
        created_at,
        receiver:profiles!notifications_user_id_fkey (
          id,
          username,
          fullname,
          avatar_url
        )
      `
      )
      .eq("sender_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Apply filters
    if (filter === "pending") {
      query = query.eq("is_read", false);
    } else if (filter === "delivered") {
      query = query.eq("is_read", true);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching sent notifications:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
