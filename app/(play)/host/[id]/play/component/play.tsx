"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
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
  GameParticipantRT
} from "@/lib/supabase-realtime";
import { motion, AnimatePresence } from "framer-motion";
import { GameTimer, GameTimerProgress } from "./game-timer";
import { supabase } from "@/lib/supabase"; // Use generic client for profiles if needed

interface PlayProps {
  sessionId: string;
}

export default function Play({ sessionId }: PlayProps) {
  const router = useRouter();
  const [session, setSession] = useState<GameSessionRT | null>(null);
  const [participants, setParticipants] = useState<
    Array<GameParticipantRT & { avatar_url?: string }>
  >([]);
  const [loading, setLoading] = useState(true);

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

  const handleEndGame = async () => {
    try {
      await updateGameSessionRT(sessionId, {
        status: "finished",
        ended_at: new Date().toISOString()
      });
      toast.success("Session ended");
      // Redirect handled by subscription
    } catch (err) {
      toast.error("Failed to end session");
    }
  };

  const handleTimeUp = async () => {
    // Auto end game
    if (session?.status === "active") {
      await updateGameSessionRT(sessionId, {
        status: "finished",
        ended_at: new Date().toISOString()
      });
    }
  };

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rose-50">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const questionLimit =
    session.question_limit === "all" ? 100 : parseInt(session.question_limit) || 0; // fallback if 'all' isn't handled yet, assuming number for progress

  return (
    <div className="min-h-screen w-full bg-rose-50">
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
          <div className="flex w-full items-center justify-between py-2 md:flex-1 md:justify-start md:py-0 px-2">
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
                      <Button variant="destructive" onClick={handleEndGame}>End Session</Button>
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
          <div className="hidden items-center justify-end md:flex md:flex-1 px-2">
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
                    <Button variant="destructive" onClick={handleEndGame}>End Session</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="pt-36 md:pt-24 pb-4">
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
                    const max = parseInt(session.question_limit) || (session.current_questions?.length || 20); 
                    const percent = Math.min(100, Math.round((answeredCount / max) * 100));

                    return (
                        <motion.div
                            key={p.id}
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                          <Card className="py-4 h-full">
                            <CardContent className="px-4">
                              <div className="flex items-center justify-between gap-2">
                                <Avatar>
                                  <AvatarImage src={p.avatar_url} alt={p.nickname} />
                                  <AvatarFallback className="rounded-lg">{p.nickname.substring(0, 2).toUpperCase()}</AvatarFallback>
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
            <div className="text-center py-20 text-slate-400">
                <p>Waiting for participants...</p>
            </div>
      )}
    </div>
  );
}
