import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties (Next.js 15+ requirement)
    const { id: userId } = await params;

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

    if (!["admin", "moderator"].includes(profile?.role)) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }

    // Get user violations using the database function
    const { data: violations, error: violationsError } = await supabase.rpc(
      "get_user_violations",
      { target_user_id: userId }
    );

    if (violationsError) {
      console.error("Error fetching user violations:", violationsError);
      return NextResponse.json(
        { error: "Failed to fetch user violations" },
        { status: 500 }
      );
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id, username, email, avatar_url, created_at")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      success: true,
      user: userProfile,
      violations: violations || [],
    });
  } catch (error) {
    console.error("Error in get user violations API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties (Next.js 15+ requirement)
    const { id: userId } = await params;
    const body = await request.json();
    const {
      violationType,
      reason,
      description,
      severity = "low",
      expiresAt,
    } = body;

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

    if (!["admin", "moderator"].includes(profile?.role)) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!violationType || !reason) {
      return NextResponse.json(
        { error: "Violation type and reason are required" },
        { status: 400 }
      );
    }

    // Validate violation type
    const validViolationTypes = [
      "warning",
      "temporary_ban",
      "permanent_ban",
      "content_removal",
    ];
    if (!validViolationTypes.includes(violationType)) {
      return NextResponse.json(
        { error: "Invalid violation type" },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ["low", "medium", "high", "critical"];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: "Invalid severity level" },
        { status: 400 }
      );
    }

    // Create violation
    const violationData: any = {
      user_id: userId,
      violation_type: violationType,
      reason: reason.trim(),
      description: description?.trim() || null,
      severity,
      created_by: user.id,
    };

    // Add expiration date for temporary bans
    if (violationType === "temporary_ban" && expiresAt) {
      violationData.expires_at = expiresAt;
    }

    const { data: violation, error: insertError } = await supabase
      .from("violations")
      .insert(violationData)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating violation:", insertError);
      return NextResponse.json(
        { error: "Failed to create violation" },
        { status: 500 }
      );
    }

    // Log admin action
    const { error: actionError } = await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: violationType === "warning" ? "user_warned" : "user_banned",
      target_user_id: userId,
      description: `Applied ${violationType}: ${reason}`,
      metadata: {
        violation_id: violation.id,
        severity,
        expires_at: expiresAt || null,
      },
    });

    if (actionError) {
      console.error("Error logging admin action:", actionError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      violation: {
        id: violation.id,
        violation_type: violation.violation_type,
        reason: violation.reason,
        severity: violation.severity,
        created_at: violation.created_at,
      },
    });
  } catch (error) {
    console.error("Error in create violation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
