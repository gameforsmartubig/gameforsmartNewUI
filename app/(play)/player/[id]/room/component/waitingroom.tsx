"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { CircleQuestionMark, Copy, LogOut, Play, Timer, User, Users, UserX } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  supabaseRealtime,
  isRealtimeDbConfigured,
  subscribeToGameRT,
  unsubscribeFromGameRT,
  getParticipantsRT,
  getCachedProfile,
  setCachedProfile,
  getGameSessionRT,
  subscribeToCountdownBroadcast,
  unsubscribeFromCountdownBroadcast
} from "@/lib/supabase-realtime";
import {
  calculateServerTimeOffset,
  getServerNow,
  calculateOffsetFromTimestamp
} from "@/lib/server-time";
import { motion, AnimatePresence } from "framer-motion";

interface WaitingRoomProps {
  sessionId: string;
}

export default function WaitingRoom({ sessionId }: WaitingRoomProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const participantId = searchParams.get("participant"); // REMOVED
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    // Find our participant ID based on the logged-in user_id (profile id)
    const findMyParticipantId = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        toast.error("User ID not found in storage");
        router.push("/join");
        return;
      }

      // Try RT first
      if (isRealtimeDbConfigured) {
        const parts = await getParticipantsRT(sessionId);
        const myPart = parts.find((p: any) => p.user_id === userId);
        if (myPart) {
          setParticipantId(myPart.id);
          return;
        }
      }

      // Try Main DB
      const { data: session } = await supabase
        .from("game_sessions")
        .select("participants")
        .eq("id", sessionId)
        .single();

      if (session) {
        const parts = session.participants || [];
        const myPart = parts.find((p: any) => p.user_id === userId);
        if (myPart) {
          setParticipantId(myPart.id);
          return;
        }
      }

      toast.error("You happen not to be in this game");
      router.push("/join");
    };

    findMyParticipantId();
  }, [sessionId]);

  const [gameSession, setGameSession] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [serverTimeReady, setServerTimeReady] = useState(false);

  const lastStatusRef = useRef<string>("");
  const profileCache = useRef(new Map<string, any>());
  const hasShuffledRef = useRef(false);

  // Initialize server time
  useEffect(() => {
    const initServerTime = async () => {
      await calculateServerTimeOffset();
      setServerTimeReady(true);
    };
    initServerTime();
  }, []);

  // Helper to fetch profiles for participants
  const fetchProfiles = async (userIds: string[]) => {
    const uncachedIds = userIds.filter((id) => id && !profileCache.current.has(id));
    if (uncachedIds.length === 0) return;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, avatar_url, username")
      .in("id", uncachedIds);

    if (profiles) {
      profiles.forEach((profile) => {
        profileCache.current.set(profile.id, profile);
      });
    }
  };

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!participantId) return; // Wait for ID to be resolved

      try {
        const { data: session, error } = await supabase
          .from("game_sessions")
          .select(
            `
            *,
            quizzes (
              id,
              title,
              description,
              questions
            )
          `
          )
          .eq("id", sessionId)
          .single();

        if (error || !session) {
          toast.error("Session not found");
          router.push("/dashboard");
          return;
        }

        const quiz = Array.isArray(session.quizzes) ? session.quizzes[0] : session.quizzes;

        // Ensure participant exists in JSONB for MainDB validation
        const currentParticipants = session.participants || [];
        // Note: For Main DB check, we rely on the realtime/session data.
        // We act optimistically here.

        setGameSession(session);
        setQuizData(quiz);
        lastStatusRef.current = session.status;
        setLoading(false);

        // Fetch user profiles for existing participants (if in main db JSONB)
        const userIds = currentParticipants.map((p: any) => p.user_id).filter((id: any) => id);
        if (userIds.length > 0) {
          await fetchProfiles(userIds);
        }

        // If RT available, initial fetch for RT participants
        if (isRealtimeDbConfigured) {
          const partsRT = await getParticipantsRT(sessionId);
          // Fetch profiles
          const rtUserIds = partsRT.map((p) => p.user_id).filter((id) => id) as string[];
          await fetchProfiles(rtUserIds);

          setParticipants(
            partsRT.map((p) => ({
              ...p,
              avatar_url: p.user_id ? profileCache.current.get(p.user_id)?.avatar_url : null
            }))
          );
        } else {
          setParticipants(
            currentParticipants.map((p: any) => ({
              ...p,
              avatar_url: p.user_id ? profileCache.current.get(p.user_id)?.avatar_url : null
            }))
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load session");
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, participantId, router]);

  // 2. Realtime Subscription
  useEffect(() => {
    if (loading) return;

    if (isRealtimeDbConfigured && supabaseRealtime) {
      const channel = subscribeToGameRT(sessionId, {
        onSessionChange: (updatedSession) => {
          // Handle status changes
          if (updatedSession.status !== lastStatusRef.current) {
            lastStatusRef.current = updatedSession.status;

            // Sync session state
            setGameSession((prev: any) => ({ ...prev, ...updatedSession }));

            // if (updatedSession.status === "active") {
            //   router.push(`/player/${sessionId}/play`);
            // } else
            if (updatedSession.status === "finished") {
              router.push(`/result/${sessionId}`);
            }
          }

          // Also sync countdown_started_at even if status doesn't change
          // (Note: Countdown is now handled via broadcast, not instant redirect here)
          if (updatedSession.countdown_started_at) {
            setGameSession((prev: any) => ({
              ...prev,
              countdown_started_at: updatedSession.countdown_started_at
            }));
          }
        },
        onParticipantChange: async ({ eventType, new: newPart, old: oldPart }) => {
          // Refresh list on any change
          const parts = await getParticipantsRT(sessionId);

          // Check if WE were kicked
          if (eventType === "DELETE" && oldPart && oldPart.id === participantId) {
            handleKick();
            return;
          }

          // Fetch profiles
          const userIds = parts.map((p) => p.user_id).filter((id) => id) as string[];
          await fetchProfiles(userIds);

          const mapped = parts.map((p) => ({
            ...p,
            id: p.id,
            nickname: p.nickname,
            user_id: p.user_id,
            avatar_url: p.user_id ? profileCache.current.get(p.user_id)?.avatar_url : null
          }));
          setParticipants(mapped);
        }
      });

      return () => {
        unsubscribeFromGameRT(channel);
      };
    } else {
      // Main DB Fallback
      const channel = supabase
        .channel(`public:game_sessions:${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "game_sessions",
            filter: `id=eq.${sessionId}`
          },
          (payload: any) => {
            const newSession = payload.new;

            if (newSession.status !== lastStatusRef.current) {
              lastStatusRef.current = newSession.status;
              setGameSession(newSession); // Sync fallback

              // Note: Countdown redirect is now handled via broadcast
              // Only handle finished status here
              if (newSession.status === "finished") {
                router.push(`/result/${sessionId}`);
              }
            }

            // Check Participants from JSONB
            const parts = newSession.participants || [];
            if (!parts.find((p: any) => p.id === participantId)) {
              handleKick();
              return;
            }

            // Update list
            // Need to fetch profiles if new users
            const userIds = parts.map((p: any) => p.user_id).filter((id: any) => id);
            fetchProfiles(userIds).then(() => {
              setParticipants(
                parts.map((p: any) => ({
                  ...p,
                  avatar_url: p.user_id ? profileCache.current.get(p.user_id)?.avatar_url : null
                }))
              );
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [sessionId, participantId, router, loading]);

  // Subscribe to countdown broadcast
  useEffect(() => {
    if (!sessionId) return;

    const channel = subscribeToCountdownBroadcast(sessionId, (payload) => {
      // Received countdown start from broadcast -> REDIRECT IMMEDIATELY
      // The Play Screen will show the countdown overlay based on 'ts'
      if (payload.startedAt) {
        router.push(`/player/${sessionId}/play?ts=${payload.startedAt}`);
      } else {
        router.push(`/player/${sessionId}/play`);
      }
    });

    return () => {
      unsubscribeFromCountdownBroadcast(channel);
    };
  }, [sessionId, router]);

  // Fallback: If status becomes active
  useEffect(() => {
    if (gameSession?.status === "active") {
      router.push(`/player/${sessionId}/play`);
    } else if (gameSession?.status === "finished") {
      router.push(`/result/${sessionId}`);
    }
  }, [gameSession?.status, sessionId, router]);

  const handleKick = () => {
    toast.error("You have been removed from the game.");
    router.push("/dashboard");
  };

  const handleLeaveGame = async () => {
    if (!sessionId || !participantId) return;

    try {
      if (isRealtimeDbConfigured && supabaseRealtime) {
        await supabaseRealtime.from("game_participants_rt").delete().eq("id", participantId);
      }

      // Also remove from Main DB
      const { data: s } = await supabase
        .from("game_sessions")
        .select("participants")
        .eq("id", sessionId)
        .single();
      if (s) {
        const newParts = (s.participants || []).filter((p: any) => p.id !== participantId);
        await supabase.from("game_sessions").update({ participants: newParts }).eq("id", sessionId);
      }

      toast.success("Left the game");
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      // Force leave
      router.push("/dashboard");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!gameSession || !quizData) return null;

  const joinLink =
    typeof window !== "undefined" ? `${window.location.origin}/join/${gameSession.game_pin}` : "";

  return (
    <div className="base-background relative h-screen overflow-y-auto">
      <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1fr_480px]">
        {/* Left Column: Stats & Participants */}
        <div className="order-2 p-4 lg:order-1">
          <Card className="min-h-[96vh] gap-0 border-0 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent>
              <div className="flex w-full items-center justify-between pb-6">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <Users className="text-orange-500" />
                  <p className="text-2xl font-bold">Players</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setLeaveDialogOpen(true)}
                  className="border-zinc-200 text-zinc-600 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  <LogOut className="mr-2 size-4" />
                  Leave
                </Button>
              </div>
              {participants.length === 0 ? (
                <div className="text-muted-foreground flex h-40 flex-col items-center justify-center dark:text-zinc-500">
                  <Users className="mb-2 size-12 opacity-10" />
                  <p>Waiting for players to join...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {participants.map((player) => (
                    <Card
                      key={player.id}
                      className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-400 to-yellow-400 py-0 shadow-md shadow-orange-100 transition-colors">
                      <CardContent className="flex flex-col items-center p-3">
                        <Avatar className="mb-2 size-12 border-2 border-white shadow-sm dark:border-zinc-800">
                          <AvatarImage src={player.avatar_url || ""} />
                          <AvatarFallback className="bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            {player.nickname.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p
                          className="w-full truncate text-center text-sm leading-tight font-medium text-zinc-700 dark:text-zinc-200"
                          title={player.nickname}>
                          {player.nickname}
                        </p>
                        {player.id === participantId && (
                          <span className="text-[10px] font-black tracking-wider text-orange-600 uppercase dark:text-orange-400">
                            (YOU)
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls & QR */}
        <div className="order-1 p-4 pb-0 sm:pb-4 sm:pl-0">
          <Card className="h-full border-0 bg-white shadow-sm lg:order-2 dark:bg-zinc-900">
            <CardContent className="sticky top-0 flex h-full flex-col gap-6">
              <div className="flex justify-center">
                <Image
                  src="/gameforsmartlogo.png"
                  width={200}
                  height={40}
                  alt="gameforsmart"
                  className="opacity-90 dark:opacity-100 dark:invert"
                  unoptimized
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-3xl font-black tracking-tight text-orange-900 dark:text-orange-100">
                  {quizData.title}
                </p>
                <p className="text-sm text-orange-500 dark:text-zinc-400">
                  {quizData.description || "No description"}
                </p>
              </div>

              <Card className="border-orange-100 bg-orange-50/50 dark:border-zinc-800 dark:bg-zinc-950">
                <CardContent className="p-0">
                  <div className="flex items-center justify-evenly py-4">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        <CircleQuestionMark className="size-5 text-yellow-500" />
                        <span>{gameSession.question_limit || quizData.questions?.length || 0}</span>
                      </div>
                      <p className="text-[10px] font-bold tracking-wider text-orange-900 uppercase">
                        QUESTIONS
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        <Timer className="size-5 text-orange-500" />
                        <span>{gameSession.total_time_minutes}m</span>
                      </div>
                      <p className="text-[10px] font-bold tracking-wider text-orange-900 uppercase">
                        TIME
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        <User className="size-5 text-green-500" />
                        <span>{participants.length}</span>
                      </div>
                      <p className="text-[10px] font-bold tracking-wider text-orange-900 uppercase">
                        PLAYERS
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col items-center justify-center py-4">
                <div className="mb-2 flex justify-center md:mb-4">
                  <div className="relative">
                    {/* Effect Pulse diubah ke Orange-Yellow */}
                    <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-orange-600 to-yellow-500 opacity-20 blur-xl"></div>
                    <div className="relative rounded-full border-2 border-white bg-gradient-to-br from-orange-50 to-yellow-50 p-4 shadow-xl md:border-4 md:p-6 dark:border-zinc-800 dark:from-orange-950/30 dark:to-yellow-950/30">
                      <Play className="h-8 w-8 text-orange-600 md:h-12 md:w-12 dark:text-orange-500" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  {/* Gradient Text diubah ke Orange-Yellow */}
                  <h2 className="bg-orange-600 bg-clip-text text-xl font-black text-transparent md:text-2xl lg:text-3xl">
                    Wait For Host To Start
                  </h2>
                </div>
              </div>

              {/* Game PIN - Diubah ke Orange */}
              <div className="space-y-2 text-center">
                <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Game PIN
                </p>
                <div
                  className="flex cursor-pointer items-center justify-center gap-2 text-6xl font-black text-orange-500 transition-opacity hover:opacity-80 dark:text-orange-400"
                  onClick={() => copyToClipboard(gameSession.game_pin)}>
                  {gameSession.game_pin}
                </div>
              </div>

              {/* Join Link - Zinc/Orange */}
              <div
                className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-orange-50/50 p-3 text-sm font-medium text-orange-800 transition-colors select-all hover:bg-orange-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800"
                onClick={() => copyToClipboard(joinLink)}>
                <span className="max-w-[240px] truncate">{joinLink}</span>
                <Copy size={14} className="text-orange-500" />
              </div>

              {/* Action Buttons */}
              <div className="mt-auto space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    className="border border-dashed border-green-200 text-xs text-green-700 hover:bg-green-50">
                    WhatsApp
                  </Button>
                  <Button
                    variant="ghost"
                    className="border border-dashed border-blue-200 text-xs text-blue-700 hover:bg-blue-50">
                    Telegram
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* leave Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px] dark:border-zinc-800 dark:bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <UserX size={20} /> Leave Room
            </DialogTitle>
            <DialogDescription className="dark:text-zinc-400">
              Are you sure you want to leave this game room? You can rejoin later using the PIN.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLeaveDialogOpen(false)}
              className="dark:border-zinc-800">
              Cancel
            </Button>
            <Button
              className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500"
              onClick={handleLeaveGame}>
              Leave Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
