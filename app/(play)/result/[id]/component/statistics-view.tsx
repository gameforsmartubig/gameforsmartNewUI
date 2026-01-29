import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
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
  HelpCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  question: string;
  answers: {
    id: string;
    text: string;
    isCorrect: boolean;
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

  if (!open) return null;

  // --- STATS CALCULATION ---
  const totalQuestions = questions.length;
  // Total answers = sum of all responses from all players
  const totalAnswers = players.reduce((acc, p) => acc + (p.responses?.length || 0), 0);
  
  // Total correct answers across all players
  const totalCorrectAnswers = players.reduce((acc, p) => {
    const playerCorrectCount = (p.responses || []).filter(r => {
      const q = questions.find(q => q.id === r.question_id);
      const correctAns = q?.answers.find(a => a.isCorrect);
      return r.answer_id === correctAns?.id;
    }).length;
    return acc + playerCorrectCount;
  }, 0);

  // Per-Question Stats Generator
  const getQuestionStats = (questionId: string) => {
    if (!players.length) return { correctCount: 0, percentCorrect: 0, incorrectCount: 0, participantCount: 0 };

    let participantCount = 0;
    let correctCount = 0;

    players.forEach((p) => {
      const response = p.responses?.find((r) => r.question_id === questionId);
      if (response) {
        participantCount++;
        const question = questions.find((q) => q.id === questionId);
        const correctAnswer = question?.answers.find((a) => a.isCorrect);
        if (response.answer_id === correctAnswer?.id) {
          correctCount++;
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

    const response = me.responses?.find((r) => r.question_id === questionId);
    if (!response) return { status: 'unanswered', userAnswerId: null, correctAnswerId: undefined };

    const question = questions.find((q) => q.id === questionId);
    const correctAnswer = question?.answers.find((a) => a.isCorrect);
    
    const isCorrect = response.answer_id === correctAnswer?.id;
    return { 
      status: isCorrect ? 'correct' : 'incorrect', 
      userAnswerId: response.answer_id,
      correctAnswerId: correctAnswer?.id
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50/95 flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* 1. Header Navigation */}
      <header className="bg-background border-b px-6 h-16 shrink-0 flex items-center justify-between shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            {isHost ? "Question Statistics" : "My Performance"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Session Analysis</p>
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
      {/* We use h-[calc(100vh-4rem)] because header is 4rem (h-16) */}
      <div className="flex-1 overflow-hidden bg-slate-50/30">
        <ScrollArea className="h-full w-full">
            <div className="container mx-auto max-w-6xl p-6 space-y-8 pb-20">
            
            {/* Summary Cards (Host Only) */}
            {isHost && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm ring-1 ring-slate-200">
                <CardContent className="flex flex-col items-center justify-center p-6 py-8">
                  <span className="text-4xl font-bold text-blue-600 mb-2">{totalQuestions}</span>
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Questions</span>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm ring-1 ring-slate-200">
                <CardContent className="flex flex-col items-center justify-center p-6 py-8">
                  <span className="text-4xl font-bold text-purple-600 mb-2">{totalAnswers}</span>
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Answers</span>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm ring-1 ring-slate-200">
                <CardContent className="flex flex-col items-center justify-center p-6 py-8">
                  <span className="text-4xl font-bold text-green-600 mb-2">{totalCorrectAnswers}</span>
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Correct Answers</span>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 3. Section Title */}
          <div className="flex items-center gap-2 pt-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-slate-800">
              {isHost ? "Question Statistics Details" : "Question Review"}
            </h2>
          </div>

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
                    <div className="p-6 pb-4 flex items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                            <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100 px-3 py-1 text-sm font-medium rounded-md">
                                Question {index + 1}
                            </Badge>
                            <h3 className="text-lg font-medium leading-relaxed text-slate-800">
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

                    {/* Answer Key Box (Green Box) */}
                    <div className="px-6 pb-6">
                        <div className="bg-green-50/80 border border-green-100 rounded-lg p-4 flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-700">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Correct Answer:</span>
                            </div>
                            <p className="text-green-800 font-medium text-base pl-6">
                                {correctAnswerText}
                            </p>
                        </div>
                    </div>

                    {/* Footer: Progress / Stats */}
                    {isHost && stats && (
                        <div className="bg-slate-50 border-t px-6 py-4 space-y-2">
                           <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                                <span>Accuracy Level</span>
                                <span>{stats.percentCorrect}%</span>
                           </div>
                           <Progress 
                                value={stats.percentCorrect} 
                                className="h-2.5 bg-slate-200"
                                indicatorColor={
                                    stats.percentCorrect > 75 ? "bg-green-500" :
                                    stats.percentCorrect > 40 ? "bg-yellow-500" : "bg-red-500"
                                }
                           />
                           <div className="flex justify-between text-xs text-muted-foreground pt-1">
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
      </ScrollArea>
      </div>
    </div>
  );
}
