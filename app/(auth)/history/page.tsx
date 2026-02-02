import { generateMeta } from "@/lib/utils";
import { HistoryContent } from "./components/history-content";
import { createClient } from "@/lib/supabase-server";
import type { HistoryItem } from "./components/types";
import rawCategories from "@/data/categories.json";

export async function generateMetadata() {
  return generateMeta({
    title: "History",
    description: "View your quiz play history and performance.",
    canonical: "/history"
  });
}

export default async function HistoryPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Please login to view your history.</p>
      </div>
    );
  }

  // Get profile ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  const profileId = (profile as any).id;

  // Fetch finished game sessions
  const { data: rawSessions, error } = await supabase
    .from("game_sessions")
    .select("id, host_id, quiz_detail, participants, responses, total_time_minutes, question_limit, started_at")
    .eq("status", "finished")
    .order("started_at", { ascending: false });

  if (error) {
    console.error("Error fetching history:", error);
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Failed to load history.</p>
      </div>
    );
  }

  const sessions = rawSessions as any[];

  // Filter sessions where current user participated or hosted ONLY
  const historyItems: HistoryItem[] = [];

  for (const session of sessions || []) {
    // 1. Check if user is Host
    const isHost = session.host_id === profileId;
    
    // 2. Check if user is Participant
    const participants = (session.participants as any[]) || [];
    const participant = participants.find((p: any) => p.user_id === profileId);

    // STRICT GUARD: If user is neither Host NOR Participant, SKIP immediately.
    // This prevents seeing other people's sessions.
    if (!isHost && !participant) {
      continue;
    }

    const responses = (session.responses as any[]) || [];
    const userResponse = participant 
      ? responses.find((r: any) => r.participant === participant.id)
      : null;

    const quizDetail = session.quiz_detail as any;

    historyItems.push({
      id: `${session.id}-${participant?.id || 'host'}`, // Unique ID for key
      sessionId: session.id,
      quizTitle: quizDetail?.title || "Untitled Quiz",
      category: quizDetail?.category || "general",
      questionCount: parseInt(session.question_limit) || userResponse?.total_question || 0,
      durationMinutes: session.total_time_minutes || 0,
      score: userResponse?.score || 0,
      accuracy: userResponse?.accuracy || "0",
      playedAt: session.started_at,
      isHost: isHost
    });
  }

  // Get categories for filter
  const categories = rawCategories.map((cat) => ({
    id: cat.id,
    title: cat.title
  }));

  return <HistoryContent items={historyItems} categories={categories} />;
}

