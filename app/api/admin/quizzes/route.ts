import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "all";
    const isPublic = url.searchParams.get("isPublic") || "all";

    // Build query
    let query = supabase.from("quizzes").select(`
        id,
        title,
        description,
        created_at,
        updated_at,
        creator_id,
        is_public,
        category,
        language,
        image_url,
        questions (id),
        profiles!quizzes_creator_id_fkey (
          id,
          username,
          email,
          is_banned,
          is_suspended
        )
      `);

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply category filter
    if (category !== "all") {
      query = query.eq("category", category);
    }

    // Apply public/private filter
    if (isPublic !== "all") {
      query = query.eq("is_public", isPublic === "true");
    }

    // Get total count for pagination
    const { count: totalCount } = await query.select("id", {
      count: "exact",
      head: true,
    });

    // Apply pagination and get data
    const offset = (page - 1) * limit;
    const { data: quizzes, error: queryError } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) {
      console.error("Error fetching quizzes:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch quizzes" },
        { status: 500 }
      );
    }

    // Transform the data
    const transformedQuizzes = (quizzes || []).map((quiz) => {
      const profile = quiz.profiles as any;
      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        created_at: quiz.created_at,
        updated_at: quiz.updated_at,
        creator_id: quiz.creator_id,
        is_public: quiz.is_public,
        category: quiz.category,
        language: quiz.language,
        image_url: quiz.image_url,
        questions_count: quiz.questions?.length || 0,
        creator: {
          id: profile?.id,
          username: profile?.username,
          email: profile?.email,
          is_banned: profile?.is_banned || false,
          is_suspended: profile?.is_suspended || false,
        },
      };
    });

    return NextResponse.json({
      success: true,
      quizzes: transformedQuizzes,
      pagination: {
        total: totalCount || 0,
        page,
        limit,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasNext: page < Math.ceil((totalCount || 0) / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching admin quizzes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
