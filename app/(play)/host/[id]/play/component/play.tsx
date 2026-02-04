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
  // Initialize directly from URL to prevent loading flicker
  const [countdownLeft, setCountdownLeft] = useState<number | null>(() => {
    if (searchParams.get("ts")) return 10; 
    return null;
  });

  // Profile cache
  const profileCache = useRef(new Map<string, string>());

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
    const init = async () => {
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
        toast.error("Failed to load session");
        setLoading(false);
      }
    };

    init();

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

  // Countdown Logic
  // Countdown Logic
  // Merge source: Session state OR URL Param (for seamless transition)
  const countdownTimestamp = session?.countdown_started_at || searchParams.get("ts");

  useEffect(() => {
    if (countdownTimestamp) {
        // Sync offset first if just started
        calculateOffsetFromTimestamp(countdownTimestamp);

        const interval = setInterval(() => {
            const now = getServerNow();
            const start = new Date(countdownTimestamp).getTime();
            const target = start + 10000; // 10s countdown
            const diff = target - now;
            const sec = Math.ceil(diff / 1000);
            
            if (sec > 0) {
                setCountdownLeft((prev) => (prev !== sec ? sec : prev));
            } else {
                setCountdownLeft(0);
                setTimeout(() => setCountdownLeft(null), 500); // Hide after 0
            }
        }, 100);
        return () => clearInterval(interval);
    } else {
        setCountdownLeft(null);
    }
  }, [countdownTimestamp]);

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
    // Auto end game via Edge Function
    if (session?.status === "active") {
      try {
        await supabase.functions.invoke("submit-game", {
          body: {
            action: "end", // or 'cron', logic is same
            sessionId
          }
        });
      } catch (e) {
        console.error("Auto End Error:", e);
      }
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
    if (isLoading && !countdownLeft) {
       timeout = setTimeout(() => setShowLoader(true), 200);
    } else {
       setShowLoader(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading, countdownLeft]);

  // Dynamic background to prevent white flash during countdown
  const bgColor = isLoading || countdownLeft ? "bg-zinc-950" : "bg-rose-50";

  return (
    <div className={`min-h-screen w-full ${bgColor} transition-colors duration-700`}>
      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdownLeft !== null && countdownLeft > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-8">
              <motion.div
                key={countdownLeft}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-40 blur-lg"></div>
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-4 border-purple-500 bg-white shadow-2xl">
                  <span className="bg-gradient-to-br from-purple-600 to-blue-600 bg-clip-text text-8xl font-black text-transparent">
                    {countdownLeft}
                  </span>
                </div>
              </motion.div>
              <h2 className="animate-pulse text-4xl font-bold tracking-widest text-white uppercase">
                Game Starting...
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content or Loading */}
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-transparent">
            {/* Show loader only after debounce delay */}
            {showLoader && <Loader2 className="h-8 w-8 animate-spin text-rose-500" />}
        </div>
      ) : (
      <>
      <div className="fixed top-0 right-0 left-0 z-50 w-full bg-rose-50">
        <div className="relative flex h-auto w-full flex-col items-center md:h-16 md:flex-row">
          {/* Progress */}
          <div className="absolute right-0 -bottom-1.5 left-0">
            <GameTimerProgress
              startedAt={session.started_at}
              totalTimeMinutes={session.total_time_minutes}
              status={session.status}
              onTimeUp={handleTimeUp}
            />
          </div>

          {/* ===== BARIS 1 (Mobile) / KIRI (Desktop) ===== */}
          <div className="flex w-full items-center justify-between px-2 py-2 md:flex-1 md:justify-start md:py-0">
            <Image
              src="/gameforsmartlogo.png"
              width={200}
              height={40}
              alt="gameforsmart"
              className="opacity-80 dark:opacity-100"
              unoptimized
            />

            {/* End Session (Mobile only) */}
            <div className="md:hidden">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant={"destructive"}>End Session</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>End Session</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to end this session?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
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

          {/* ===== STATISTIK (Baris 2 Mobile / Tengah Desktop) ===== */}
          <div className="flex w-full items-center justify-center gap-6 py-2 md:flex-1 md:py-0">
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-zinc-100">
                <CircleQuestionMark className="size-5 text-blue-500" />
                <span>{session.question_limit}</span>
              </div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase dark:text-zinc-500">
                QUESTIONS
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-zinc-100">
                <Timer className="size-5 text-orange-500" />
                <span>{session.total_time_minutes}m</span>
              </div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase dark:text-zinc-500">
                TIME
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-zinc-100">
                <User className="size-5 text-green-500" />
                <span>{participants.length}</span>
              </div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase dark:text-zinc-500">
                PLAYERS
              </p>
            </div>
          </div>

          {/* ===== KANAN DESKTOP ===== */}
          <div className="hidden items-center justify-end px-2 md:flex md:flex-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant={"destructive"}>End Session</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>End Session</DialogTitle>
                  <DialogDescription>Are you sure you want to end this session?</DialogDescription>
                </DialogHeader>
                <DialogFooter className="">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
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
      </div>

      <div className="pt-36 pb-4 md:pt-24">
        <GameTimer
          startedAt={session.started_at}
          totalTimeMinutes={session.total_time_minutes}
          status={session.status}
          onTimeUp={handleTimeUp}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 md:grid-cols-5">
        <AnimatePresence mode="popLayout">
          {participants.map((p) => {
            const answeredCount = p.responses?.length || 0;
            const max = parseInt(session.question_limit) || session.current_questions?.length || 20;
            const percent = Math.min(100, Math.round((answeredCount / max) * 100));

            return (
              <motion.div
                key={p.id}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                <Card className="h-full py-4">
                  <CardContent className="px-4">
                    <div className="flex items-center justify-between gap-2">
                      <Avatar>
                        <AvatarImage src={p.avatar_url} alt={p.nickname} />
                        <AvatarFallback className="rounded-lg">
                          {p.nickname.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="flex-1 overflow-hidden text-ellipsis">{p.nickname}</p>
                      <p>{percent}%</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <p>Progress</p>
                        <p>
                          {answeredCount}/{max}
                        </p>
                      </div>
                      <Progress value={percent} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {participants.length === 0 && (
        <div className="py-20 text-center text-slate-400">
          <p>Waiting for participants...</p>
        </div>
      )}
      </>
      )}
    </div>
  );
}
