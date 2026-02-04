"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Crown, Medal, Trophy, LayoutDashboard, BarChart3, RotateCcw, Download, Home, Award, Target, CheckCircle2 } from "lucide-react";
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
  score: number;         // Raw score from game
  normalizedScore: number; // Score normalized to max 100
  correctAnswers: number;  // Number of correct answers
  totalQuestions: number;  // Total questions in the quiz
  responses: any[];        // Raw responses
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
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo area */}
        <div className="flex items-center gap-2">
          <img src="/gameforsmartlogo.png" alt="Gameforsmart" className="h-8 w-auto" />
        </div>

        {/* Actions - Different for Host vs Player */}
        {/* Actions - Different for Host vs Player */}
        <div className="flex items-center gap-2">
          {isHost ? (
            <>
              <Button variant="ghost" size="sm" className="gap-2" onClick={onDashboard}>
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" onClick={onStatistics}>
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Statistics</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={onRestart}>
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Restart</span>
              </Button>
              <Button size="sm" className="gap-2" onClick={onExport}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" className="gap-2 shadow-sm bg-white hover:bg-slate-50 border" onClick={onStatistics}>
              <BarChart3 className="h-4 w-4 text-primary" />
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
  const others = sortedPlayers.slice(3);

  // Component for the list of other players
  const OtherPlayersList = () => (
    <Card className="h-full border-none shadow-none md:border md:shadow-sm">
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] lg:h-[500px] w-full pr-4">
          <div className="divide-y divide-border">
            {others.map((p, index) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground text-sm">
                  {index + 4}
                </div>
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={p.image || ""} />
                  <AvatarFallback>{p.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.correctAnswers}/{p.totalQuestions} correct</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">{p.normalizedScore}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 p-4 md:p-8 overflow-auto">
      <div className="mx-auto w-full max-w-7xl flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* Left Side: Podium (Takes full width on mobile, 2/3 on desktop) */}
        <div className="flex-1 flex flex-col justify-center min-h-[50vh]">
          {/* Header */}
          <div className="text-center space-y-1 mb-2 md:mb-6">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Leaderboard</h1>
          </div>

          {/* Podium Section - Compact Scale */}
          <div className="flex items-end justify-center pt-2 md:pt-6 pb-4 md:pb-8">
            <div className="flex items-end justify-center gap-2 md:gap-6 w-full max-w-3xl px-4">
              
              {/* Rank 2 (Silver) - Left */}
              {top2 && (
                <div className="flex flex-col items-center gap-2 md:gap-3 w-1/3">
                  <div className="relative">
                    <Avatar className="h-14 w-14 md:h-20 md:w-20 border-4 border-slate-300 shadow-xl">
                      <AvatarImage src={top2.image || ""} alt={top2.name} />
                      <AvatarFallback className="text-xs md:text-sm bg-slate-100">{top2.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm border border-slate-300 z-20">
                      <span>2</span>
                    </div>
                  </div>
                  <div className="text-center mt-0.5">
                    <h3 className="font-semibold text-xs md:text-base line-clamp-1">{top2.name}</h3>
                    <div className="text-sm md:text-xl font-bold text-slate-500">{top2.normalizedScore}</div>
                  </div>
                  <div className="w-full h-16 md:h-32 bg-gradient-to-t from-slate-300 to-slate-100 rounded-t-xl border-x border-t border-slate-300 flex items-end justify-center pb-2 md:pb-4 shadow-lg shadow-slate-300/20">
                    <Medal className="h-6 w-6 md:h-10 md:w-10 text-slate-400 opacity-80" />
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold) - Center */}
              {top1 && (
                <div className="flex flex-col items-center gap-2 md:gap-3 w-1/3 z-10">
                  {/* Crown - positioned above avatar, not absolute */}
                  <div className="flex flex-col items-center">
                    <Crown className="h-6 w-6 md:h-10 md:w-10 text-yellow-500 mb-1 animate-bounce" />
                    <div className="relative">
                      <Avatar className="h-16 w-16 md:h-28 md:w-28 border-4 border-yellow-400 shadow-2xl ring-4 ring-yellow-400/20">
                        <AvatarImage src={top1.image || ""} alt={top1.name} />
                        <AvatarFallback className="text-base md:text-xl bg-yellow-50">{top1.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold shadow-sm border border-yellow-500 flex items-center gap-1 z-20">
                        <Trophy className="h-2.5 w-2.5" />
                        <span>1</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-0.5">
                    <h3 className="font-bold text-sm md:text-xl line-clamp-1">{top1.name}</h3>
                    <div className="text-xl md:text-4xl font-black text-primary">{top1.normalizedScore}</div>
                  </div>
                  <div className="w-full h-24 md:h-48 bg-gradient-to-t from-yellow-300 to-yellow-100 rounded-t-xl border-x border-t border-yellow-400 flex items-end justify-center pb-3 md:pb-6 shadow-xl shadow-yellow-500/20">
                    <Trophy className="h-8 w-8 md:h-14 md:w-14 text-yellow-600 opacity-80" />
                  </div>
                </div>
              )}

              {/* Rank 3 (Bronze) - Right */}
              {top3 && (
                <div className="flex flex-col items-center gap-2 md:gap-3 w-1/3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 md:h-16 md:w-16 border-4 border-orange-300 shadow-xl">
                      <AvatarImage src={top3.image || ""} alt={top3.name} />
                      <AvatarFallback className="text-xs md:text-sm bg-orange-50">{top3.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm border border-orange-300 z-20">
                      <span>3</span>
                    </div>
                  </div>
                  <div className="text-center mt-0.5">
                    <h3 className="font-semibold text-xs md:text-base line-clamp-1">{top3.name}</h3>
                    <div className="text-sm md:text-xl font-bold text-orange-600">{top3.normalizedScore}</div>
                  </div>
                  <div className="w-full h-14 md:h-24 bg-gradient-to-t from-orange-300 to-orange-100 rounded-t-xl border-x border-t border-orange-300 flex items-end justify-center pb-2 md:pb-3 shadow-lg shadow-orange-300/20">
                    <Medal className="h-5 w-5 md:h-9 md:w-9 text-orange-500 opacity-80" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: List (Hidden on mobile, visible on desktop) */}
        {others.length > 0 && (
          <div className="hidden lg:block w-full lg:w-96 shrink-0 border-l pl-8">
            <h3 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Others</h3>
            <OtherPlayersList />
          </div>
        )}

        {/* Mobile List Trigger (Visible on mobile only) */}
        {others.length > 0 && (
         <div className="lg:hidden fixed bottom-6 right-6 z-50">
           <Dialog>
             <DialogTrigger asChild>
               <Button size="lg" className="rounded-full h-14 w-14 shadow-xl">
                 <LayoutDashboard className="h-6 w-6" />
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-md h-[80vh] flex flex-col">
               <DialogHeader>
                 <DialogTitle>Leaderboard</DialogTitle>
                 <DialogDescription>Full rankings for this session</DialogDescription>
               </DialogHeader>
               <div className="flex-1 overflow-hidden">
                 <OtherPlayersList />
               </div>
               <DialogClose asChild>
                 <Button type="button" variant="secondary">
                   Close
                 </Button>
               </DialogClose>
             </DialogContent>
           </Dialog>
         </div>
        )}
      </div>
    </div>
  );
}

// Player View: Personal Result
function PlayerResult({ player }: PlayerResultProps) {
  const router = useRouter();
  const accuracyPercent = player.totalQuestions > 0 
    ? Math.round((player.correctAnswers / player.totalQuestions) * 100) 
    : 0;
  
  return (
    <div className="flex-1 p-4 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-sm space-y-4">
        
        {/* Congratulations Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-muted mx-auto">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Quiz Complete!</h1>
          </div>
        </div>

        {/* Player Card */}
        <Card className="border-none shadow-sm drop-shadow-sm">
          <CardContent className="p-4 space-y-4">
            {/* Avatar & Name - Clean Layout */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/10">
                <AvatarImage src={player.image || ""} alt={player.name} />
                <AvatarFallback className="text-sm">{player.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left">
                <h2 className="text-base font-bold leading-tight">{player.name}</h2>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-1">
                  <Trophy className="h-3 w-3 text-orange-500" />
                  <span>Rank <span className="text-foreground font-bold text-sm">#{player.rank}</span> of {player.totalPlayers}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Score - Normalized to max 100 */}
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Score</span>
                <p className="text-2xl font-black text-foreground">{player.normalizedScore}</p>
              </div>

              {/* Correct */}
              <div className="bg-green-500/5 rounded-lg p-3 text-center">
                <span className="text-[10px] font-bold text-green-600/70 uppercase tracking-wider block mb-0.5">Correct</span>
                <p className="text-2xl font-black text-green-600">
                  {player.correctAnswers}<span className="text-sm text-muted-foreground/60 font-medium">/{player.totalQuestions}</span>
                </p>
              </div>
            </div>

            {/* Accuracy */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Accuracy</span>
                </div>
                <span className="font-bold">{accuracyPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-500 ease-out rounded-full" 
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
            className="h-10 text-sm font-semibold"
            onClick={() => router.push('/dashboard')}
          >
            <Home className="h-3.5 w-3.5 mr-2" />
            Home
          </Button>
          <Button 
            className="h-10 text-sm font-semibold bg-foreground hover:bg-foreground/90 text-background"
            onClick={() => router.push('/join')}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
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
  const [currentPlayer, setCurrentPlayer] = useState<(Player & { rank: number; totalPlayers: number }) | null>(null);
  
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
        .select(`
          *,
          quizzes (
            questions
          )
        `)
        .eq("id", id)
        .single();

      if (fetchError || !currentSession) {
        console.error("Fetch current session error:", fetchError);
        toast.error("Could not retrieve session data");
        return;
      }

      // Ensure we have valid questions from the quiz source
      // Handle array or single object response logic for foreign key (it's usually single, but defensive check)
      const quizData = Array.isArray(currentSession.quizzes) ? currentSession.quizzes[0] : currentSession.quizzes;
      let freshQuestions = quizData?.questions || currentSession.current_questions || [];

      if (!freshQuestions || freshQuestions.length === 0) {
          toast.error("Error: No questions found for this quiz source.");
          return;
      }
      
      // APPLY QUESTION LIMIT
      const limit = parseInt(currentSession.question_limit);
      if (!isNaN(limit) && limit > 0 && limit < freshQuestions.length) {
          // Shuffle questions (optional but good for restarts) or just take first N
          // For consistency with original logic, let's just slice for now to respect the limit
          freshQuestions = freshQuestions.slice(0, limit);
      }

      // 2. Generate new session data
      const newSessionId = generateXID();
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      
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
      const { error: createError } = await supabase
        .from("game_sessions")
        .insert(newSession);

      if (createError) {
        console.error("Create session error:", createError);
        throw createError;
      }

      // 3.5 Create Session in Realtime DB if configured
      if (isRealtimeDbConfigured) {
        const { participants, ...rtSessionData } = newSession;
        await createGameSessionRT(rtSessionData);
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
      const csvHeaders = ["Rank", "Name", "Score", "Correct Answers", "Total Questions", "Accuracy (%)"];
      
      // Map player data to CSV rows
      const rows = sortedPlayers.map((p, index) => {
        const accuracy = p.totalQuestions > 0 
          ? Math.round((p.correctAnswers / p.totalQuestions) * 100) 
          : 0;
          
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
      link.style.visibility = 'hidden';
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
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log("Auth User:", user?.id, "Error:", authError?.message);
        
        // 1. Get user's profile ID (XID format) - this matches host_id and participant.user_id
        let profileId: string | null = null;
        
        if (user) {
          // Authenticated user - get profile from database
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("auth_user_id", user.id)
            .single();
          console.log("Profile query result:", profile, "Error:", profileError?.message);
          profileId = profile?.id || null;
        } else {
          // No authenticated user - try to get profile ID from localStorage (saved during join/host)
          // Check for host first, then participant
          const storedHostId = localStorage.getItem(`game_host_${id}`);
          const storedParticipantId = localStorage.getItem(`game_participant_${id}`);
          const storedCurrentHostId = localStorage.getItem("current_host_id");
          const storedProfileId = localStorage.getItem("current_profile_id");
          
          profileId = storedHostId || storedParticipantId || storedCurrentHostId || storedProfileId || null;
          console.log("No auth - using stored ID:", profileId, {
            storedHostId,
            storedParticipantId,
            storedCurrentHostId,
            storedProfileId
          });
        }
        
        // 2. Fetch game session AND questions
        const { data: session, error: sessionError } = await supabase
          .from("game_sessions")
          .select(`
            *,
            quizzes (
              questions
            )
          `)
          .eq("id", id)
          .single();
        
        console.log("Session query result:", session ? "Found" : "Not Found", "Error:", sessionError);
        console.log("Session host_id:", session?.host_id);
        console.log("Session participants:", session?.participants);
        console.log("Is Host?", profileId, "===", session?.host_id, "=", profileId === session?.host_id);

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
          let activeQuestions = session.current_questions && session.current_questions.length > 0
              ? session.current_questions
              : fullQuestions;

          // Apply question limit explicitly
          // Even if current_questions is used, we ensure it respects the limit stored in session
          const questionLimit = parseInt(session.question_limit);
          if (!isNaN(questionLimit) && questionLimit > 0 && questionLimit < activeQuestions.length) {
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
            const userIds = participants
              .map((p) => p.user_id)
              .filter((id): id is string => !!id);
            
            let avatarMap: Record<string, string> = {};
            if (userIds.length > 0) {
              const { data: profiles } = await supabase
                .from("profiles")
                .select("id, avatar_url")
                .in("id", userIds);
              
              if (profiles) {
                avatarMap = profiles.reduce((acc, p) => {
                  if (p.avatar_url) acc[p.id] = p.avatar_url;
                  return acc;
                }, {} as Record<string, string>);
              }
            }
            
            // Map participants to players with full data
            // NEW LOGIC: Support both embedded responses (Legacy) and separated responses (New Clean Mode)
            const allSessionResponses = (session.responses as any[]) || [];
            
            const mappedPlayers: Player[] = participants.map((p) => {
              // Get responses for THIS participant from the centralized responses array
              const separateResponses = allSessionResponses.filter(r => r.participant_id === p.id || r.participant_id === p.user_id);
              
              // Fallback to embedded responses if available (Hybrid/Legacy), otherwise use separate
              const embeddedResponses = Array.isArray(p.responses) ? p.responses : [];
              
              // Prefer separate responses if available (newer source of truth), else legacy
              const responses = separateResponses.length > 0 ? separateResponses : embeddedResponses;
              
              const responsesCount = responses.length;
              const totalQ = questionLimit;
              
              // RECALCULATE SCORE MANUALLY
              // Don't trust p.score from DB due to potential sync/mismatch issues
              let recalculatedCorrectCount = 0;
              
              responses.forEach((r: any) => {
                  const q = activeQuestions.find((ques: any) => String(ques.id).trim() === String(r.question_id).trim());
                  if (q) {
                      // Check correctness
                      const isCorrect = String(r.answer_id).trim() === String(q.correct).trim() || 
                                        q.answers?.find((a: any) => String(a.id).trim() === String(r.answer_id).trim())?.isCorrect;
                      
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
              const normalizedScore = totalQ > 0 
                ? Math.round((correctAns / totalQ) * 100) 
                : 0;
              
              return {
                id: p.user_id || p.id,
                name: p.nickname || "Unknown",
                image: p.avatar || avatarMap[p.user_id] || null,
                answered: responsesCount,
                score: rawScore,
                normalizedScore,
                correctAnswers: correctAns,
                totalQuestions: totalQ,
                responses: responses
              };
            }).sort((a, b) => b.score - a.score);

            console.log("Mapped Players:", mappedPlayers);
            setPlayers(mappedPlayers);

            // 4. Find current player (compare profile ID with participant user_id)
            if (profileId) {
              console.log("Looking for player with profile ID:", profileId);
              const playerIndex = mappedPlayers.findIndex(p => {
                console.log("Comparing:", p.id, "with", profileId);
                return p.id === profileId;
              }); 
              console.log("Player found at index:", playerIndex);
              
              if (playerIndex !== -1) {
                const p = mappedPlayers[playerIndex];
                setCurrentPlayer({
                  ...p,
                  rank: playerIndex + 1,
                  totalPlayers: mappedPlayers.length
                });
                console.log("Current player set!");
              } else {
                console.log("Player NOT found in participants list");
              }
            }
          } else {
            // Participants empty, likely syncing
            console.log("Participants empty - setting isSyncing to true");
            setIsSyncing(true);
          }
        } else {
          console.log("Session not found!");
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
          filter: `id=eq.${id}`,
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
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-white dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Loading game data...</p>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-6 text-center p-4 bg-white dark:bg-zinc-950">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          <Trophy className="h-16 w-16 text-primary relative z-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Calculating Results...</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            We are gathering scores from all players. This generally takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
        <div className="flex-1 flex items-center justify-center p-4 text-center">
             <div className="max-w-md space-y-4">
                <LayoutDashboard className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                <h3 className="text-lg font-semibold">Waiting for Results</h3>
                <p className="text-muted-foreground">
                  You are not listed as a participant in this session, or the results are still being finalized by the host.
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
