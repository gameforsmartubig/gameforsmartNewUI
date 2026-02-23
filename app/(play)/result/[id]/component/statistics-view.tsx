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
    option?: string;
    label?: string;
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
  currentPlayerId
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
    const playerCorrectCount = (p.responses || []).filter((r) => {
      // Robust ID comparison
      const q = questions.find((q) => String(q.id).trim() === String(r.question_id).trim());
      if (!q) return false;
      // Check correct ID from question root or fallback to answer property
      return (
        String(r.answer_id).trim() === String(q.correct).trim() ||
        q.answers.find((a) => String(a.id).trim() === String(r.answer_id).trim())?.isCorrect
      );
    }).length;
    return acc + playerCorrectCount;
  }, 0);

  // Per-Question Stats Generator
  const getQuestionStats = (questionId: string) => {
    if (!players.length)
      return { correctCount: 0, percentCorrect: 0, incorrectCount: 0, participantCount: 0 };

    let participantCount = 0;
    let correctCount = 0;

    players.forEach((p) => {
      const response = p.responses?.find(
        (r) => String(r.question_id).trim() === String(questionId).trim()
      );
      if (response) {
        participantCount++;
        const question = questions.find((q) => String(q.id).trim() === String(questionId).trim());
        if (question) {
          const isAnsCorrect =
            String(response.answer_id).trim() === String(question.correct).trim() ||
            question.answers.find((a) => String(a.id).trim() === String(response.answer_id).trim())
              ?.isCorrect;

          if (isAnsCorrect) {
            correctCount++;
          }
        }
      }
    });

    const percentCorrect =
      participantCount > 0 ? Math.round((correctCount / participantCount) * 100) : 0;
    return {
      correctCount,
      incorrectCount: participantCount - correctCount,
      participantCount,
      percentCorrect
    };
  };

  const getMyAnswerStatus = (questionId: string) => {
    const me = players.find((p) => p.id === currentPlayerId);
    if (!me) return { status: "unanswered", userAnswerId: null, correctAnswerId: undefined };

    const response = me.responses?.find(
      (r) => String(r.question_id).trim() === String(questionId).trim()
    );
    if (!response) return { status: "unanswered", userAnswerId: null, correctAnswerId: undefined };

    const question = questions.find((q) => String(q.id).trim() === String(questionId).trim());
    if (!question) return { status: "unanswered", userAnswerId: null, correctAnswerId: undefined };

    const isCorrect =
      String(response.answer_id).trim() === String(question.correct).trim() ||
      question.answers.find((a) => String(a.id).trim() === String(response.answer_id).trim())
        ?.isCorrect;

    return {
      status: isCorrect ? "correct" : "incorrect",
      userAnswerId: response.answer_id,
      correctAnswerId: question.correct
    };
  };

  return (
    <div className="base-background animate-in fade-in fixed inset-0 z-50 flex flex-col overflow-hidden duration-200">
      {/* 1. Header Navigation */}
      <header className="base-background z-10 flex h-16 shrink-0 items-center justify-between border-b px-6 shadow-sm">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-orange-900">
            <BarChart3 className="h-6 w-6" />
            Quiz Summary
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => router.push("/dashboard")} className="button-orange gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </header>

      {/* 2. Scrollable Content Area */}
      {/* Remove double scroll by using simple overflow-y-auto instead of ScrollArea which might conflict */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="container mx-auto max-w-6xl space-y-8 p-6 pb-20">
          {/* Summary Cards (Host Only) */}
          {/* Summary Cards (Host Only) */}
          {isHost && (
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {/* Questions Card */}
              <Card className="!gap-2 border-none bg-orange-50/50 !py-2.5 shadow-sm transition-colors hover:bg-blue-50">
                <CardContent className="flex flex-col items-center justify-between gap-1.5 p-3 md:flex-row md:items-start md:gap-4">
                  <div className="order-2 flex flex-col items-center md:order-1 md:items-start">
                    <span className="text-[10px] font-semibold tracking-wider text-orange-600/70 uppercase md:text-xs">
                      Questions
                    </span>
                    <div className="mt-0.5 text-xl leading-none font-black text-slate-900 md:text-3xl">
                      {totalQuestions}
                    </div>
                  </div>
                  <div className="order-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 md:order-2 md:h-10 md:w-10">
                    <FileQuestion className="h-3.5 w-3.5 text-orange-600 md:h-5 md:w-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Answers Card */}
              <Card className="!gap-2 border-none bg-amber-50/50 !py-2.5 shadow-sm transition-colors hover:bg-amber-50">
                <CardContent className="flex flex-col items-center justify-between gap-1.5 p-3 md:flex-row md:items-start md:gap-4">
                  <div className="order-2 flex flex-col items-center md:order-1 md:items-start">
                    <span className="text-[10px] font-semibold tracking-wider text-amber-600/70 uppercase md:text-xs">
                      Answers
                    </span>
                    <div className="mt-0.5 text-xl leading-none font-black text-slate-900 md:text-3xl">
                      {totalAnswers}
                    </div>
                  </div>
                  <div className="order-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 md:order-2 md:h-10 md:w-10">
                    <MessageSquare className="h-3.5 w-3.5 text-amber-600 md:h-5 md:w-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Correct Card */}
              <Card className="!gap-2 border-none bg-green-50/50 !py-2.5 shadow-sm transition-colors hover:bg-green-50">
                <CardContent className="flex flex-col items-center justify-between gap-1.5 p-3 md:flex-row md:items-start md:gap-4">
                  <div className="order-2 flex flex-col items-center md:order-1 md:items-start">
                    <span className="text-[10px] font-semibold tracking-wider text-green-600/70 uppercase md:text-xs">
                      Correct
                    </span>
                    <div className="mt-0.5 text-xl leading-none font-black text-slate-900 md:text-3xl">
                      {totalCorrectAnswers}
                    </div>
                  </div>
                  <div className="order-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 md:order-2 md:h-10 md:w-10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 md:h-5 md:w-5" />
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
              let stats,
                myStatus:
                  | {
                      status: string;
                      userAnswerId: string | null;
                      correctAnswerId: string | undefined;
                    }
                  | undefined;
              let correctAnswerText = "";

              const correctAnswerObj = q.answers.find((a) => a.isCorrect);
              correctAnswerText = correctAnswerObj?.text || "No correct answer defined";

              if (isHost) {
                stats = getQuestionStats(q.id);
              } else {
                myStatus = getMyAnswerStatus(q.id);
              }

              return (
                <Card
                  key={q.id}
                  className="overflow-hidden border-none py-0 shadow-sm ring-1 ring-slate-200">
                  <CardContent className="p-0">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4 p-4 pb-2">
                      <div className="flex-1 space-y-2">
                        <Badge
                          variant="secondary"
                          className="rounded-md border-orange-100 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 hover:bg-orange-100">
                          Question {index + 1}
                        </Badge>
                        <h3 className="text-base leading-relaxed font-medium text-slate-800">
                          {q.question}
                        </h3>
                      </div>

                      {/* Host Badges */}
                      {isHost && stats && (
                        <div className="flex shrink-0 gap-2">
                          <Badge
                            variant="outline"
                            className="hidden h-8 gap-1.5 border-yellow-100 bg-yellow-50 px-3 text-yellow-700 sm:flex">
                            <Users className="h-3.5 w-3.5" />
                            <span>{stats.participantCount}</span>
                          </Badge>
                          <Badge
                            variant="outline"
                            className="hidden h-8 gap-1.5 border-green-100 bg-green-50 px-3 text-green-700 sm:flex">
                            <Check className="h-3.5 w-3.5" />
                            <span>{stats.correctCount}</span>
                          </Badge>
                        </div>
                      )}

                      {/* Player Badges */}
                      {!isHost && myStatus && (
                        <div className="shrink-0">
                          {myStatus.status === "correct" ? (
                            <Badge className="border-green-200 bg-green-100 px-3 py-1 text-green-700 shadow-none">
                              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Correct
                            </Badge>
                          ) : myStatus.status === "incorrect" ? (
                            <Badge
                              variant="destructive"
                              className="border-red-200 bg-red-100 px-3 py-1 text-red-700 shadow-none">
                              <XCircle className="mr-1.5 h-4 w-4" /> Incorrect
                            </Badge>
                          ) : (
                            <Badge variant="outline">Skipped</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Answer Options List */}
                    <div className="px-4 pt-2 pb-4">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {q.answers.map((ans: any, idx) => {
                          // Handle potential different property names for correctness
                          // Check if q.correct (string ID) matches ans.id OR if ans.isCorrect is strictly true
                          const isCorrect =
                            (q.correct !== undefined && String(q.correct) === String(ans.id)) ||
                            ans.isCorrect === true ||
                            ans.is_correct === true;

                          const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
                          // Handle potential different property names for the answer text
                          const answerText =
                            ans.text || ans.answer || ans.option || ans.label || "";

                          return (
                            <div
                              key={ans.id || idx}
                              className={cn(
                                "relative flex items-center gap-3 rounded-md border p-3 text-sm transition-colors",
                                isCorrect
                                  ? "border-green-200 bg-green-50 text-green-900 ring-1 ring-green-100"
                                  : "border-slate-200 bg-white text-slate-600"
                              )}>
                              <span
                                className={cn(
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold",
                                  isCorrect
                                    ? "bg-green-200 text-green-800"
                                    : "bg-slate-100 text-slate-500"
                                )}>
                                {optionLabel}
                              </span>
                              <span className="flex-1 leading-tight font-medium">{answerText}</span>

                              {isCorrect && (
                                <CheckCircle2 className="absolute right-3 h-4 w-4 text-green-600" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer: Progress / Stats */}
                    {isHost && stats && (
                      <div className="space-y-2 px-4 pt-0 pb-4">
                        <div className="text-muted-foreground flex items-center justify-between text-xs font-medium tracking-wide uppercase">
                          <span>Accuracy</span>
                          <span className="font-bold text-slate-900">{stats.percentCorrect}%</span>
                        </div>
                        <Progress
                          value={stats.percentCorrect}
                          className="h-2"
                          indicatorColor={
                            stats.percentCorrect > 75
                              ? "bg-green-500"
                              : stats.percentCorrect > 40
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }
                        />
                        <div className="text-muted-foreground flex justify-between text-[10px]">
                          <span>{stats.correctCount} correct</span>
                          <span>{stats.incorrectCount} incorrect</span>
                        </div>
                      </div>
                    )}

                    {/* For Player: Show their answer if wrong */}
                    {!isHost && myStatus?.status === "incorrect" && (
                      <div className="border-t border-red-100 bg-red-50/50 px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-red-600 uppercase">
                            <XCircle className="h-3.5 w-3.5" /> Your Answer:
                          </span>
                          <p className="mt-0.5 pl-5 font-medium text-red-700">
                            {(() => {
                              const userAns = q.answers.find(
                                (a) => String(a.id).trim() === String(myStatus?.userAnswerId).trim()
                              );
                              return userAns
                                ? userAns.text ||
                                    userAns.answer ||
                                    userAns.option ||
                                    userAns.label ||
                                    "Answer ID match but no text"
                                : "No answer";
                            })()}
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
