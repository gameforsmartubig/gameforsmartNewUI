"use client";

import { useEffect, useState, useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  CircleQuestionMark,
  Copy,
  Play,
  Share2,
  Timer,
  User,
  UserPlus,
  Users,
  UserX,
  Phone,
  Settings,
  Check
} from "lucide-react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import {
  supabaseRealtime,
  isRealtimeDbConfigured,
  subscribeToGameRT,
  unsubscribeFromGameRT,
  getParticipantsRT,
  getGameSessionRT,
  updateGameSessionRT,
  getCachedProfile,
  setCachedProfile,
  subscribeToCountdownBroadcast,
  sendCountdownSignal,
  unsubscribeFromCountdownBroadcast,
  addParticipantRT
} from "@/lib/supabase-realtime";
import { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  calculateServerTimeOffset,
  getServerNow,
  calculateOffsetFromTimestamp
} from "@/lib/server-time";
import { motion, AnimatePresence } from "framer-motion";
import { InviteGroup, InviteFriend } from "./dialogInvite";

interface WaitingRoomProps {
  sessionId: string;
}

interface Participant {
  id: string;
  nickname: string;
  avatar_url?: string | null;
  user_id?: string | null;
  // Add other fields if necessary
}

export default function WaitingRoom({ sessionId }: WaitingRoomProps) {
  const router = useRouter();
  const { user, profileId } = useAuth();

  const [quizData, setQuizData] = useState<any>(null);
  const [gameSession, setGameSession] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [participantToKick, setParticipantToKick] = useState<Participant | null>(null);
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [countdownLeft, setCountdownLeft] = useState<number | null>(null);
  const [serverTimeReady, setServerTimeReady] = useState(false);

  // Initialize server time
  useEffect(() => {
    const initServerTime = async () => {
      await calculateServerTimeOffset();
      setServerTimeReady(true);
    };
    initServerTime();
  }, []);

  // Utility function for countdown validation
  const validateCountdown = (seconds: number): number => {
    return Math.min(Math.max(seconds, 0), 10);
  };

  // State for showing countdown overlay
  const countdownChannelRef = useRef<RealtimeChannel | null>(null);

  const isHostJoined = participants.some((p) => p.user_id === profileId);

  const handleJoinAsPlayer = async () => {
    if (!profileId || isHostJoined) return;

    try {
      setIsLoading(true); // temporary loading
      if (isRealtimeDbConfigured && supabaseRealtime) {
        await addParticipantRT({
          session_id: sessionId,
          user_id: profileId,
          nickname: quizData?.creator_name || "Host"
        });
        toast.success("Joined as player!");
      }
    } catch (e) {
      console.error("Failed to join:", e);
      toast.error("Failed to join game");
    } finally {
      setIsLoading(false);
    }
  };

  // Start handling logic: Broadcast countdown then call Edge Function
  const handleStartGame = async () => {
    if (!gameSession) return;

    if (participants.length === 0) {
      toast.error("Waiting for participants... Ask them to join!");
      return;
    }

    try {
      const now = new Date().toISOString();

      // 1. Broadcast countdown start to all clients using EXISTING channel
      if (countdownChannelRef.current) {
        await sendCountdownSignal(countdownChannelRef.current, now);
      } else {
        console.warn("Countdown channel not ready");
      }

      // 2. Redirect immediately to play screen (Old Design)
      // The play screen will handle the countdown using the 'ts' parameter
      const targetUrl = isHostJoined
        ? `/player/${sessionId}/play?ts=${now}`
        : `/host/${sessionId}/play?ts=${now}`;
      router.push(targetUrl);

      // 3. Call Edge Function in background (it will handle DB updates)
      supabase.functions
        .invoke("start-game", {
          body: { sessionId }
        })
        .catch((err) => console.error("Edge Function error:", err));
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    }
  };

  // Subscribe to countdown broadcast (redundancy)
  useEffect(() => {
    if (!sessionId) return;

    const channel = subscribeToCountdownBroadcast(sessionId, (payload) => {
      // If we receive broadcast (e.g. from another tab or glitch), redirect
      if (payload.startedAt) {
        const targetUrl = isHostJoined
          ? `/player/${sessionId}/play?ts=${payload.startedAt}`
          : `/host/${sessionId}/play?ts=${payload.startedAt}`;
        router.push(targetUrl);
      }
    });

    countdownChannelRef.current = channel;

    return () => {
      unsubscribeFromCountdownBroadcast(channel);
      countdownChannelRef.current = null;
    };
  }, [sessionId, router]);

  // Effect: Watch for Status Change -> Finished
  useEffect(() => {
    if (gameSession?.status === "finished") {
      router.push(`/result/${sessionId}`);
    }
  }, [gameSession?.status, sessionId, router]);

  // Fallback: If status becomes active, redirect
  useEffect(() => {
    if (gameSession?.status === "active") {
      router.push(`/host/${sessionId}/play`);
    }
  }, [gameSession?.status, sessionId, router]);

  const handleKickPlayer = async () => {
    if (!participantToKick || !gameSession) return;
    try {
      // In Realtime DB approach, kicking usually means removing from participants list/table
      // Logic from reference:
      // await supabase.from('game_participants').delete()... OR update array

      // If valid realtime setup:
      if (isRealtimeDbConfigured && supabaseRealtime) {
        const { error } = await supabaseRealtime
          .from("game_participants_rt")
          .delete()
          .eq("id", participantToKick.id);

        if (error) throw error;
      } else {
        // Fallback Main DB (if participants stored there, but usually RT participants are in RT DB)
        // Assuming new structure uses RT DB for participants primarily as per previous steps.
        // But checking the ref code, it handles both.
      }

      setKickDialogOpen(false);
      setParticipantToKick(null);
      toast.success(`${participantToKick.nickname} kicked.`);
    } catch (error) {
      console.error("Error kicking player:", error);
      toast.error("Failed to kick player");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard!");
  };

  // Profile Cache Helper
  const profileCache = useRef(new Map<string, any>());
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

  // Initial Fetch
  useEffect(() => {
    const init = async () => {
      // Fetch Session + Quiz
      const { data: session, error } = await supabase
        .from("game_sessions")
        .select(
          `
          *,
          quizzes (
            id,
            title,
            description,
            image_url,
            questions,
            profiles (
              username,
              avatar_url
            )
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

      setGameSession(session);

      // Fetch Host Profile
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("nickname, avatar_url")
        .eq("id", session.host_id)
        .single();

      const normalizedQuiz = {
        ...quiz,
        creator_name: hostProfile?.nickname || "Unknown",
        creator_avatar: hostProfile?.avatar_url,
        question_count: session.question_limit
          ? parseInt(session.question_limit)
          : quiz.questions?.length || 0
      };

      setQuizData(normalizedQuiz);

      // Validate Host
      if (user && profileId && session.host_id !== profileId) {
        toast.error("You are not authorized to host this session.");
        router.push("/dashboard");
        return;
      }

      setIsLoading(false);

      // Save to localStorage for result page fallback (in case auth session is missing)
      if (profileId) {
        localStorage.setItem(`game_host_${session.id}`, profileId);
        localStorage.setItem("current_game_session", session.id);
        localStorage.setItem("current_profile_id", profileId);
        localStorage.setItem("current_host_id", profileId);
      }
    };

    if (user && profileId) {
      init();
    }
  }, [sessionId, router, user, profileId]);

  // Realtime Subscription
  useEffect(() => {
    if (isLoading || !gameSession) return;

    if (isRealtimeDbConfigured && supabaseRealtime) {
      // Initial Fetch Session Status from RT (in case we are in countdown which is only in RT)
      getGameSessionRT(sessionId).then((rtSession) => {
        if (rtSession) {
          setGameSession((prev: any) => ({ ...prev, ...rtSession }));
        }
      });

      // Initial Fetch Participants
      getParticipantsRT(sessionId).then(async (rtParticipants) => {
        const userIds = rtParticipants.map((p) => p.user_id).filter((id): id is string => !!id);
        await fetchProfiles(userIds);

        const mapped = rtParticipants.map((p) => ({
          id: p.id,
          nickname: p.nickname,
          user_id: p.user_id,
          avatar_url: p.user_id ? profileCache.current.get(p.user_id)?.avatar_url : null
        }));
        setParticipants(mapped);
      });

      const channel = subscribeToGameRT(sessionId, {
        onParticipantChange: async () => {
          // Refresh list
          const rtParticipants = await getParticipantsRT(sessionId);
          const userIds = rtParticipants.map((p) => p.user_id).filter((id): id is string => !!id);
          await fetchProfiles(userIds);

          const mapped = rtParticipants.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            user_id: p.user_id,
            avatar_url: p.user_id ? profileCache.current.get(p.user_id)?.avatar_url : null
          }));
          setParticipants(mapped);
        },
        onSessionChange: (payload) => {
          // Handle status changes if needed
        }
      });

      return () => {
        unsubscribeFromGameRT(channel);
      };
    }
  }, [isLoading, sessionId]);

  // Polling Fallback for Participants (Safety Net for RT inconsistencies)
  useEffect(() => {
    if (isLoading || !gameSession) return;

    const refreshParticipants = async () => {
      try {
        const rtParticipants = await getParticipantsRT(sessionId);
        if (!rtParticipants) return;

        const userIds = rtParticipants.map((p) => p.user_id).filter((id): id is string => !!id);
        await fetchProfiles(userIds);

        const mapped = rtParticipants.map((p) => ({
          id: p.id,
          nickname: p.nickname,
          user_id: p.user_id,
          avatar_url: p.user_id ? profileCache.current.get(p.user_id)?.avatar_url : null
        }));

        // In a real app we might diff before setting state to avoid renders,
        // but React is smart enough if array ref changes but content is effectively similar DOM-wise (keys match).
        setParticipants(mapped);
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    // const interval = setInterval(refreshParticipants, 3000); // Check every 3 seconds
    // return () => clearInterval(interval);
  }, [isLoading, sessionId]);

  if (isLoading || !quizData) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const joinLink =
    typeof window !== "undefined" ? `${window.location.origin}/join/${gameSession.game_pin}` : "";

  const shareToWhatsApp = () => {
    const message = `🎯 *GameforSmart*\n*${quizData?.title}*\n\nAyo main quiz bareng! 🎮\nTest pengetahuanmu dan menangkan hadiah!\n\n📌 PIN: *${gameSession?.game_pin}*\n👤 Host: ${quizData?.creator_name}\n\nKlik link untuk join:\n${joinLink}\n\n🏆 Gratis & Seru!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareToTelegram = () => {
    const message = `🎯 GameforSmart - ${quizData?.title}\n\nAyo main quiz bareng! 🎮\nTest pengetahuanmu dan menangkan hadiah!\n\nPIN: ${gameSession?.game_pin}\nHost: ${quizData?.creator_name}\n\nJoin sekarang:\n${joinLink}\n\n🏆 Gratis & Seru!`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      window.location.origin
    )}&text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, "_blank");
  };

  return (
    <div className="base-background relative h-screen overflow-y-auto">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_480px]">
        {/* Left Column: Stats & Participants */}
        <div className="order-2 space-y-4 p-4 lg:order-1">
          <Card
            className="card pt-2"
            style={
              { "--card-border-w": "1px", "--border-color": "var(--border)" } as React.CSSProperties
            }>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-3xl font-bold tracking-tight text-orange-950 dark:text-zinc-100">
                    {quizData.title}
                  </p>
                  <p className="text-sm text-orange-800/60 dark:text-zinc-400">
                    {quizData.description || "No description"}
                  </p>
                </div>

                <Card className="border-orange-100 bg-orange-50/50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                  <CardContent className="flex flex-col items-center justify-between gap-4 p-0 sm:flex-row">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border-2 border-white shadow-sm dark:border-zinc-800">
                        <AvatarImage src={quizData.creator_avatar} />
                        <AvatarFallback className="bg-orange-100 text-orange-600">
                          {quizData.creator_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[10px] font-bold tracking-wider text-orange-500 uppercase dark:text-zinc-500">
                          HOSTED BY
                        </p>
                        <p className="text-sm font-semibold text-orange-950 dark:text-zinc-100">
                          {quizData.creator_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-8">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 text-lg font-bold text-orange-900 dark:text-zinc-100">
                          <CircleQuestionMark className="size-5 text-yellow-500" />
                          <span>{quizData.question_count}</span>
                        </div>
                        <p className="text-[10px] font-bold tracking-wider text-orange-400 uppercase dark:text-zinc-500">
                          QUESTIONS
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 text-lg font-bold text-orange-900 dark:text-zinc-100">
                          <Timer className="size-5 text-orange-500" />
                          <span>{gameSession.total_time_minutes}m</span>
                        </div>
                        <p className="text-[10px] font-bold tracking-wider text-orange-400 uppercase dark:text-zinc-500">
                          TIME
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 text-lg font-bold text-orange-900 dark:text-zinc-100">
                          <User className="size-5 text-green-500" />
                          <span>{participants.length}</span>
                        </div>
                        <p className="text-[10px] font-bold tracking-wider text-orange-400 uppercase dark:text-zinc-500">
                          PLAYERS
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card
            className="card min-h-[75vh] border-0"
            style={
              { "--card-border-w": "1px", "--border-color": "var(--border)" } as React.CSSProperties
            }>
            <CardContent>
              {participants.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-orange-200 dark:text-zinc-500">
                  <Users className="mb-2 size-12 opacity-30" />
                  <p className="font-medium text-orange-800/40">Waiting for players to join...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {participants.map((player) => (
                    <Card
                      key={player.id}
                      className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-400 to-yellow-400 shadow-md shadow-orange-100 transition-colors">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 z-10 size-6 text-white hover:bg-white/20 hover:text-white"
                        onClick={() => {
                          setParticipantToKick(player);
                          setKickDialogOpen(true);
                        }}>
                        <UserX size={14} />
                      </Button>

                      <CardContent className="flex flex-col items-center px-3">
                        <Avatar className="mb-2 size-14 border-2 border-white shadow-sm dark:border-zinc-800">
                          <AvatarImage src={player.avatar_url || ""} />
                          <AvatarFallback className="bg-green-100 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {player.nickname.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p
                          className="w-full truncate text-center leading-tight font-semibold text-white dark:text-zinc-200"
                          title={player.nickname}>
                          {player.nickname}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls & QR */}
        <div className="order-1 p-4 pb-0 lg:order-2 lg:pb-4 lg:pl-0">
          <Card
            className="card sticky top-0 h-fit border-0 shadow-sm lg:top-4 lg:order-2"
            style={
              { "--card-border-w": "1px", "--border-color": "var(--border)" } as React.CSSProperties
            }>
            <CardContent className="flex h-full flex-col gap-6">
              {/* Settings */}
              <div className="relative flex items-center justify-center">
                <Image
                  src="/gameforsmartlogo.png"
                  width={200}
                  height={40}
                  alt="gameforsmart"
                  className="opacity-90 dark:opacity-100"
                  unoptimized
                />
                <Button
                  variant="ghost"
                  className="absolute right-0 h-14 w-14 p-0 text-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-zinc-800"
                  onClick={() => {
                    router.push(`/host/${sessionId}/settings?from=room`);
                  }}
                  title="Game Settings">
                  <Settings className="!h-7 !w-7" />
                </Button>
              </div>

              {/* Game PIN */}
              <div className="space-y-2 text-center">
                <p className="text-sm font-semibold tracking-wider text-orange-400 uppercase dark:text-zinc-500">
                  Game PIN
                </p>
                <div
                  className="flex cursor-pointer items-center justify-center gap-2 text-6xl font-black text-orange-500 transition-opacity hover:opacity-80 dark:text-orange-400"
                  onClick={() => copyToClipboard(gameSession.game_pin)}>
                  {gameSession.game_pin}
                  <Copy className="size-6 text-orange-300 opacity-50 dark:text-zinc-500" />
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="group cursor-pointer rounded-2xl border-2 border-orange-50 bg-white p-3 shadow-sm transition-colors hover:border-orange-400 dark:border-white/10 dark:bg-white dark:hover:border-orange-400">
                      <QRCodeSVG
                        value={joinLink}
                        size={200}
                        level="H"
                        className="transition-opacity group-hover:opacity-90"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="flex flex-col items-center sm:max-w-[620px]">
                    <DialogHeader>
                      <DialogTitle className="text-orange-600">Join Game</DialogTitle>
                    </DialogHeader>
                    <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-lg">
                      <QRCodeSVG value={joinLink} size={540} level="H" />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Join Link */}
              <div
                className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-orange-50/50 p-3 text-sm font-medium text-orange-800 transition-colors select-all hover:bg-orange-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800"
                onClick={() => copyToClipboard(joinLink)}>
                <span className="max-w-[240px] truncate">{joinLink}</span>
                <Copy size={14} className="text-orange-400" />
              </div>

              {/* Action Buttons */}
              <div className="mt-auto space-y-4">
                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    className="button-orange h-14 w-full text-lg font-bold"
                    onClick={handleStartGame}>
                    <Play className="mr-2 fill-current" /> Start Game
                  </Button>
                  <Button
                    variant={isHostJoined ? "secondary" : "outline"}
                    size="lg"
                    className={`w-full font-semibold ${!isHostJoined ? "button-orange-outline" : ""}`}
                    onClick={handleJoinAsPlayer}
                    disabled={isHostJoined || isLoading}>
                    {isHostJoined ? (
                      <>
                        <Check className="mr-2 text-green-600" /> Joined as Player
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2" /> Join as Player
                      </>
                    )}
                  </Button>
                </div>

                <Separator className="bg-orange-50" />

                <div className="grid grid-cols-2 gap-3">
                  <InviteGroup sessionId={sessionId} />
                  <InviteFriend sessionId={sessionId} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={shareToWhatsApp}
                    variant="ghost"
                    className="border border-dashed border-green-200 text-xs text-green-700 hover:bg-green-50">
                    WhatsApp
                  </Button>
                  <Button
                    onClick={shareToTelegram}
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

      {/* Kick Dialog */}
      <Dialog open={kickDialogOpen} onOpenChange={setKickDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <UserX size={20} /> Kick Player
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{participantToKick?.nickname}</strong> from
              the game?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setKickDialogOpen(false)}
              className="border-orange-100">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleKickPlayer}
              className="bg-red-600 hover:bg-red-700">
              Kick
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
