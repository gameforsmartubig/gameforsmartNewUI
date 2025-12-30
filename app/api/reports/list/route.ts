import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "all";
    const reportType = searchParams.get("reportType") || "all";
    const isAdminView = searchParams.get("adminView") === "true";

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

    // Check if user is admin for admin view
    if (isAdminView) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, role")
        .eq("auth_user_id", user.id)
        .single();

      if (
        !profile?.is_admin &&
        !["admin", "moderator"].includes(profile?.role)
      ) {
        return NextResponse.json(
          { error: "Admin privileges required" },
          { status: 403 }
        );
      }
    }

    // Build query
    let query = supabase.from("reports").select(`
        id,
        reporter_id,
        reported_user_id,
        reported_content_type,
        reported_content_id,
        report_type,
        title,
        description,
        evidence_url,
        status,
        admin_notes,
        resolved_by,
        resolved_at,
        created_at,
        updated_at,
        reporter:reporter_id(id, username, avatar_url),
        reported_user:reported_user_id(id, username, avatar_url),
        resolver:resolved_by(id, username)
      `);

    // Apply filters based on user role
    if (!isAdminView) {
      // Regular users can only see their own reports
      query = query.eq("reporter_id", user.id);
    }

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Apply report type filter
    if (reportType !== "all") {
      query = query.eq("report_type", reportType);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: reports, error: queryError, count } = await query;

    if (queryError) {
      console.error("Error fetching reports:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("reports")
      .select("id", { count: "exact", head: true });

    if (!isAdminView) {
      countQuery = countQuery.eq("reporter_id", user.id);
    }
    if (status !== "all") {
      countQuery = countQuery.eq("status", status);
    }
    if (reportType !== "all") {
      countQuery = countQuery.eq("report_type", reportType);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      success: true,
      reports: reports || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in list reports API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
