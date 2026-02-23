"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import {
  Crown,
  Medal,
  Trophy,
  LayoutDashboard,
  BarChart3,
  RotateCcw,
  Download,
  Home,
  Award,
  Target,
  CheckCircle2,
  Timer
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { generateXID } from "@/lib/id-generator";
import { toast } from "sonner";
import { StatisticsView } from "./statistics-view";
import { createGameSessionRT, isRealtimeDbConfigured } from "@/lib/supabase-realtime";

// ========== TYPES & INTERFACES ==========
interface Player {
  id: string;
  name: string;
  image: string | null;
  answered: number;
  score: number; // Raw score from game
  normalizedScore: number; // Score normalized to max 100
  correctAnswers: number; // Number of correct answers
  totalQuestions: number; // Total questions in the quiz
  responses: any[]; // Raw responses
  duration?: number; // Duration in ms for tie-breaking
}

interface HostLeaderboardProps {
  players: Player[];
}

interface PlayerResultProps {
  player: Player & { rank: number; totalPlayers: number };
}

// ========== COMPONENTS ==========

// Header Navigation (shared by both views)
interface HeaderNavProps {
  isHost: boolean;
  onDashboard?: () => void;
  onRestart?: () => void;
  onExport?: () => void;
  onStatistics?: () => void;
}

