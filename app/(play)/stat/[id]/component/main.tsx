"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  BarChart3,
  Users,
  Check,
  FileQuestion,
  MessageSquare,
  Loader2,
  ChevronUp,
  ChevronDown,
  CircleCheck,
  CircleX,
  Percent
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface Question {
  id: string;
  question: string;
  correct?: string;
  image?: string | null;
  answers: {
    id: string;
    text?: string;
    answer?: string;
    option?: string;
    label?: string;
    image?: string | null;
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

export default function StatisticsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [players, setPlayers] = useState<PlayerWithResponses[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | undefined>();
  const [isCollapsedAll, setIsCollapsedAll] = useState(false);
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});

  const toggleCollapseAll = () => {
    const newState = !isCollapsedAll;
    setIsCollapsedAll(newState);
    const newCollapsedItems: Record<string, boolean> = {};
    questions.forEach((q) => {
      newCollapsedItems[q.id] = newState;
    });
    setCollapsedItems(newCollapsedItems);
  };

  const toggleCollapse = (id: string, currentState: boolean) => {
    setCollapsedItems((prev) => ({ ...prev, [id]: !currentState }));
  };

  useEffect(() => {
    async function fetchData() {
      let isRedirecting = false;
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser();

        let profileId: string | null = null;
        let userRole: string | null = null;

        // if (!user) {
        //   router.push("/login?redirect=/stat/" + id);
        //   return;
        // }

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, role")
            .eq("auth_user_id", user.id)
            .single();
          profileId = profile?.id || null;
          userRole = profile?.role || null;
        }

        const localUserId = localStorage.getItem("user_id");

        if (!profileId) {
          profileId = localUserId;
        }

        const { data: session, error: sessionError } = await supabase
          .from("game_sessions")
          .select(`*, quizzes (questions)`)
          .eq("id", id)
          .single();

        if (sessionError || !session) {
          toast.error("Session not found");
          isRedirecting = true;
          router.replace("/dashboard");
          return;
        }

        const hostCheck = 
          profileId === session.host_id || 
          userRole === "admin" || 
          (localUserId && localUserId === session.host_id);
          
        setIsHost(!!hostCheck);

        const quiz = Array.isArray(session.quizzes) ? session.quizzes[0] : session.quizzes;
        const fullQuestions = quiz?.questions || [];

        // Use current_questions if available (most accurate source of truth for session),
        // otherwise fallback to full source list
        let activeQuestions =
          session.current_questions && session.current_questions.length > 0
            ? session.current_questions
            : fullQuestions;

        // Apply question limit explicitly
        const questionLimit = parseInt(session.question_limit);
        if (!isNaN(questionLimit) && questionLimit > 0 && questionLimit < activeQuestions.length) {
          activeQuestions = activeQuestions.slice(0, questionLimit);
        }

        setQuestions(activeQuestions);

        const participants = (session.participants as any[]) || [];
        const allSessionResponses = (session.responses as any[]) || [];

        const mappedPlayers: PlayerWithResponses[] = participants.map((p) => {
          const matchedResponseGroup = allSessionResponses.find(
            (r) => r.participant === p.id || r.user_id === p.user_id
          );
          const separateResponses = matchedResponseGroup?.answers || [];
          const embeddedResponses = Array.isArray(p.responses) ? p.responses : [];
          const responses = separateResponses.length > 0 ? separateResponses : embeddedResponses;

          return {
            id: p.user_id || p.id,
            name: p.nickname || "Unknown",
            responses: responses
          };
        });

        setPlayers(mappedPlayers);

        if (profileId || localUserId) {
          const me = mappedPlayers.find(
            (p) => p.id === profileId || (localUserId && p.id === localUserId)
          );
          
          if (me) {
            setCurrentPlayerId(me.id);
          } else if (!hostCheck) {
            toast.error("You are not part of this session.");
            isRedirecting = true;
            router.replace("/dashboard");
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        if (!isRedirecting) {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

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
    <div className="base-background animate-in fade-in flex min-h-screen flex-col duration-200">
      {/* 1. Header Navigation */}
      <header className="container mx-auto flex h-16 max-w-6xl shrink-0 items-center justify-between px-6">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-orange-900">
            <BarChart3 className="h-6 w-6" />
            Statistics
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={toggleCollapseAll} className="gap-2">
            {isCollapsedAll ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
            {isCollapsedAll ? "Expand" : "Collapse"}
          </Button>
          {/* <Button variant="outline" onClick={() => router.push(`/result/${id}`)} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Result
          </Button> */}
        </div>
      </header>

      {/* 2. Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="container mx-auto max-w-6xl space-y-4 p-6 pt-0 pb-20">
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

          {/* 4. Question Cards List */}
          <div className="space-y-4">
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

              const isCollapsed = collapsedItems[q.id] ?? false;

              return (
                <Card
                  key={q.id}
                  className="overflow-hidden border-none py-0 shadow-sm ring-1 ring-slate-200">
                  <CardContent className="p-0">
                    {/* Header Row */}
                    <div className="flex flex-col items-start justify-between gap-2 p-4">
                      <div
                        className="flex w-full cursor-pointer items-center justify-between gap-4"
                        onClick={() => toggleCollapse(q.id, isCollapsed)}>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="rounded-md border-orange-100 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 hover:bg-orange-100">
                            Question {index + 1}
                          </Badge>
                          {isHost && stats && (
                            <>
                              <Badge
                              title="precentage correct"
                                variant="secondary"
                                className="rounded-md border-orange-100 bg-yellow-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-yellow-700">
                                <span className="flex items-center gap-1"><Percent size={12}/> {stats.percentCorrect}</span>
                              </Badge>
                              <Badge
                              title="correct"
                                variant="secondary"
                                className="rounded-md border-orange-100 bg-green-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-green-700">
                                <span className="flex items-center gap-1"><CircleCheck size={12}/> {stats.correctCount}</span> 
                              </Badge>
                              <Badge
                              title="incorrect"
                                variant="secondary"
                                className="rounded-md border-orange-100 bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700">
                                <span className="flex items-center gap-1"><CircleX size={12}/> {stats.incorrectCount}</span>
                              </Badge>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Host Badges */}
                          {/* {isHost && stats && (
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
                          )} */}

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

                          <Button
                            variant="ghost"
                            onClick={() => toggleCollapse(q.id, isCollapsed)}
                            className="gap-2">
                            {isCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <>
                          <h3 className="text-base leading-relaxed font-medium text-slate-800">
                            {q.question}
                          </h3>
                          {/* Question Image */}
                          {q.image && (
                            <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                              <img
                                src={q.image}
                                alt={`Question ${index + 1}`}
                                className="max-h-52 w-full bg-slate-50 object-contain"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {!isCollapsed && (
                      <>
                        {/* Answer Options List */}
                        <div className="px-4 pt-0 pb-4">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {q.answers.map((ans: any, idx) => {
                              const isCorrect =
                                (q.correct !== undefined && String(q.correct) === String(ans.id)) ||
                                ans.isCorrect === true ||
                                ans.is_correct === true;

                              const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
                              const answerText =
                                ans.text || ans.answer || ans.option || ans.label || "";

                              return (
                                <div
                                  key={ans.id || idx}
                                  className={cn(
                                    "relative rounded-md border p-3 text-sm transition-colors",
                                    isCorrect
                                      ? "border-green-200 bg-green-50 text-green-900 ring-1 ring-green-100"
                                      : "border-slate-200 bg-white text-slate-600"
                                  )}>
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={cn(
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold",
                                        isCorrect
                                          ? "bg-green-200 text-green-800"
                                          : "bg-slate-100 text-slate-500"
                                      )}>
                                      {optionLabel}
                                    </span>
                                    <span className="flex-1 leading-tight font-medium">
                                      {answerText}
                                    </span>

                                    {isCorrect && (
                                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                                    )}
                                  </div>
                                  {/* Answer Image */}
                                  {ans.image && (
                                    <div className="mt-2 ml-9 overflow-hidden rounded-md border border-slate-200">
                                      <img
                                        src={ans.image}
                                        alt={`Answer ${optionLabel}`}
                                        className="max-h-32 w-full bg-slate-50 object-contain"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Footer: Progress / Stats */}
                        {/* {isHost && stats && (
                          <div className="space-y-2 px-4 pt-0 pb-4">
                            <div className="text-muted-foreground flex items-center justify-between text-xs font-medium tracking-wide uppercase">
                              <span>Accuracy</span>
                              <span className="font-bold text-slate-900">
                                {stats.percentCorrect}%
                              </span>
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
                        )} */}

                        {/* For Player: Show their answer if wrong */}
                        {!isHost && myStatus?.status === "incorrect" && (
                          <div className="border-t border-red-100 bg-red-50/50 px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-red-600 uppercase">
                                <XCircle className="h-3.5 w-3.5" /> Your Answer:
                              </span>
                              <div className="mt-0.5 pl-5 font-medium text-red-700">
                                {(() => {
                                  const userAns = q.answers.find(
                                    (a) =>
                                      String(a.id).trim() === String(myStatus?.userAnswerId).trim()
                                  );

                                  if (!userAns) return "No answer";

                                  if (
                                    userAns.text ||
                                    userAns.answer ||
                                    userAns.option ||
                                    userAns.label
                                  ) {
                                    return (
                                      userAns.text ||
                                      userAns.answer ||
                                      userAns.option ||
                                      userAns.label
                                    );
                                  }

                                  if (userAns.image) {
                                    return (
                                      <div className="mt-2 ml-9 overflow-hidden rounded-md border border-slate-200">
                                        <img
                                          src={userAns.image}
                                          alt={`Answer ${userAns.text}`}
                                          className="max-h-32 w-full bg-slate-50 object-contain"
                                        />
                                      </div>
                                    );
                                  }

                                  return "Answer ID match but no text";
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
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
