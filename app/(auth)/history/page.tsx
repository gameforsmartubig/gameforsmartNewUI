import { generateMeta } from "@/lib/utils";
import QuizHistoryTabs from "./components/historytabs";
import { createClient } from "@/lib/supabase-server";

export async function generateMetadata() {
  return generateMeta({
    title: "History",
    description: "Track your quiz participation and hosting activity in one place.",
    canonical: "/quiz-history"
  });
}

export type QuizActivityType = "host" | "player";

export interface QuizHistory {
  id: string;
  quiztitle: string;
  ended_at: string;
  application: string;
  role: QuizActivityType;
  hostName?: string;
}

async function getQuizHistory(): Promise<QuizHistory[]> {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) return [];

  const profileId = (profile as any).id;

  const { data: sessions, error } = await supabase
    .from("game_sessions")
    .select("id, host_id, ended_at, application, participants, quizzes(title), quiz_detail")
    .eq("status", "finished")
    .or(`host_id.eq.${profileId},participants.cs.[{"id":"${profileId}"}]`)
    .order("ended_at", { ascending: false });

  if (error || !sessions) {
    console.error("Error fetching history:", error);
    return [];
  }

  const hostIds = Array.from(new Set(sessions.map((s: any) => s.host_id).filter(Boolean)));
  const { data: hosts } = await supabase
    .from("profiles")
    .select("id, fullname, nickname")
    .in("id", hostIds);

  const hostMap: Record<string, string> = {};
  if (hosts) {
    hosts.forEach((h: any) => {
      hostMap[h.id] = h.fullname || h.nickname || "Unknown Host";
    });
  }

  const results: QuizHistory[] = [];

  for (const sessionData of sessions) {
    const session: any = sessionData;
    const isHost = session.host_id === profileId;

    const members = Array.isArray(session.participants) ? session.participants : [];
    const isParticipant = members.some((p: any) => p.user_id === profileId);

    let quiztitle = "Unknown Quiz";
    if (session.quizzes && (session.quizzes as any).title) {
      quiztitle = (session.quizzes as any).title;
    } else if (session.quiz_detail && (session.quiz_detail as any).title) {
      quiztitle = (session.quiz_detail as any).title;
    }

    const application = session.application || "Unknown Application";

    const dateObj = session.ended_at ? new Date(session.ended_at) : new Date();
    const ended_at = dateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    if (isHost) {
      results.push({
        id: `${session.id}-host`,
        quiztitle,
        ended_at,
        application,
        role: "host"
      });
    }

    if (isParticipant) {
      results.push({
        id: `${session.id}-player`,
        quiztitle,
        ended_at,
        application,
        role: "player",
        hostName: hostMap[session.host_id] || "Unknown Host"
      });
    }
  }

  return results;
}

export default async function QuizHistoryPage() {
  const data = await getQuizHistory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">History</h1>
      </div>

      {/* Client Tabs */}
      <QuizHistoryTabs data={data} />
    </div>
  );
}