function HeaderNav({ isHost, onDashboard, onRestart, onExport, onStatistics }: HeaderNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-orange-100 bg-orange-50/50 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo area */}
        <div className="flex items-center gap-2">
          <img
            src="/gameforsmartlogo.png"
            alt="Gameforsmart"
            className="h-8 w-auto opacity-90 dark:opacity-100"
          />
        </div>

        {/* Actions - Different for Host vs Player */}
        <div className="flex items-center gap-2">
          {isHost ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="button-orange gap-2"
                onClick={onDashboard}>
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="button-green gap-2"
                onClick={onStatistics}>
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Statistics</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="button-yellow-outline gap-2"
                onClick={onRestart}>
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Restart</span>
              </Button>

              <Button size="sm" className="button-orange gap-2" onClick={onExport}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="button-green gap-2"
              onClick={onStatistics}>
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">Statistics</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

// Host View: Full Leaderboard with Podium
function HostLeaderboard({ players }: HostLeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const top1 = sortedPlayers[0];
  const top2 = sortedPlayers[1];
  const top3 = sortedPlayers[2];
  const others = sortedPlayers;

  const formatDuration = (ms: number) => {
    if (!ms) return "-";
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(2)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  // Component for the list of other players
  const OtherPlayersList = () => (
    <div className="overflow-hidden rounded-xl border border-orange-200 bg-white/50 shadow-md backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <table className="w-full border-collapse">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-orange-100 bg-orange-50/50 dark:border-zinc-800 dark:bg-zinc-800/30">
            <th className="w-16 px-4 py-4 text-center text-[10px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
              Rank
            </th>
            <th className="px-4 py-4 text-left text-[10px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
              Player
            </th>
            <th className="px-4 py-4 text-center text-[10px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
              Score
            </th>
            <th className="px-4 py-4 text-right text-[10px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
              Duration
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {others.map((p, index) => {
            const rank = index + 1;
            return (
              <tr
                key={p.id}
                className="group transition-colors hover:bg-orange-50/30 dark:hover:bg-orange-500/5">
                {/* Rank Number - Centered */}
                <td className="px-4 py-3">
                  <div
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shadow-sm ${
                      rank === 1
                        ? "bg-yellow-400 text-yellow-950 ring-2 ring-yellow-200"
                        : rank === 2
                          ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                          : rank === 3
                            ? "bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                    }`}>
                    {rank}
                  </div>
                </td>

                {/* Player Info - Left Aligned */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-zinc-200 shadow-sm dark:border-zinc-700">
                      <AvatarImage src={p.image || ""} />
                      <AvatarFallback className="bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {p.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="max-w-[120px] truncate text-sm font-bold text-zinc-800 group-hover:text-orange-600 sm:max-w-full dark:text-zinc-200 dark:group-hover:text-orange-400">
                        {p.name}
                      </span>
                      {/* Tambahan subtitel jika perlu (opsional) */}
                      <span className="text-[10px] text-zinc-400 md:hidden">
                        Score: {p.normalizedScore}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Score - Centered */}
                <td className="px-4 py-3 text-center">
                  <span className="inline-block rounded-lg bg-orange-50 px-3 py-1 text-base font-black tracking-tight text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                    {p.normalizedScore}
                  </span>
                </td>

                {/* Duration - Right Aligned */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="font-mono text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {formatDuration(p.duration || 0)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="base-background flex-1 overflow-auto p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
        <div className="flex flex-col justify-center">
          <div className="mb-4 space-y-1 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-orange-600 md:text-5xl dark:text-orange-400">
              Leaderboard
            </h1>
          </div>

          {/* Podium Section */}
          <div className="flex items-end justify-center pb-2">
            <div className="flex w-full max-w-4xl items-end justify-center gap-4 px-4 md:gap-8">
              {/* Rank 2 (Hijau/Green) - Left */}
              {top2 && (
                <div className="flex w-1/3 flex-col items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-green-400 shadow-xl md:h-24 md:w-24 dark:border-green-600">
                      <AvatarImage src={top2.image || ""} alt={top2.name} />
                      <AvatarFallback className="bg-green-100 text-sm text-green-700 md:text-lg dark:bg-zinc-800 dark:text-green-400">
                        {top2.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-green-300 bg-green-200 px-3 py-0.5 text-xs font-bold text-green-800 shadow-sm dark:border-green-700 dark:bg-green-900 dark:text-green-100">
                      <span>2</span>
                    </div>
                  </div>
                  <div className="mt-1 text-center">
                    <h3 className="line-clamp-1 text-sm font-semibold text-zinc-800 md:text-lg dark:text-zinc-200">
                      {top2.name}
                    </h3>
                  </div>
                  <div className="flex h-24 w-full flex-col items-center justify-between rounded-t-2xl border-x border-t border-green-300 bg-gradient-to-t from-green-300/80 to-green-50 py-4 shadow-lg shadow-green-200/20 md:h-40 dark:border-green-800 dark:from-green-900/40 dark:to-zinc-900">
                    <div className="mt-2 text-xl font-extrabold text-green-700 md:text-3xl dark:text-green-400">
                      {top2.normalizedScore}
                    </div>
                    <Medal className="h-8 w-8 text-green-500 opacity-80 md:h-12 md:w-12" />
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold/Yellow/Orange) - Center */}
              {top1 && (
                <div className="z-10 flex w-1/3 flex-col items-center gap-3">
                  <div className="mb-1 flex flex-col items-center">
                    <Crown className="mb-2 h-8 w-8 animate-bounce text-yellow-500 md:h-12 md:w-12" />
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-4 border-orange-500 shadow-2xl ring-4 ring-yellow-400/20 md:h-32 md:w-32 dark:border-orange-600">
                        <AvatarImage src={top1.image || ""} alt={top1.name} />
                        <AvatarFallback className="bg-yellow-50 text-lg text-orange-600 md:text-2xl dark:bg-zinc-800">
                          {top1.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-yellow-500 bg-yellow-400 px-3 py-0.5 text-xs font-bold text-yellow-900 shadow-sm md:text-sm dark:bg-yellow-500 dark:text-black">
                        <Trophy className="h-3 w-3" />
                        <span>1</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 text-center">
                    <h3 className="line-clamp-1 text-base font-bold text-orange-950 md:text-2xl dark:text-orange-400">
                      {top1.name}
                    </h3>
                  </div>
                  <div className="flex h-32 w-full flex-col items-center justify-between rounded-t-2xl border-x border-t border-orange-400 bg-gradient-to-t from-yellow-300 to-yellow-50 py-6 shadow-xl shadow-orange-200/40 md:h-56 dark:border-orange-800 dark:from-orange-900/60 dark:to-zinc-900">
                    <div className="mt-2 text-3xl font-extrabold text-orange-900 md:text-6xl dark:text-yellow-400">
                      {top1.normalizedScore}
                    </div>
                    <Trophy className="h-10 w-10 text-orange-600 opacity-80 md:h-16 md:w-16 dark:text-yellow-600" />
                  </div>
                </div>
              )}

              {/* Rank 3 (Orange) - Right */}
              {top3 && (
                <div className="flex w-1/3 flex-col items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-orange-300 shadow-xl md:h-24 md:w-24 dark:border-orange-700">
                      <AvatarImage src={top3.image || ""} alt={top3.name} />
                      <AvatarFallback className="bg-orange-50 text-sm text-orange-600 md:text-lg dark:bg-zinc-800">
                        {top3.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-orange-200 bg-orange-100 px-3 py-0.5 text-xs font-bold text-orange-800 shadow-sm dark:border-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      <span>3</span>
                    </div>
                  </div>
                  <div className="mt-1 text-center">
                    <h3 className="line-clamp-1 text-sm font-semibold text-zinc-800 md:text-lg dark:text-zinc-200">
                      {top3.name}
                    </h3>
                  </div>
                  <div className="flex h-20 w-full flex-col items-center justify-between rounded-t-2xl border-x border-t border-orange-200 bg-gradient-to-t from-orange-200 to-orange-50 py-3 shadow-lg shadow-orange-100/20 md:h-32 dark:border-orange-900 dark:from-orange-950/40 dark:to-zinc-900">
                    <div className="mt-1 text-xl font-extrabold text-orange-900 md:text-3xl dark:text-orange-500">
                      {top3.normalizedScore}
                    </div>
                    <Medal className="h-6 w-6 text-orange-500 opacity-80 md:h-10 md:w-10" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Players List */}
        {others.length > 0 && (
          <div className="mx-auto w-full max-w-4xl px-4">
            <OtherPlayersList />
          </div>
        )}
      </div>
    </div>
  );
}

// Player View: Personal Result
function PlayerResult({ player }: PlayerResultProps) {
  const router = useRouter();

  const formatDuration = (ms: number) => {
    if (!ms) return "-";
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(2)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  const accuracyPercent =
    player.totalQuestions > 0
      ? Math.round((player.correctAnswers / player.totalQuestions) * 100)
      : 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center p-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-4">
        {/* Congratulations Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <Trophy className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-orange-950 dark:text-zinc-100">
              Quiz Complete!
            </h1>
          </div>
        </div>

        {/* Player Card */}
        <Card className="border-none bg-white shadow-sm drop-shadow-sm dark:bg-zinc-900">
          <CardContent className="space-y-4 p-4">
            {/* Avatar & Name - Clean Layout */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-orange-100 dark:border-zinc-700">
                <AvatarImage src={player.image || ""} alt={player.name} />
                <AvatarFallback className="bg-orange-50 text-sm text-orange-600 dark:bg-zinc-800 dark:text-orange-400">
                  {player.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left">
                <h2 className="text-base leading-tight font-bold text-orange-950 dark:text-zinc-100">
                  {player.name}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs font-medium text-orange-800/50 dark:text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    <span>
                      Rank{" "}
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        #{player.rank}
                      </span>{" "}
                      of {player.totalPlayers}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3 text-yellow-500" />
                    <span>{formatDuration(player.duration || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Score - Normalized to max 100 */}
              <div className="rounded-lg bg-orange-50 p-3 text-center dark:bg-zinc-800">
                <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-orange-800/40 uppercase dark:text-zinc-500">
                  Score
                </span>
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                  {player.normalizedScore}
                </p>
              </div>

              {/* Correct */}
              <div className="rounded-lg bg-green-500/5 p-3 text-center dark:bg-green-500/10">
                <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-green-600/70 uppercase dark:text-green-400/70">
                  Correct
                </span>
                <p className="text-2xl font-black text-green-600 dark:text-green-400">
                  {player.correctAnswers}
                  <span className="text-sm font-medium text-orange-800/30 dark:text-zinc-600">
                    /{player.totalQuestions}
                  </span>
                </p>
              </div>
            </div>

            {/* Accuracy */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-orange-400" />
                  <span className="font-medium text-orange-800/60 dark:text-zinc-500">
                    Accuracy
                  </span>
                </div>
                <span className="font-bold text-orange-900 dark:text-zinc-100">
                  {accuracyPercent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-orange-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500 ease-out"
                  style={{ width: `${accuracyPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="button-orange-outline h-10 text-sm font-semibold"
            onClick={() => router.push("/dashboard")}>
            <Home className="mr-2 h-3.5 w-3.5" />
            Home
          </Button>
          <Button
            className="button-orange h-10 text-sm font-semibold"
            onClick={() => router.push("/join")}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Leaderboard() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<
    (Player & { rank: number; totalPlayers: number }) | null
  >(null);

  // Statistics State
  const [showStats, setShowStats] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  const handleRestart = async () => {
    try {
      toast.info("Preparing new game session...");

      // 1. Get current session settings AND fetch fresh questions from the Quiz table
      const { data: currentSession, error: fetchError } = await supabase
        .from("game_sessions")
        .select(
          `
          *,
          quizzes (
            questions
          )
        `
        )
        .eq("id", id)
        .single();

      if (fetchError || !currentSession) {
        console.error("Fetch current session error:", fetchError);
        toast.error("Could not retrieve session data");
        return;
      }

      // 2. Generate new session ID first so we can pass it to RPC
      const newSessionId = generateXID();
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();

      // 3. Use RPC to get fresh, SHUFFLED questions with limit applied
      const limit = parseInt(currentSession.question_limit) || 0;

      const { data: shuffledQuestions, error: rpcError } = await supabase.rpc(
        "select_questions_for_session",
        {
          p_quiz_id: currentSession.quiz_id,
          p_session_id: newSessionId,
          p_question_limit: limit > 0 ? limit : null
        }
      );

      if (rpcError) {
        console.error("RPC Error (select_questions):", rpcError);
        toast.error("Failed to shuffle questions");
        // Don't return, fallback below will handle it
      }

      let freshQuestions = shuffledQuestions;

      // Fallback if RPC returns nothing (rare or error)
      if (!freshQuestions || freshQuestions.length === 0) {
        // Fallback logic: use existing ones from current session or quiz source
        const quizData = Array.isArray(currentSession.quizzes)
          ? currentSession.quizzes[0]
          : currentSession.quizzes;
        freshQuestions = quizData?.questions || currentSession.current_questions || [];

        // Apply limit manually for fallback
        if (limit > 0 && limit < freshQuestions.length) {
          freshQuestions = freshQuestions.slice(0, limit);
        }
      }

      if (!freshQuestions || freshQuestions.length === 0) {
        toast.error("Error: No questions found for restart.");
        return;
      }

      // 4. Generate new session object
      const newSession = {
        id: newSessionId,
        game_pin: newPin,
        quiz_id: currentSession.quiz_id,
        host_id: currentSession.host_id,
        status: "waiting",
        total_time_minutes: currentSession.total_time_minutes,
        question_limit: currentSession.question_limit,
        game_end_mode: currentSession.game_end_mode,
        allow_join_after_start: currentSession.allow_join_after_start,
        difficulty: currentSession.difficulty,
        application: currentSession.application,
        created_at: new Date().toISOString(),
        participants: [], // Explicitly empty
        current_questions: freshQuestions // use the freshly fetched questions
      };

      // 3. Create new session
      const { error: createError } = await supabase.from("game_sessions").insert(newSession);

      if (createError) {
        console.error("Create session error:", createError);
        throw createError;
      }

      // 3.5 Create Session in Realtime DB if configured
      if (isRealtimeDbConfigured) {
        const { participants, ...rtSessionData } = newSession;
        await createGameSessionRT({
          ...rtSessionData,
          current_questions: freshQuestions
        });
      }

      toast.success("New session created!");

      // 4. Navigate
      router.push(`/host/${newSessionId}/room`);
    } catch (error) {
      console.error("Restart failed:", error);
      toast.error("Failed to restart game");
    }
  };

  const handleExport = () => {
    if (players.length === 0) {
      toast.error("No player data to export");
      return;
    }

    try {
      const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

      // Define CSV headers
      const csvHeaders = [
        "Rank",
        "Name",
        "Score",
        "Correct Answers",
        "Total Questions",
        "Accuracy (%)"
      ];

      // Map player data to CSV rows
      const rows = sortedPlayers.map((p, index) => {
        const accuracy =
          p.totalQuestions > 0 ? Math.round((p.correctAnswers / p.totalQuestions) * 100) : 0;

        return [
          index + 1,
          `"${p.name.replace(/"/g, '""')}"`, // Escape quotes
          p.normalizedScore,
          p.correctAnswers,
          p.totalQuestions,
          accuracy
        ].join(",");
      });

      // Combine headers and rows
      const csvContent = [csvHeaders.join(","), ...rows].join("\n");

      // Create blobl and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `game_results_${id}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Results exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export results");
    }
  };

  useEffect(() => {
    let channel: any;

    async function fetchData() {
      console.log("=== Leaderboard Fetch Started ===");
      console.log("Session ID from URL:", id);

      try {
        const {
          data: { user },
          error: authError
        } = await supabase.auth.getUser();
        console.log("Auth User:", user?.id, "Error:", authError?.message);

        // 1. Get user's profile ID (XID format) - this matches host_id and participant.user_id
        let profileId: string | null = null;

        if (user) {
          // Authenticated user - get profile from database
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("auth_user_id", user.id)
            .single();
          profileId = profile?.id || null;
        }

        // Fallback: If no auth user or profile not found via auth (edge case), try localStorage 'user_id'
        // This is the standard "current logged in user" id stored by login
        if (!profileId) {
          profileId = localStorage.getItem("user_id");
        }

        console.log("Resolved Profile ID:", profileId);

        // 2. Fetch game session AND questions
        const { data: session, error: sessionError } = await supabase
          .from("game_sessions")
          .select(
            `
            *,
            quizzes (
              questions
            )
          `
          )
          .eq("id", id)
          .single();

        console.log(
          "Session query result:",
          session ? "Found" : "Not Found",
          "Error:",
          sessionError
        );
        console.log("Session host_id:", session?.host_id);
        console.log("Session participants:", session?.participants);
        console.log(
          "Is Host?",
          profileId,
          "===",
          session?.host_id,
          "=",
          profileId === session?.host_id
        );

        if (session) {
          // 3. Check if current user is host (compare profile ID with host_id)
          const hostCheck = profileId === session.host_id;
          console.log("Setting isHost to:", hostCheck);
          setIsHost(hostCheck);

          // Extract questions
          // Extract questions
          const quiz = Array.isArray(session.quizzes) ? session.quizzes[0] : session.quizzes;
          const fullQuestions = quiz?.questions || [];

          // Use current_questions if available (most accurate source of truth for session),
          // otherwise fallback to full source list
          let activeQuestions =
            session.current_questions && session.current_questions.length > 0
              ? session.current_questions
              : fullQuestions;

          // Apply question limit explicitly
          // Even if current_questions is used, we ensure it respects the limit stored in session
          const questionLimit = parseInt(session.question_limit);
          if (
            !isNaN(questionLimit) &&
            questionLimit > 0 &&
            questionLimit < activeQuestions.length
          ) {
            activeQuestions = activeQuestions.slice(0, questionLimit);
          }

          setQuestions(activeQuestions);

          const participants = (session.participants as any[]) || [];
          // Use activeQuestions.length as the definitive total questions count
          const totalQ = activeQuestions.length;
          console.log("Participants count:", participants.length, "Active Questions:", totalQ);

          if (participants.length > 0) {
            setIsSyncing(false); // Data ready!

            // Fetch avatars for all participants
            const userIds = participants.map((p) => p.user_id).filter((id): id is string => !!id);

            let avatarMap: Record<string, string> = {};
            if (userIds.length > 0) {
              const { data: profiles } = await supabase
                .from("profiles")
                .select("id, avatar_url")
                .in("id", userIds);

              if (profiles) {
                avatarMap = profiles.reduce(
                  (acc, p) => {
                    if (p.avatar_url) acc[p.id] = p.avatar_url;
                    return acc;
                  },
                  {} as Record<string, string>
                );
              }
            }

            // Map participants to players with full data
            // NEW LOGIC: Support both embedded responses (Legacy) and separated responses (New Clean Mode)
            const allSessionResponses = (session.responses as any[]) || [];

            const mappedPlayers: Player[] = participants
              .map((p) => {
                // Get responses for THIS participant from the centralized responses array
                const separateResponses = allSessionResponses.filter(
                  (r) => r.participant_id === p.id || r.participant_id === p.user_id
                );

                // Fallback to embedded responses if available (Hybrid/Legacy), otherwise use separate
                const embeddedResponses = Array.isArray(p.responses) ? p.responses : [];

                // Prefer separate responses if available (newer source of truth), else legacy
                const responses =
                  separateResponses.length > 0 ? separateResponses : embeddedResponses;

                const responsesCount = responses.length;
                const totalQ = questionLimit;

                // RECALCULATE SCORE MANUALLY
                // Don't trust p.score from DB due to potential sync/mismatch issues
                let recalculatedCorrectCount = 0;

                responses.forEach((r: any) => {
                  const q = activeQuestions.find(
                    (ques: any) => String(ques.id).trim() === String(r.question_id).trim()
                  );
                  if (q) {
                    // Check correctness
                    const isCorrect =
                      String(r.answer_id).trim() === String(q.correct).trim() ||
                      q.answers?.find(
                        (a: any) => String(a.id).trim() === String(r.answer_id).trim()
                      )?.isCorrect;

                    if (isCorrect) {
                      recalculatedCorrectCount++;
                    }
                  }
                });

                // Assuming 100 points per correct answer for the raw score
                const recalculatedScore = recalculatedCorrectCount * 100;

                const correctAns = recalculatedCorrectCount;
                const rawScore = recalculatedScore;

                // Normalize score to max 100 for display
                const normalizedScore = totalQ > 0 ? Math.round((correctAns / totalQ) * 100) : 0;

                // Calculate Duration for Tie-Breaker
                let duration = Number.MAX_SAFE_INTEGER; // Default to max so unfinished are last
                if (p.started && p.ended) {
                  const start = new Date(p.started).getTime();
                  const end = new Date(p.ended).getTime();
                  if (!isNaN(start) && !isNaN(end) && end >= start) {
                    duration = end - start;
                  }
                }

                return {
                  id: p.user_id || p.id,
                  name: p.nickname || "Unknown",
                  image: p.avatar || avatarMap[p.user_id] || null,
                  answered: responsesCount,
                  score: rawScore,
                  normalizedScore,
                  correctAnswers: correctAns,
                  totalQuestions: totalQ,
                  responses: responses,
                  duration: duration
                };
              })
              .sort((a, b) => {
                // Primary: Score (Higher is better)
                if (b.score !== a.score) {
                  return b.score - a.score;
                }
                // Secondary: Duration (Lower is better)
                const durA = a.duration || Number.MAX_SAFE_INTEGER;
                const durB = b.duration || Number.MAX_SAFE_INTEGER;
                return durA - durB;
              });

            console.log("Mapped Players:", mappedPlayers);
            setPlayers(mappedPlayers);

            // 4. Find current player (compare profile ID with participant user_id or id)
            let foundPlayerIndex = -1;
            if (profileId) {
              foundPlayerIndex = mappedPlayers.findIndex((p) => p.id === profileId);
            }

            if (foundPlayerIndex !== -1) {
              const p = mappedPlayers[foundPlayerIndex];
              setCurrentPlayer({
                ...p,
                rank: foundPlayerIndex + 1,
                totalPlayers: mappedPlayers.length
              });
            } else if (!hostCheck) {
              // If NOT host AND NOT a participant -> Observer/Guest
              // Requirement: Redirect to dashboard
              console.log("User is neither Host nor Participant. Redirecting...");
              toast.error("You are not part of this game session.");
              router.push("/dashboard");
              return;
            }
          } else {
            // Participants empty, likely syncing
            console.log("Participants empty - setting isSyncing to true");
            setIsSyncing(true);
          }
        } else {
          console.log("Session not found!");
          toast.error("Session not found");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
        console.log("=== Fetch Complete ===");
      }
    }

    // ... (Realtime subscription code remains same) ...
    fetchData();

    channel = supabase
      .channel(`leaderboard-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log("Game session updated, refreshing data...", payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-zinc-950">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        <p className="text-muted-foreground animate-pulse">Loading game data...</p>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-4 text-center dark:bg-zinc-950">
        <div className="relative">
          <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl"></div>
          <Trophy className="text-primary relative z-10 h-16 w-16 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Calculating Results...</h2>
          <p className="text-muted-foreground mx-auto max-w-sm">
            We are gathering scores from all players. This generally takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <HeaderNav
        isHost={isHost}
        onDashboard={handleDashboard}
        onRestart={handleRestart}
        onExport={handleExport}
        onStatistics={() => setShowStats(true)}
      />
      {isHost ? (
        <HostLeaderboard players={players} />
      ) : currentPlayer ? (
        <PlayerResult player={currentPlayer} />
      ) : (
        <div className="flex flex-1 items-center justify-center p-4 text-center">
          <div className="max-w-md space-y-4">
            <LayoutDashboard className="text-muted-foreground/50 mx-auto h-12 w-12" />
            <h3 className="text-lg font-semibold">Waiting for Results</h3>
            <p className="text-muted-foreground">
              You are not listed as a participant in this session, or the results are still being
              finalized by the host.
            </p>
          </div>
        </div>
      )}

      {/* Statistics Dialog */}
      <StatisticsView
        open={showStats}
        onOpenChange={setShowStats}
        isHost={isHost}
        questions={questions}
        players={players}
        currentPlayerId={currentPlayer?.id}
      />
    </div>
  );
}
