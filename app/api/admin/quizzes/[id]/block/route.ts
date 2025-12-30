import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties (Next.js 15+ requirement)
    const { id: quizId } = await params;

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

    // Validate quizId
    if (!quizId) {
      return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
    }

    // Get quiz info first for logging
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        title,
        creator_id,
        is_hidden,
        profiles!quizzes_creator_id_fkey (
          username,
          email
        )
      `
      )
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Get reason from request body
    const body = await request.json();
    const reason = body.reason || "No reason provided";

    // Block the quiz (set is_hidden to true and set hidden_at)
    const { error: blockError } = await supabase
      .from("quizzes")
      .update({
        is_hidden: true,
        hidden_at: new Date().toISOString(),
        hidden_reason: reason,
      })
      .eq("id", quizId);

    if (blockError) {
      console.error("Block quiz error:", blockError);
      return NextResponse.json(
        { error: `Failed to block quiz: ${blockError.message}` },
        { status: 500 }
      );
    }

    // Get quiz owner info
    const quizOwner = quiz.profiles as any;
    const ownerInfo = quizOwner
      ? `${quizOwner.username || quizOwner.email}`
      : "Unknown";

    // Log admin action
    try {
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "quiz_block",
        target_user_id: quiz.creator_id,
        target_content_type: "quiz",
        target_content_id: quizId,
        description: `Quiz blocked (hidden) by admin: "${quiz.title}" owned by ${ownerInfo}`,
        reason: reason,
        metadata: {
          quiz_title: quiz.title,
          quiz_owner: ownerInfo,
          action_type: "block",
          reason: reason,
        },
      });
    } catch (logError) {
      console.warn("Failed to log admin action:", logError);
      // Continue anyway since the main action succeeded
    }

    return NextResponse.json({
      success: true,
      message: `Quiz "${quiz.title}" has been successfully blocked (hidden)`,
      data: {
        blockedQuizId: quizId,
        blockedQuizTitle: quiz.title,
        quizOwner: ownerInfo,
        ownerId: quiz.creator_id,
      },
    });
  } catch (error) {
    console.error("Error blocking quiz:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

