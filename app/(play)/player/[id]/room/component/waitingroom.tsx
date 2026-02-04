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
  setCachedProfile
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
  const [countdownLeft, setCountdownLeft] = useState<number | null>(null);
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

            if (updatedSession.status === "active") {
              router.push(`/player/${sessionId}/play`);
            } else if (updatedSession.status === "finished") {
              router.push(`/result/${sessionId}`);
            }
          }

          // Also sync countdown_started_at even if status doesn't change
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

              if (newSession.status === "active") {
                router.push(`/player/${sessionId}/play`);
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

  // Effect: Visual Countdown Logic (Read-Only) & Question Shuffling
  useEffect(() => {
    if (gameSession?.countdown_started_at && gameSession.status !== "active" && serverTimeReady) {
      // Calculate offset ONCE when timestamp changes or server time becomes ready
      // Logic relies on the global offset initialized in the first useEffect

      // 1. Trigger Shuffle ONCE
      if (!hasShuffledRef.current && isRealtimeDbConfigured && supabaseRealtime) {
        hasShuffledRef.current = true;
        const questionsToShuffle = gameSession.current_questions || quizData.questions || [];

        const shuffleQuestions = async () => {
          try {
            const { data: shuffled, error } = await supabaseRealtime!.rpc(
              "shuffle_questions_for_player",
              {
                p_questions: questionsToShuffle,
                p_participant_id: participantId
              }
            );

            if (error) throw error;

            if (shuffled) {
              // Sanitize: ensure 'correct' key is removed even if RPC returned it
              const sanitizedQuestions = shuffled.map((q: any) => {
                const { correct, ...rest } = q;
                return rest;
              });

              const storageData = {
                sessionId,
                questions: sanitizedQuestions,
                participantId,
                timestamp: new Date().toISOString()
              };
              localStorage.setItem(`player_game_data_${sessionId}`, JSON.stringify(storageData));
              // console.log("Questions shuffled and saved (sanitized):", sanitizedQuestions);
            }
          } catch (err) {
            console.error("Error shuffling questions:", err);
            // Fallback? Maybe just save original if shuffle fails, but removing correct keys manually?
            // For now, let's trust RPC or if it fails, the play page might need to handle empty data or refetch.
          }
        };
        shuffleQuestions();
      }

      const interval = setInterval(() => {
        const now = getServerNow();
        const start = new Date(gameSession.countdown_started_at).getTime();
        const target = start + 10000; // 10s duration
        const diffInMs = target - now;
        const diffInSeconds = Math.ceil(diffInMs / 1000);

        if (diffInSeconds > 0) {
          setCountdownLeft((prev) => (prev !== diffInSeconds ? diffInSeconds : prev));
        } else {
          setCountdownLeft((prev) => (prev !== 0 ? 0 : prev));
        }
      }, 100);

      return () => clearInterval(interval);
    } else if (gameSession?.status === "active" || !gameSession?.countdown_started_at) {
      setCountdownLeft(null);
    }
  }, [gameSession?.countdown_started_at, gameSession?.status, serverTimeReady]);

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
    toast.success("Link copied!");
  };

  // Loading State
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!gameSession || !quizData) return null;

  const joinLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?pin=${gameSession.game_pin}`
      : "";

  return (
    <div className="h-screen overflow-y-auto bg-gray-50/50 dark:bg-zinc-950">
      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdownLeft !== null && countdownLeft > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black">
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
                Get Ready!
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1fr_480px]">
        {/* Left Column: Stats & Participants */}
        <div className="order-2 p-4 lg:order-1">
          <Card className="min-h-[96vh] gap-0 border-0 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent>
              <div className="flex w-full items-center justify-between pb-6">
                <div className="flex items-center gap-2 dark:text-zinc-100">
                  <Users />
                  <p className="text-2xl">Players</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setLeaveDialogOpen(true)}
                  className="dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  <LogOut className="mr-2 size-4" />
                  Leave
                </Button>
              </div>
              {participants.length === 0 ? (
                <div className="text-muted-foreground flex h-40 flex-col items-center justify-center dark:text-zinc-500">
                  <Users className="mb-2 size-12 opacity-20" />
                  <p>Waiting for players to join...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {participants.map((player) => (
                    <Card
                      key={player.id}
                      className="group relative overflow-hidden border-0 bg-gray-50 py-0 transition-colors hover:bg-gray-100 dark:bg-zinc-950 dark:hover:bg-zinc-800">
                      <CardContent className="flex flex-col items-center p-3">
                        <Avatar className="mb-2 size-12 border-2 border-white shadow-sm dark:border-zinc-800">
                          <AvatarImage src={player.avatar_url || ""} />
                          <AvatarFallback className="bg-purple-100 text-xs text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                            {player.nickname.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p
                          className="w-full truncate text-center text-sm leading-tight font-medium dark:text-zinc-200"
                          title={player.nickname}>
                          {player.nickname}
                        </p>
                        {player.id === participantId && (
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
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
                  className="opacity-80 dark:opacity-100 dark:invert"
                  unoptimized
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                  {quizData.title}
                </p>
                <p className="text-muted-foreground text-sm dark:text-zinc-400">
                  {quizData.description || "No description"}
                </p>
              </div>

              <Card className="dark:border-zinc-800 dark:bg-zinc-950">
                <CardContent className="p-0">
                  <div className="flex items-center justify-evenly py-4">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-zinc-100">
                        <CircleQuestionMark className="size-5 text-blue-500" />
                        <span>{gameSession.question_limit || quizData.questions?.length || 0}</span>
                      </div>
                      <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase dark:text-zinc-500">
                        QUESTIONS
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-zinc-100">
                        <Timer className="size-5 text-orange-500" />
                        <span>{gameSession.total_time_minutes}m</span>
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
                </CardContent>
              </Card>

              <div className="flex flex-col items-center justify-center">
                <div className="mb-2 flex justify-center md:mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-30 blur-lg"></div>
                    <div className="relative rounded-full border-2 border-white bg-gradient-to-br from-purple-100 to-blue-100 p-3 shadow-lg md:border-4 md:p-6 dark:border-zinc-800 dark:from-purple-900/30 dark:to-blue-900/30">
                      <Play className="h-8 w-8 text-purple-600 md:h-12 md:w-12 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <h2 className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent md:text-2xl lg:text-3xl dark:from-purple-400 dark:to-blue-400">
                    Wait For Host To Start
                  </h2>
                </div>
              </div>

              {/* Game PIN */}
              <div className="space-y-2 text-center">
                <p className="text-muted-foreground text-sm font-semibold tracking-wider uppercase dark:text-zinc-500">
                  Game PIN
                </p>
                <div
                  className="flex cursor-pointer items-center justify-center gap-2 text-6xl font-black text-purple-600 transition-opacity hover:opacity-80 dark:text-purple-400"
                  onClick={() => copyToClipboard(gameSession.game_pin)}>
                  {gameSession.game_pin}
                </div>
              </div>

              {/* Join Link */}
              <div
                className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-600 transition-colors select-all hover:bg-gray-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800"
                onClick={() => copyToClipboard(joinLink)}>
                <span className="max-w-[240px] truncate">{joinLink}</span>
                <Copy size={14} />
              </div>

              {/* Action Buttons */}
              <div className="mt-auto space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground border border-dashed text-xs dark:border-zinc-700 dark:text-zinc-400">
                    WhatsApp
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground border border-dashed text-xs dark:border-zinc-700 dark:text-zinc-400">
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <UserX size={20} /> Leave Room
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this game room? You can rejoin later using the PIN.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeaveGame}>
              Leave Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
