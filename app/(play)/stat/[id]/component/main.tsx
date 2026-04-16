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
  Percent,
  FileText,
  Download,
  CircleQuestionMark,
  User,
  Clock,
  Timer,
  Gamepad2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";

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
  const [sessionData, setSessionData] = useState<any>(null);
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
        setSessionData(session);

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

  const handleDownloadPDF = () => {
    const quizTitle = sessionData?.quiz_detail?.title || "Untitled Quiz";
    const application = sessionData?.application || "-";

    // Calculate duration
    let duration = "-";
    if (sessionData?.started_at && sessionData?.ended_at) {
      const diffMs = new Date(sessionData.ended_at).getTime() - new Date(sessionData.started_at).getTime();
      if (diffMs > 0) {
        const totalSec = Math.floor(diffMs / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        duration = `${min}:${sec.toString().padStart(2, "0")}`;
      } else {
        duration = "0:00";
      }
    }

    // Build per-question HTML
    const questionsHtml = questions.map((q, idx) => {
      const stats = getQuestionStats(q.id);
      const myStatus = getMyAnswerStatus(q.id);

      const answersHtml = q.answers.map((ans, aIdx) => {
        const isCorrect =
          (q.correct !== undefined && String(q.correct) === String(ans.id)) ||
          ans.isCorrect === true;
        const label = String.fromCharCode(65 + aIdx);
        const text = ans.text || ans.answer || ans.option || ans.label || "";

        return `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid ${isCorrect ? '#bbf7d0' : '#e2e8f0'};border-radius:6px;background:${isCorrect ? '#f0fdf4' : '#fff'};margin-bottom:6px;">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:4px;font-size:12px;font-weight:700;background:${isCorrect ? '#bbf7d0' : '#f1f5f9'};color:${isCorrect ? '#166534' : '#64748b'};flex-shrink:0;">${label}</span>
            <span style="flex:1;font-size:13px;${isCorrect ? 'font-weight:600;color:#166534;' : 'color:#475569;'}">${text}${isCorrect ? ' ✓' : ''}</span>
          </div>`;
      }).join("");

      // Stats line (for host view)
      const statsLine = isHost && stats
        ? `<div style="display:flex;align-items:center;justify-content:start;gap:10px;"> <strong style="display:inline-block;background:#fff7ed;color:#c2410c;font-size:12px;font-weight:600;padding:3px 10px;border-radius:4px;">${stats.percentCorrect}%</strong><span style="display:inline-block;background:#fff7ed;color:#c2410c;font-size:12px;font-weight:600;padding:3px 10px;border-radius:4px;">✓ ${stats.correctCount} correct</span><span style="display:inline-block;background:#fff7ed;color:#c2410c;font-size:12px;font-weight:600;padding:3px 10px;border-radius:4px;">✗ ${stats.incorrectCount} incorrect</span></div>`
        : "";

      // Player wrong answer line
      let playerLine = "";
      if (!isHost && myStatus?.status === "incorrect") {
        const userAns = q.answers.find(a => String(a.id).trim() === String(myStatus.userAnswerId).trim());
        const userText = userAns ? (userAns.text || userAns.answer || userAns.option || userAns.label || "No text") : "No answer";
        playerLine = `<div style="margin-top:8px;padding:8px 12px;background:#fef2f2;border-radius:6px;font-size:12px;color:#dc2626;">Your answer: <strong>${userText}</strong></div>`;
      } else if (!isHost && myStatus?.status === "correct") {
        playerLine = `<div style="margin-top:8px;padding:8px 12px;background:#f0fdf4;border-radius:6px;font-size:12px;color:#16a34a;">✓ You answered correctly</div>`;
      }

      return `
        <div style="page-break-inside:avoid;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:16px;overflow:hidden;">
          <div style="padding:14px 16px;border-bottom:1px solid #f1f5f9;">
          <div style="display:flex;align-items:center;justify-content:start;gap:10px;">
            <span style="display:inline-block;background:#fff7ed;color:#c2410c;font-size:12px;font-weight:600;padding:3px 10px;border-radius:4px;">Question ${idx + 1}</span>
            ${statsLine}
            </div>
            <p style="font-size:14px;font-weight:500;color:#1e293b;margin:6px 0 0 0;line-height:1.5;">${q.question}</p>
          </div>
          <div style="padding:12px 16px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
              ${answersHtml}
            </div>
            
            ${playerLine}
          </div>
        </div>`;
    }).join("");

    // Overall accuracy
    const overallAccuracy = totalAnswers > 0 ? Math.round((totalCorrectAnswers / totalAnswers) * 100) : 0;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Statistics - ${quizTitle}</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 32px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #fed7aa; }
          .header h1 { font-size: 22px; font-weight: 700; color: #c2410c; margin-bottom: 4px; }
          .header h2 { font-size: 16px; font-weight: 400; color: #64748b; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .summary-card { text-align: center; padding: 14px 8px; border-radius: 10px; border: 1px solid #f1f5f9; }
          .summary-card .value { font-size: 22px; font-weight: 800; color: #0f172a; }
          .summary-card .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
          .section-title { font-size: 15px; font-weight: 700; color: #c2410c; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #fed7aa; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${quizTitle}</h1>
        </div>

        <div class="summary">
          <div class="summary-card" style="background:#fff7ed;">
            <div class="value" style="color:#c2410c;">${totalQuestions}</div>
            <div class="label" style="color:#ea580c;">Questions</div>
          </div>
           <div class="summary-card" style="background:#eff6ff;">
            <div class="value" style="color:#2563eb;">${players.length}</div>
            <div class="label" style="color:#2563eb;">Players</div>
          </div>
          <div class="summary-card" style="background:#f0fdf4;">
            <div class="value" style="color:#16a34a;">${duration}</div>
            <div class="label" style="color:#16a34a;">Duration</div>
          </div>
          <div class="summary-card" style="background:#faf5ff;">
            <div class="value" style="color:#9333ea;">${application}</div>
            <div class="label" style="color:#9333ea;">Application</div>
          </div>
        </div>

        ${questionsHtml}

        <div class="footer">
          Generated from GameForSmart &bull; ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      // Wait for content to render before triggering print
      printWindow.onload = () => {
        printWindow.print();
      };
      // Fallback for browsers where onload may not fire
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      toast.error("Please allow pop-ups to download PDF");
    }
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
          <Button variant="outline" className="gap-2 bg-orange-300 text-white" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />
            <p>Download PDF</p>
          </Button>
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
          <Card className="border-none bg-gray-50 shadow-md transition-colors hover:bg-gray-100">
            <CardContent className="space-y-2">
              <div>
                <h2 className="text-2xl font-bold">
                  {sessionData?.quiz_detail?.title || "Untitled Quiz"}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div title="questions" className="flex items-center gap-1">
                  <CircleQuestionMark size={16} />
                  <p>{totalQuestions}</p>
                </div>
                <div title="players" className="flex items-center gap-1">
                  <User size={16} />
                  <p>{players.length}</p>
                </div>
                <div title="durations" className="flex items-center gap-1">
                  <Timer size={16} />
                  <p>
                    {(() => {
                      if (!sessionData?.started_at || !sessionData?.ended_at) return "-";
                      const diffMs = new Date(sessionData.ended_at).getTime() - new Date(sessionData.started_at).getTime();
                      if (diffMs <= 0) return "0:00";
                      const totalSeconds = Math.floor(diffMs / 1000);
                      const minutes = Math.floor(totalSeconds / 60);
                      const seconds = totalSeconds % 60;
                      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
                    })()}
                  </p>
                </div>
                <div title="Application" className="flex items-center gap-1">
                  <Gamepad2 size={16} />
                  <p>{sessionData?.application || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                                <span className="flex items-center gap-1">
                                  <Percent size={12} /> {stats.percentCorrect}
                                </span>
                              </Badge>
                              <Badge
                                title="correct"
                                variant="secondary"
                                className="rounded-md border-orange-100 bg-green-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-green-700">
                                <span className="flex items-center gap-1">
                                  <CircleCheck size={12} /> {stats.correctCount}
                                </span>
                              </Badge>
                              <Badge
                                title="incorrect"
                                variant="secondary"
                                className="rounded-md border-orange-100 bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700">
                                <span className="flex items-center gap-1">
                                  <CircleX size={12} /> {stats.incorrectCount}
                                </span>
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
                        {isHost && stats && (
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
                                stats.percentCorrect == 100
                                  ? "bg-green-500"
                                  : stats.percentCorrect >= 67
                                    ? "bg-yellow-500"
                                    : stats.percentCorrect >= 34
                                      ? "bg-orange-600"
                                      : "bg-red-600"
                              }
                            />
                            {/* <div className="text-muted-foreground flex justify-between text-[10px]">
                              <span>{stats.correctCount} correct</span>
                              <span>{stats.incorrectCount} incorrect</span>
                            </div> */}
                          </div>
                        )}

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
