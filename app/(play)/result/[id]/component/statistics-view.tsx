import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  ChevronLeft, 
  LayoutDashboard, 
  Users, 
  Check,
  HelpCircle,
  FileQuestion,
  MessageSquare,
  Trophy
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface Question {
  id: string;
  question: string;
  correct?: string; // ID of the correct answer
  answers: {
    id: string;
    text?: string;
    answer?: string;
    isCorrect?: boolean;
  }[];
}

interface PlayerResponse {
  question_id: string;
  answer_id: string;
}

interface PlayerWithResponses {
  id: string;
  name: string;
  responses: PlayerResponse[];
}

interface StatisticsViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isHost: boolean;
  questions: Question[];
  players: PlayerWithResponses[]; 
  currentPlayerId?: string; 
}

export function StatisticsView({
  open,
  onOpenChange,
  isHost,
  questions = [],
  players = [],
  currentPlayerId,
}: StatisticsViewProps) {
  const router = useRouter();

  // Lock body scroll when open to prevent double scrollbars
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  // --- STATS CALCULATION ---
  const totalQuestions = questions.length;
  // Total answers = sum of all responses from all players
  const totalAnswers = players.reduce((acc, p) => acc + (p.responses?.length || 0), 0);
  
  // Total correct answers across all players
  const totalCorrectAnswers = players.reduce((acc, p) => {
    const playerCorrectCount = (p.responses || []).filter(r => {
      // Robust ID comparison
      const q = questions.find(q => String(q.id).trim() === String(r.question_id).trim());
      if (!q) return false;
      // Check correct ID from question root or fallback to answer property
      return String(r.answer_id).trim() === String(q.correct).trim() || q.answers.find(a => String(a.id).trim() === String(r.answer_id).trim())?.isCorrect;
    }).length;
    return acc + playerCorrectCount;
  }, 0);

  // Per-Question Stats Generator
  const getQuestionStats = (questionId: string) => {
    if (!players.length) return { correctCount: 0, percentCorrect: 0, incorrectCount: 0, participantCount: 0 };

    let participantCount = 0;
    let correctCount = 0;

    players.forEach((p) => {
      const response = p.responses?.find((r) => String(r.question_id).trim() === String(questionId).trim());
      if (response) {
        participantCount++;
        const question = questions.find((q) => String(q.id).trim() === String(questionId).trim());
        if (question) {
             const isAnsCorrect = String(response.answer_id).trim() === String(question.correct).trim() || 
                                  question.answers.find(a => String(a.id).trim() === String(response.answer_id).trim())?.isCorrect;
                                  
             if (isAnsCorrect) {
               correctCount++;
             }
        }
      }
    });

    const percentCorrect = participantCount > 0 ? Math.round((correctCount / participantCount) * 100) : 0;
    return { 
      correctCount, 
      incorrectCount: participantCount - correctCount, 
      participantCount,
      percentCorrect 
    };
  };

  const getMyAnswerStatus = (questionId: string) => {
    const me = players.find((p) => p.id === currentPlayerId);
    if (!me) return { status: 'unanswered', userAnswerId: null, correctAnswerId: undefined };

    const response = me.responses?.find((r) => String(r.question_id).trim() === String(questionId).trim());
    if (!response) return { status: 'unanswered', userAnswerId: null, correctAnswerId: undefined };

    const question = questions.find((q) => String(q.id).trim() === String(questionId).trim());
    if (!question) return { status: 'unanswered', userAnswerId: null, correctAnswerId: undefined };

    const isCorrect = String(response.answer_id).trim() === String(question.correct).trim() || 
                      question.answers.find(a => String(a.id).trim() === String(response.answer_id).trim())?.isCorrect;
                      
    return { 
      status: isCorrect ? 'correct' : 'incorrect', 
      userAnswerId: response.answer_id,
      correctAnswerId: question.correct
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* 1. Header Navigation */}
      <header className="bg-background border-b px-6 h-16 shrink-0 flex items-center justify-between shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Game Summary
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button onClick={() => router.push('/dashboard')} className="gap-2 bg-foreground text-background hover:bg-foreground/90">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
        </div>
      </header>
      
      {/* 2. Scrollable Content Area */}
      {/* Remove double scroll by using simple overflow-y-auto instead of ScrollArea which might conflict */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
            <div className="container mx-auto max-w-6xl p-6 space-y-8 pb-20">
            
            {/* Summary Cards (Host Only) */}
            {/* Summary Cards (Host Only) */}
            {isHost && (
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  {/* Questions Card */}
                  <Card className="border-none shadow-sm bg-blue-50/50 hover:bg-blue-50 transition-colors !py-2.5 !gap-2">
                    <CardContent className="p-3 flex flex-col md:flex-row items-center md:items-start justify-between gap-1.5 md:gap-4">
                      <div className="flex flex-col items-center md:items-start order-2 md:order-1">
                          <span className="text-[10px] md:text-xs font-semibold text-blue-600/70 uppercase tracking-wider">Questions</span>
                          <div className="text-xl md:text-3xl font-black text-slate-900 leading-none mt-0.5">{totalQuestions}</div>
                      </div>
                      <div className="h-7 w-7 md:h-10 md:w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 order-1 md:order-2">
                        <FileQuestion className="h-3.5 w-3.5 md:h-5 md:w-5 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Answers Card */}
                  <Card className="border-none shadow-sm bg-amber-50/50 hover:bg-amber-50 transition-colors !py-2.5 !gap-2">
                    <CardContent className="p-3 flex flex-col md:flex-row items-center md:items-start justify-between gap-1.5 md:gap-4">
                      <div className="flex flex-col items-center md:items-start order-2 md:order-1">
                          <span className="text-[10px] md:text-xs font-semibold text-amber-600/70 uppercase tracking-wider">Answers</span>
                          <div className="text-xl md:text-3xl font-black text-slate-900 leading-none mt-0.5">{totalAnswers}</div>
                      </div>
                      <div className="h-7 w-7 md:h-10 md:w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 order-1 md:order-2">
                        <MessageSquare className="h-3.5 w-3.5 md:h-5 md:w-5 text-amber-600" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Correct Card */}
                  <Card className="border-none shadow-sm bg-green-50/50 hover:bg-green-50 transition-colors !py-2.5 !gap-2">
                     <CardContent className="p-3 flex flex-col md:flex-row items-center md:items-start justify-between gap-1.5 md:gap-4">
                      <div className="flex flex-col items-center md:items-start order-2 md:order-1">
                          <span className="text-[10px] md:text-xs font-semibold text-green-600/70 uppercase tracking-wider">Correct</span>
                          <div className="text-xl md:text-3xl font-black text-slate-900 leading-none mt-0.5">{totalCorrectAnswers}</div>
                      </div>
                      <div className="h-7 w-7 md:h-10 md:w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 order-1 md:order-2">
                        <CheckCircle2 className="h-3.5 w-3.5 md:h-5 md:w-5 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

          {/* 3. Section Title (Removed) */}
          
          {/* 4. Question Cards List */}
          <div className="space-y-6">
            {questions.map((q, index) => {
              // Calculate Stats
              let stats, myStatus: { status: string; userAnswerId: string | null; correctAnswerId: string | undefined } | undefined;
              let correctAnswerText = "";
              
              const correctAnswerObj = q.answers.find(a => a.isCorrect);
              correctAnswerText = correctAnswerObj?.text || "No correct answer defined";

              if (isHost) {
                stats = getQuestionStats(q.id);
              } else {
                myStatus = getMyAnswerStatus(q.id);
              }

              return (
                <Card key={q.id} className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header Row */}
                    <div className="p-4 pb-2 flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                            <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100 px-2 py-0.5 text-xs font-medium rounded-md">
                                Question {index + 1}
                            </Badge>
                            <h3 className="text-base font-medium leading-relaxed text-slate-800">
                                {q.question}
                            </h3>
                        </div>
                        
                        {/* Host Badges */}
                        {isHost && stats && (
                            <div className="flex gap-2 shrink-0">
                                <Badge variant="outline" className="h-8 gap-1.5 px-3 bg-blue-50 text-blue-700 border-blue-100 hidden sm:flex">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{stats.participantCount}</span>
                                </Badge>
                                <Badge variant="outline" className="h-8 gap-1.5 px-3 bg-green-50 text-green-700 border-green-100 hidden sm:flex">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{stats.correctCount}</span>
                                </Badge>
                            </div>
                        )}
                         
                         {/* Player Badges */}
                         {!isHost && myStatus && (
                             <div className="shrink-0">
                                {myStatus.status === 'correct' ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 shadow-none px-3 py-1">
                                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Correct
                                    </Badge>
                                ) : myStatus.status === 'incorrect' ? (
                                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 shadow-none px-3 py-1">
                                        <XCircle className="w-4 h-4 mr-1.5" /> Incorrect
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Skipped</Badge>
                                )}
                             </div>
                         )}
                    </div>

                    {/* Answer Options List */}
                    <div className="px-4 pb-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.answers.map((ans: any, idx) => {
                                // Handle potential different property names for correctness
                                // Check if q.correct (string ID) matches ans.id OR if ans.isCorrect is strictly true
                                const isCorrect = (q.correct !== undefined && String(q.correct) === String(ans.id)) || 
                                                  (ans.isCorrect === true) || 
                                                  (ans.is_correct === true);

                                const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
                                // Handle potential different property names for the answer text
                                const answerText = ans.text || ans.answer || ans.option || ans.label || "";
                                
                                return (
                                    <div 
                                        key={ans.id || idx} 
                                        className={cn(
                                            "relative flex items-center gap-3 p-3 rounded-md border text-sm transition-colors",
                                            isCorrect 
                                                ? "bg-green-50 border-green-200 text-green-900 ring-1 ring-green-100" 
                                                : "bg-white border-slate-200 text-slate-600"
                                        )}
                                    >
                                        <span className={cn(
                                            "flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0",
                                            isCorrect ? "bg-green-200 text-green-800" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {optionLabel}
                                        </span>
                                        <span className="font-medium leading-tight flex-1">{answerText}</span>
                                        
                                        {isCorrect && (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 absolute right-3" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer: Progress / Stats */}
                    {isHost && stats && (
                        <div className="px-4 pb-4 pt-0 space-y-2">
                           <div className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                <span>Accuracy</span>
                                <span className="text-slate-900 font-bold">{stats.percentCorrect}%</span>
                           </div>
                           <Progress 
                                value={stats.percentCorrect} 
                                className="h-2" 
                                indicatorColor={
                                    stats.percentCorrect > 75 ? "bg-green-500" :
                                    stats.percentCorrect > 40 ? "bg-yellow-500" : "bg-red-500"
                                }
                           />
                           <div className="flex justify-between text-[10px] text-muted-foreground">
                               <span>{stats.correctCount} correct</span>
                               <span>{stats.incorrectCount} incorrect</span>
                           </div>
                        </div>
                    )}

                    {/* For Player: Show their answer if wrong */}
                    {!isHost && myStatus?.status === 'incorrect' && (
                         <div className="bg-red-50/50 border-t border-red-100 px-6 py-4">
                             <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5" /> Your Answer:
                                </span>
                                <p className="text-red-700 font-medium pl-5 mt-0.5">
                                    {q.answers.find(a => a.id === myStatus?.userAnswerId)?.text || "No answer"}
                                </p>
                             </div>
                         </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
