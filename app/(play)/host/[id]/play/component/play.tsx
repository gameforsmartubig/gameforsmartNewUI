"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CircleQuestionMark, Timer, User, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  getGameSessionRT,
  getParticipantsRT,
  subscribeToGameRT,
  updateGameSessionRT,
  unsubscribeFromGameRT,
  GameSessionRT,
  GameParticipantRT,
  supabaseRealtime
} from "@/lib/supabase-realtime";
import { motion, AnimatePresence } from "framer-motion";
import { GameTimer, GameTimerProgress } from "./game-timer";
import { supabase } from "@/lib/supabase"; // Use generic client for profiles if needed
import { getServerNow, calculateOffsetFromTimestamp } from "@/lib/server-time";

interface PlayProps {
  sessionId: string;
}

export default function Play({ sessionId }: PlayProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<GameSessionRT | null>(null);
  const [participants, setParticipants] = useState<
    Array<GameParticipantRT & { avatar_url?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  // Initial countdown setup
  const [countdownLeft, setCountdownLeft] = useState<number | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);

  // Robust Countdown Timer using Date.now() for Host Sync
  useEffect(() => {
    const ts = searchParams.get("ts");
    if (!ts) return;

    const startTime = new Date(ts).getTime();
    const duration = 10000;
    const targetEndTime = startTime + duration;

    const tick = () => {
      const now = Date.now();
      const remainingMs = targetEndTime - now;

      // Finish condition - Clean & Instant
      if (remainingMs <= 0) {
        setShowCountdown(false);
        setCountdownLeft(null);
        fetchSessionData(); // Sync Host
        return false;
      }

      // Too late condition
      if (remainingMs < -5000) {
        setShowCountdown(false);
        setCountdownLeft(null);
        return false;
      }

      // Valid countdown
      const seconds = Math.ceil(remainingMs / 1000);
      setCountdownLeft(seconds);
      setShowCountdown(true);
      return true;
    };

    if (tick()) {
      const interval = setInterval(() => {
        if (!tick()) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Profile cache
  const profileCache = useRef(new Map<string, string>());

  // Re-fetch session data helper
  const fetchSessionData = async () => {
    try {
      const sess = await getGameSessionRT(sessionId);
      if (!sess) {
        toast.error("Session not found");
        router.push("/dashboard");
        return;
      }
      setSession(sess);

      const parts = await getParticipantsRT(sessionId);
      // Fetch profiles
      const userIds = parts.map((p) => p.user_id).filter((id) => id) as string[];
      await fetchProfiles(userIds);

      const partsWithProfile = parts.map((p) => ({
        ...p,
        avatar_url: p.user_id ? profileCache.current.get(p.user_id) : undefined
      }));

      // Sort initially by progress
      partsWithProfile.sort((a, b) => (b.responses?.length || 0) - (a.responses?.length || 0));
      setParticipants(partsWithProfile);

      setLoading(false);
    } catch (err) {
      console.error(err);
      // Don't toast error on re-fetch to avoid spam
    }
  };

  // Simple Countdown Effect

  // Polling for started_at: Keep checking until it's available
  useEffect(() => {
    // Only poll if countdown is finished but started_at is not yet available
    if (showCountdown) return;
    if (session?.started_at) return; // Already have it

    const pollInterval = setInterval(async () => {
      try {
        const sess = await getGameSessionRT(sessionId);
        if (sess?.started_at) {
          setSession((prev) => (prev ? { ...prev, ...sess } : null));
          clearInterval(pollInterval);
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(pollInterval);
  }, [showCountdown, session?.started_at, sessionId]);

  // Fetch Profiles Helper
  const fetchProfiles = async (userIds: string[]) => {
    const uncached = userIds.filter((id) => id && !profileCache.current.has(id));
    if (uncached.length === 0) return;

    const { data } = await supabase.from("profiles").select("id, avatar_url").in("id", uncached);

    if (data) {
      data.forEach((p) => {
        if (p.avatar_url) profileCache.current.set(p.id, p.avatar_url);
      });
    }
  };

  // Initial Fetch & Subscribe
  useEffect(() => {
    fetchSessionData();

    // Subscribe
    const channel = subscribeToGameRT(sessionId, {
      onSessionChange: (updatedSession) => {
        setSession((prev) => (prev ? { ...prev, ...updatedSession } : null));
        if (updatedSession.status === "finished") {
          router.push(`/result/${sessionId}`);
        }
      },
      onParticipantChange: async () => {
        // Refresh list to keep sync (simplified)
        const freshParts = await getParticipantsRT(sessionId);
        if (!freshParts) return; // Guard

        // Fetch profiles for new ones
        const userIds = freshParts.map((p) => p.user_id).filter((id) => id) as string[];
        await fetchProfiles(userIds);

        const mapped = freshParts.map((p) => ({
          ...p,
          avatar_url: p.user_id ? profileCache.current.get(p.user_id) : undefined
        }));

        // Sort by progress (responses count)
        mapped.sort((a, b) => (b.responses?.length || 0) - (a.responses?.length || 0));
        setParticipants(mapped);
      }
    });

    return () => {
      unsubscribeFromGameRT(channel);
    };
  }, [sessionId, router]);

  const handleEndGame = async () => {
    try {
      if (!supabaseRealtime) throw new Error("Realtime client not initialized");

      // Use Edge Function 'submit-game' with action 'end'
      const { error } = await supabaseRealtime.functions.invoke("submit-game", {
        body: {
          action: "end",
          sessionId
        }
      });

      if (error) throw error;

      toast.success("Session ended successfully");
      // Redirect handled by subscription
    } catch (err: any) {
      console.error("End Game Error:", err);
      toast.error("Failed to end session: " + err.message);
    }
  };

  const handleTimeUp = async () => {
    // Auto end game via existing handler
    if (session?.status === "active") {
      await handleEndGame();
    }
  };

  const questionLimit = session
    ? session.question_limit === "all"
      ? 100
      : parseInt(session.question_limit) || 0
    : 0;

  const isLoading = loading || !session;

  // Debounce Loader to prevent flicker
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading && !showCountdown) {
      timeout = setTimeout(() => setShowLoader(true), 200);
    } else {
      setShowLoader(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading, showCountdown]);

  // Dynamic background
  const bgColor = isLoading || showCountdown ? "bg-black" : "bg-rose-50";

  return (
    <div
      className={`base-background min-h-screen w-full transition-colors duration-300 dark:bg-zinc-950`}>
      {/* Countdown Overlay - Diperbarui ke Orange & Kuning */}
      <div
        className={`base-background fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md transition-opacity duration-300 ${
          showCountdown ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
        }`}>
        <div className="flex flex-col items-center gap-8">
          <AnimatePresence mode="wait">
            {countdownLeft !== null && countdownLeft > 0 && (
              <motion.div
                key={countdownLeft}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative">
                {/* Glow Efek Orange/Kuning */}
                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-orange-600 to-yellow-500 opacity-40 blur-xl"></div>
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-4 border-orange-500 bg-orange-200 shadow-2xl dark:bg-zinc-900">
                  <span className="bg-gradient-to-br from-orange-600 to-yellow-500 bg-clip-text text-8xl font-black text-transparent">
                    {countdownLeft}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <h2 className="animate-pulse text-4xl font-bold tracking-widest text-orange-500 uppercase dark:text-orange-400">
            Game Starting...
          </h2>
        </div>
      </div>

      {/* Main Content */}
      {isLoading || showCountdown ? (
        <div className="flex min-h-screen items-center justify-center">
          {showLoader && !showCountdown && (
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          )}
        </div>
      ) : (
        <>
          {/* Header Bar - Rose-50 diubah ke Orange-50/Zinc */}
          <div className="fixed top-0 right-0 left-0 z-50 w-full border-b border-orange-100 bg-orange-50/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="relative flex h-auto w-full flex-col items-center md:h-16 md:flex-row">
              {/* Progress Bar Timer */}
              <div className="absolute right-0 -bottom-1.5 left-0">
                <GameTimerProgress
                  startedAt={session.started_at}
                  totalTimeMinutes={session.total_time_minutes}
                  status={session.status}
                  onTimeUp={handleTimeUp}
                />
              </div>

              {/* Baris 1: Logo & End Session */}
              <div className="flex w-full items-center justify-between px-4 py-2 md:flex-1 md:justify-start md:py-0">
                <Image
                  src="/gameforsmartlogo.png"
                  width={180}
                  height={36}
                  alt="gameforsmart"
                  className="opacity-90 dark:opacity-100"
                  unoptimized
                />

                <div className="md:hidden">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant={"destructive"} className="bg-red-600 hover:bg-red-700">
                        End Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark:border-zinc-800 dark:bg-zinc-900">
                      <DialogHeader>
                        <DialogTitle className="dark:text-zinc-100">End Session</DialogTitle>
                        <DialogDescription className="dark:text-zinc-400">
                          Are you sure you want to end this session?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button
                            variant="outline"
                            className="dark:border-zinc-700 dark:text-zinc-300">
                            Cancel
                          </Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button variant="destructive" onClick={handleEndGame}>
                            End Session
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Statistik - Update Icon & Text Colors */}
              <div className="flex w-full items-center justify-center gap-8 py-2 md:flex-1 md:py-0">
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-lg font-bold text-orange-900 dark:text-zinc-100">
                    <CircleQuestionMark className="size-5 text-yellow-500" />
                    <span>{session.question_limit}</span>
                  </div>
                  <p className="text-[10px] font-bold tracking-wider text-orange-600/60 uppercase dark:text-orange-400/60">
                    QUESTIONS
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-lg font-bold text-orange-900 dark:text-zinc-100">
                    <Timer className="size-5 text-orange-500" />
                    <span>{session.total_time_minutes}m</span>
                  </div>
                  <p className="text-[10px] font-bold tracking-wider text-orange-600/60 uppercase dark:text-orange-400/60">
                    TIME
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-lg font-bold text-orange-900 dark:text-zinc-100">
                    <User className="size-5 text-green-500" />
                    <span>{participants.length}</span>
                  </div>
                  <p className="text-[10px] font-bold tracking-wider text-orange-600/60 uppercase dark:text-orange-400/60">
                    PLAYERS
                  </p>
                </div>
              </div>

              {/* Kanan Desktop */}
              <div className="hidden items-center justify-end px-4 md:flex md:flex-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant={"destructive"} className="bg-red-600 hover:bg-red-700">
                      End Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:border-zinc-800 dark:bg-zinc-900">
                    {/* ... (isi dialog sama seperti di atas) */}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Timer Display */}
          <div className="pt-36 pb-4 md:pt-24">
            <GameTimer
              startedAt={session.started_at}
              totalTimeMinutes={session.total_time_minutes}
              status={session.status}
              onTimeUp={handleTimeUp}
            />
          </div>

          {/* Participant Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-5">
            <AnimatePresence mode="popLayout">
              {participants.map((p) => {
                const answeredCount = p.responses?.length || 0;
                const max =
                  parseInt(session.question_limit) || session.current_questions?.length || 20;
                const percent = Math.min(100, Math.round((answeredCount / max) * 100));

                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                    <Card className="h-full border-orange-100 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <CardContent className="px-4">
                        <div className="flex items-center justify-between gap-3">
                          <Avatar className="border-2 border-orange-100 dark:border-zinc-700">
                            <AvatarImage src={p.avatar_url} alt={p.nickname} />
                            <AvatarFallback className="bg-orange-100 font-bold text-orange-600 dark:bg-zinc-800 dark:text-orange-400">
                              {p.nickname.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="flex-1 overflow-hidden font-bold text-ellipsis text-orange-950 dark:text-zinc-100">
                            {p.nickname}
                          </p>
                          <p className="text-xs font-black text-green-600 dark:text-green-400">
                            {percent}%
                          </p>
                        </div>
                        <div className="mt-4 flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-orange-800/50 uppercase dark:text-zinc-500">
                            <p>Progress</p>
                            <p>
                              {answeredCount}/{max}
                            </p>
                          </div>
                          {/* Progress bar menggunakan warna Hijau */}
                          <Progress value={percent} className="h-2 bg-orange-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {participants.length === 0 && (
            <div className="py-20 text-center">
              <p className="font-medium text-orange-300 dark:text-zinc-600">
                Waiting for participants to join...
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
