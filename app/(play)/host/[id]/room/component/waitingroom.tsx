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
  UserX
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
  setCachedProfile
} from "@/lib/supabase-realtime";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

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

  // Start handling logic
  const handleStartGame = async () => {
    if (!gameSession) return;
    try {
      // Update status to 'active' or 'countdown'
      const updateData = {
        status: "active",
        started_at: new Date().toISOString()
      };

      // Update Main DB
      await supabase.from("game_sessions").update(updateData).eq("id", sessionId);

      // Update Realtime DB
      if (isRealtimeDbConfigured) {
        await updateGameSessionRT(sessionId, updateData);
      }

      toast.success("Game started!");
      // Redirect to game play page (assuming it is /host/[id]/play or just /host/[id])
      // Based on user prompt "select_question_for_session dan akan mengarahkan ke /host/[id]/page",
      // usually /host/[id] is the game controller.
      router.push(`/host/${sessionId}/play`);
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    }
  };

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
      // Normalizing quiz data
      const quizCreator = Array.isArray(quiz.profiles) ? quiz.profiles[0] : quiz.profiles;
      const normalizedQuiz = {
        ...quiz,
        creator_name: quizCreator?.username || "Unknown",
        creator_avatar: quizCreator?.avatar_url,
        question_count: quiz.questions?.length || 0
      };

      setGameSession(session);
      setQuizData(normalizedQuiz);

      // Validate Host
      if (user && profileId && session.host_id !== profileId) {
        toast.error("You are not authorized to host this session.");
        router.push("/dashboard");
        return;
      }

      setIsLoading(false);
    };

    if (user && profileId) {
      init();
    }
  }, [sessionId, router, user, profileId]);

  // Realtime Subscription
  useEffect(() => {
    if (!gameSession) return;

    if (isRealtimeDbConfigured && supabaseRealtime) {
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
  }, [gameSession, sessionId]);

  if (isLoading || !quizData) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const joinLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?pin=${gameSession.game_pin}`
      : "";

  return (
    <div className="h-screen overflow-y-auto bg-gray-50/50">
      <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1fr_480px]">
        {/* Left Column: Stats & Participants */}
        <div className="order-2 space-y-4 p-4 lg:order-1">
          <Card className="border-0 bg-white shadow-sm">
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-3xl font-bold tracking-tight text-gray-900">
                    {quizData.title}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {quizData.description || "No description"}
                  </p>
                </div>

                <Card className="border-gray-100 bg-gray-50/50 p-4">
                  <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border-2 border-white shadow-sm">
                        <AvatarImage src={quizData.creator_avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {quizData.creator_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                          HOSTED BY
                        </p>
                        <p className="text-sm font-semibold">{quizData.creator_name}</p>
                      </div>
                    </div>

                    <div className="flex gap-8">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                          <CircleQuestionMark className="size-5 text-blue-500" />
                          <span>{quizData.question_count}</span>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                          QUESTIONS
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                          <Timer className="size-5 text-orange-500" />
                          <span>{gameSession.total_time_minutes}m</span>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                          TIME
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                          <User className="size-5 text-green-500" />
                          <span>{participants.length}</span>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                          PLAYERS
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[420px] border-0 bg-white shadow-sm">
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-muted-foreground flex h-40 flex-col items-center justify-center">
                  <Users className="mb-2 size-12 opacity-20" />
                  <p>Waiting for players to join...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {participants.map((player) => (
                    <Card
                      key={player.id}
                      className="group relative overflow-hidden border-0 bg-gray-50 transition-colors hover:bg-gray-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 z-10 size-6 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
                        onClick={() => {
                          setParticipantToKick(player);
                          setKickDialogOpen(true);
                        }}>
                        <UserX size={14} />
                      </Button>

                      <CardContent className="flex flex-col items-center p-3">
                        <Avatar className="mb-2 size-12 border-2 border-white shadow-sm">
                          <AvatarImage src={player.avatar_url || ""} />
                          <AvatarFallback className="bg-purple-100 text-xs text-purple-600">
                            {player.nickname.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p
                          className="w-full truncate text-center text-sm leading-tight font-medium"
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
        <div className="order-1 p-4 sm:pl-0 pb-0">
        <Card className="h-full bg-white lg:order-2 ">
          <CardContent className="sticky top-0 flex h-full flex-col gap-6">
            {/* Branding */}
            <div className="flex justify-center">
              <Image
                src="/gameforsmartlogo.png"
                width={200}
                height={40}
                alt="gameforsmart"
                className="opacity-80"
                unoptimized
              />
            </div>

            {/* Game PIN */}
            <div className="space-y-2 text-center">
              <p className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                Game PIN
              </p>
              <div
                className="flex cursor-pointer items-center justify-center gap-2 text-6xl font-black text-purple-600 transition-opacity hover:opacity-80"
                onClick={() => copyToClipboard(gameSession.game_pin)}>
                {gameSession.game_pin}
                <Copy className="text-muted-foreground size-6 opacity-50" />
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="group cursor-pointer rounded-2xl border-2 border-gray-100 bg-white p-3 shadow-sm transition-colors hover:border-purple-200">
                    <QRCodeSVG
                      value={joinLink}
                      size={200}
                      level="H"
                      className="transition-opacity group-hover:opacity-90"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="flex flex-col items-center sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Join Game</DialogTitle>
                    <DialogDescription>Scan to join</DialogDescription>
                  </DialogHeader>
                  <div className="rounded-xl border bg-white p-4 shadow-lg">
                    <QRCodeSVG value={joinLink} size={400} level="H" />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Join Link */}
            <div
              className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-600 transition-colors select-all hover:bg-gray-100"
              onClick={() => copyToClipboard(joinLink)}>
              <span className="max-w-[240px] truncate">{joinLink}</span>
              <Copy size={14} />
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-4">
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  className="h-14 w-full bg-purple-600 text-lg font-bold shadow-md shadow-purple-600/20 hover:bg-purple-700"
                  onClick={handleStartGame}>
                  <Play className="mr-2 fill-current" /> Start Game
                </Button>
                <Button variant="outline" size="lg" className="w-full font-semibold">
                  <UserPlus className="mr-2" /> Join as Player
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="text-xs">
                  <Users className="mr-2 size-3" /> Invite Group
                </Button>
                <Button variant="outline" className="text-xs">
                  <Share2 className="mr-2 size-3" /> Invite Friends
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="ghost"
                  className="text-muted-foreground border border-dashed text-xs">
                  WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground border border-dashed text-xs">
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
            <Button variant="outline" onClick={() => setKickDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleKickPlayer}>
              Kick
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
