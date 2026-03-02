"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatCard, TimeFilter } from "./stat-card";
import TopQuizzesTable from "./top-quizzes-table";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type PeriodFilter =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "all";

interface TrendData {
  current: number;
  previous: number;
  percentChange: number;
}

function getDateRange(period: PeriodFilter): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "yesterday":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "this_week":
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last_week":
      const lastWeekDay = now.getDay();
      const diffToLastMonday = lastWeekDay === 0 ? 13 : lastWeekDay + 6;
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - diffToLastMonday,
        0,
        0,
        0
      );
      const endLastWeek = new Date(start);
      endLastWeek.setDate(start.getDate() + 6);
      endLastWeek.setHours(23, 59, 59, 999);
      return { start, end: endLastWeek };
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end.setFullYear(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "this_year":
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last_year":
      start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
      end.setFullYear(now.getFullYear() - 1, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case "all":
      start = new Date(2020, 0, 1, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

function getPreviousPeriodRange(period: PeriodFilter): { start: Date; end: Date } | null {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      break;
    case "yesterday":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 23, 59, 59, 999);
      break;
    case "this_week":
      const dayOfWeek = now.getDay();
      const diffToLastMonday = dayOfWeek === 0 ? 13 : dayOfWeek + 6;
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - diffToLastMonday,
        0,
        0,
        0
      );
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case "last_week":
      const lastWeekDay = now.getDay();
      const diffToTwoWeeksAgoMonday = lastWeekDay === 0 ? 20 : lastWeekDay + 13;
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - diffToTwoWeeksAgoMonday,
        0,
        0,
        0
      );
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      break;
    case "this_year":
      start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    case "last_year":
      start = new Date(now.getFullYear() - 2, 0, 1, 0, 0, 0);
      end = new Date(now.getFullYear() - 2, 11, 31, 23, 59, 59, 999);
      break;
    default:
      return null;
  }

  return { start, end };
}
export default function EvaluationContent() {
  const { profileId, user, loading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodFilter>("this_month");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/evaluation");
    }
  }, [user, loading, router]);

  const [loadingData, setLoadingData] = useState(true);
  const [totalGames, setTotalGames] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [uniqueQuizCount, setUniqueQuizCount] = useState(0);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [topQuizzes, setTopQuizzes] = useState<any[]>([]);

  const fetchDataForPeriod = async (start: Date, end: Date) => {
    if (!profileId) return { totalGames: 0, avgScore: 0, uniqueQuizzes: 0, sessionsData: [] };

    const { data: sessionsData, error: sessionsError } = await supabase
      .from("game_sessions")
      .select(`id, quiz_id, started_at, ended_at, participants, application, quizzes (id, title)`)
      .not("ended_at", "is", null)
      .eq("status", "finished")
      .gte("ended_at", start.toISOString())
      .lte("ended_at", end.toISOString());

    if (sessionsError) {
      console.error(sessionsError);
      return { totalGames: 0, avgScore: 0, uniqueQuizzes: 0, sessionsData: [] };
    }

    let totalParticipations = 0;
    let totalScoreSum = 0;
    const quizIds = new Set<string>();

    (sessionsData || []).forEach((session: any) => {
      const participants = session.participants || [];
      const userParticipation = participants.find((p: any) => p.user_id === profileId);

      if (userParticipation) {
        totalParticipations++;
        if (userParticipation.score !== undefined) {
          totalScoreSum += userParticipation.score || 0;
        }

        let foundTitle = "Unknown Quiz";
        if (session.quizzes) {
          foundTitle = Array.isArray(session.quizzes)
            ? session.quizzes[0]?.title
            : session.quizzes.title;
        }
        quizIds.add(session.quiz_id || foundTitle);
      }
    });

    return {
      totalGames: totalParticipations,
      avgScore: totalParticipations > 0 ? Math.round(totalScoreSum / totalParticipations) : 0,
      uniqueQuizzes: quizIds.size,
      sessionsData: sessionsData || []
    };
  };

  const fetchData = async () => {
    if (!user || !profileId) return;

    try {
      setLoadingData(true);
      const { start, end } = getDateRange(period);

      const currentData = await fetchDataForPeriod(start, end);

      setTotalGames(currentData.totalGames);
      setAvgScore(currentData.avgScore);
      setUniqueQuizCount(currentData.uniqueQuizzes);

      // Fetch previous period for trend
      const previousRange = getPreviousPeriodRange(period);
      if (previousRange) {
        const previousData = await fetchDataForPeriod(previousRange.start, previousRange.end);
        const percentChange =
          previousData.totalGames > 0
            ? Math.round(
                ((currentData.totalGames - previousData.totalGames) / previousData.totalGames) * 100
              )
            : currentData.totalGames > 0
              ? 100
              : 0;

        setTrendData({
          current: currentData.totalGames,
          previous: previousData.totalGames,
          percentChange
        });
      } else {
        setTrendData(null);
      }

      // Process quiz stats
      const quizStatsMap: Map<
        string,
        { title: string; count: number; totalScore: number; participantCount: number }
      > = new Map();

      (currentData.sessionsData || []).forEach((session: any) => {
        const participants = session.participants || [];
        const quiz = Array.isArray(session.quizzes) ? session.quizzes[0] : session.quizzes;

        const quizTitle = quiz?.title || "Unknown Quiz";
        const quizId = session.quiz_id || quizTitle;

        const userParticipation = participants.find((p: any) => p.user_id === profileId);

        if (userParticipation) {
          const existing = quizStatsMap.get(quizId);
          if (existing) {
            existing.count++;
            if (userParticipation.score !== undefined) {
              existing.totalScore += userParticipation.score;
              existing.participantCount++;
            }
          } else {
            quizStatsMap.set(quizId, {
              title: quizTitle,
              count: 1,
              totalScore: userParticipation.score || 0,
              participantCount: userParticipation.score !== undefined ? 1 : 0
            });
          }
        }
      });

      const quizStatsArray = Array.from(quizStatsMap.entries())
        .map(([quizId, stats]) => ({
          id: quizId,
          name: stats.title,
          plays: stats.count,
          avgScore:
            stats.participantCount > 0 ? Math.round(stats.totalScore / stats.participantCount) : 0
        }))
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 10)
        .map((q, index) => ({
          ...q,
          rank: index + 1
        }));

      setTopQuizzes(quizStatsArray);
    } catch (error) {
      console.error("Error fetching evaluation data:", error);
      toast.error("Gagal memuat data evaluasi");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profileId, period]);

  const getTrendColor = () => {
    if (!trendData) return "text-muted-foreground";
    if (trendData.percentChange > 0) return "text-green-500";
    if (trendData.percentChange < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const getTrendIcon = () => {
    if (!trendData) return <Minus className="h-4 w-4" />;
    if (trendData.percentChange > 0) return <TrendingUp className="h-4 w-4" />;
    if (trendData.percentChange < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const handleQuizClick = (quizId: string) => {
    const { start, end } = getDateRange(period);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];
    router.push(`/evaluation/${quizId}?start=${startStr}&end=${endStr}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Evaluation</h1>
        <TimeFilter period={period} setPeriod={setPeriod} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Play" value={loadingData ? "..." : totalGames.toString()} icon="play" />
        <StatCard
          title="Avg. Score"
          value={loadingData ? "..." : avgScore.toString()}
          icon="target"
        />
        <StatCard
          title="Quizzes"
          value={loadingData ? "..." : uniqueQuizCount.toString()}
          icon="help"
        />

        <div className="bg-card text-card-foreground rounded-2xl border shadow-sm">
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm uppercase">Trend</p>
              <div className={getTrendColor()}>{getTrendIcon()}</div>
            </div>
            {loadingData ? (
              <div className="text-3xl font-bold">...</div>
            ) : trendData ? (
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">
                  {trendData.percentChange > 0 ? "+" : ""}
                  {trendData.percentChange}%
                </div>
                <span className="text-muted-foreground text-sm">vs period</span>
              </div>
            ) : (
              <div className="text-3xl font-bold">-</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Quiz Table */}
      <TopQuizzesTable quizzes={topQuizzes} loading={loadingData} onQuizClick={handleQuizClick} />
    </div>
  );
}
