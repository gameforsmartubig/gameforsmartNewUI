import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      reportedUserId,
      reportedContentType,
      reportedContentId,
      reportType,
      title,
      description,
      evidenceUrl
    } = body;

    // Get the current user
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace("Bearer ", "");

    // Get user from auth token
    const {
      data: { user },
      error: authError
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid authorization token" }, { status: 401 });
    }

    // Get the user's profile ID (text/xid format)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Validate required fields
    if (!reportedContentType || !reportType || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate report type
    const validReportTypes = [
      "bug_teknis",
      "gambar_tidak_muncul",
      "konten_tidak_pantas",
      "soal_tidak_jelas",
      "lainnya",
      // Keep old types for backward compatibility
      "harassment",
      "inappropriate_content",
      "cheating",
      "spam",
      "hate_speech",
      "impersonation",
      "copyright",
      "other"
    ];

    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    // Validate content type
    const validContentTypes = ["user", "quiz", "game_session", "message"];
    if (!validContentTypes.includes(reportedContentType)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    // Create the report using the safe function
    const { data: reportId, error: insertError } = await supabaseAdmin.rpc("create_report", {
      reporter_id_param: profile.id, // Use profile ID (text/xid)
      reported_content_type_param: reportedContentType,
      report_type_param: reportType,
      title_param: title || `Report: ${reportType}`,
      description_param: description,
      reported_user_id_param: reportedUserId || null,
      reported_content_id_param: reportedContentId || null,
      evidence_url_param: evidenceUrl || null
    });

    if (insertError) {
      console.error("Error creating report:", insertError);
      return NextResponse.json(
        { error: "Failed to create report", details: insertError.message },
        { status: 500 }
      );
    }

    // Get the created report details
    const { data: report, error: fetchError } = await supabaseAdmin
      .from("reports")
      .select("id, status, created_at")
      .eq("id", reportId)
      .single();

    if (fetchError) {
      console.error("Error fetching created report:", fetchError);
      // Report was created, just couldn't fetch details
      return NextResponse.json({
        success: true,
        message: "Report created successfully",
        reportId
      });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        status: report.status,
        created_at: report.created_at
      }
    });
  } catch (error) {
    console.error("Error in create report API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
