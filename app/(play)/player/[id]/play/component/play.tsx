"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { Flag, Timer, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  getGameSessionRT,
  subscribeToGameRT,
  unsubscribeFromGameRT,
  updateParticipantResponseRT,
  updateParticipantStartRT,
  getParticipantsRT,
  isRealtimeDbConfigured,
  GameSessionRT,
  supabaseRealtime
} from "@/lib/supabase-realtime";
import { supabase } from "@/lib/supabase";
// Import hook from host component (adjust path as needed)
import { useGameTimer } from "@/app/(play)/host/[id]/play/component/game-timer";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  type?: string;
  image?: string | null;
  answers?: { id: string; answer: string; image: string | null }[];
  options?: { id: string; text: string; key: string }[];
  [key: string]: any; // Allow dynamic access for fallbacks
}

interface PlayProps {
  sessionId: string;
}

export default function Play({ sessionId }: PlayProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const participantId = searchParams.get("participant");
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

  const [session, setSession] = useState<GameSessionRT | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // State for responses: QuestionID -> AnswerID
  const [responses, setResponses] = useState<Record<string, string>>({});
  // State for flagged questions: Set of QuestionIDs
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

  // Timer Hook
  const { timeLeft } = useGameTimer({
    startedAt: session?.started_at ?? null,
    totalTimeMinutes: session?.total_time_minutes ?? 0,
    status: session?.status ?? "waiting",
    onTimeUp: () => {
      // Auto submit or redirect handled by session status change
      toast.info("Time is up!");
    }
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 1. Initial Load
  useEffect(() => {
    const init = async () => {
      if (!participantId) return; // Wait until resolved

      // Load Questions from LocalStorage
      const storedData = localStorage.getItem(`player_game_data_${sessionId}`);
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          if (parsed.questions && Array.isArray(parsed.questions)) {
            setQuestions(parsed.questions);
          }
        } catch (e) {
          console.error("Failed to parse stored questions", e);
        }
      } else {
        toast.error("No questions found. Please try rejoining.");
      }

      // Load Session
      const sess = await getGameSessionRT(sessionId);
      if (sess) {
        setSession(sess);
        if (sess.status === "finished") {
          router.push(`/result/${sessionId}`);
        }
      } else {
        toast.error("Session not found");
      }

      setLoading(false);

      // Update started_at for participant
      await updateParticipantStartRT(participantId);
    };

    init();

    // Subscribe to Session Changes
    const channel = subscribeToGameRT(sessionId, {
      onSessionChange: (updated) => {
        setSession((prev) => (prev ? { ...prev, ...updated } : null));
        if (updated.status === "finished") {
          router.push(`/result/${sessionId}`);
        }
      }
    });

    return () => {
      unsubscribeFromGameRT(channel);
    };
  }, [sessionId, participantId, router]);

  // Navigation Handlers
  const handleNext = () => {
    if (isLastQuestion) {
      if (allAnswered) {
        setSubmitDialogOpen(true);
      } else {
        // Cycle back to first or just stay?
        // User requirement: "untuk tombol next di soal terakhir akan mengarahkan ke soal nomer satu kalau semua soal belum dijawab"
        setCurrentQuestionIndex(0);
      }
    } else {
      setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
    }
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleJumpTo = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleFlag = () => {
    const qId = currentQuestion.id;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Answering Logic
  const handleAnswer = async (answerId: string) => {
    if (!participantId || !currentQuestion) return;

    const qId = currentQuestion.id;

    // Optimistic Update
    setResponses((prev) => ({ ...prev, [qId]: answerId }));

    // Send to RT
    // Note: We don't await this to block UI, but errors are logged
    updateParticipantResponseRT(sessionId, participantId, qId, answerId);

    // Auto Navigation Logic
    // 1. If not all answered, go to next UNANSWERED question
    // 2. If all answered, go to next sequential question (unless last)

    // Check if this was the last unanswered question?
    // We need state *after* this answer.
    const updatedResponses = { ...responses, [qId]: answerId };
    const answeredCount = Object.keys(updatedResponses).length;
    const isAllAnsweredNow = answeredCount === questions.length;

    if (isAllAnsweredNow) {
      // REQUIREMENT: "muncul dialog submitnya ... semisal semua soal sudah dijawab ... ketika menjawab soal nomer 3"
      // If this answer completes the quiz, show dialog immediately regardless of index.
      // CHECK: But only if it hasn't popped up automatically before.
      if (!hasAutoSubmitted) {
        setSubmitDialogOpen(true);
        setHasAutoSubmitted(true);
      }
    } else {
      // Find next unanswered
      // Search from current + 1 to end, then 0 to current.
      let nextUnansweredIndex = -1;
      // Forward search
      for (let i = currentQuestionIndex + 1; i < questions.length; i++) {
        if (!updatedResponses[questions[i].id]) {
          nextUnansweredIndex = i;
          break;
        }
      }

      // Wrap around search (from 0 to current)
      if (nextUnansweredIndex === -1) {
        for (let i = 0; i < currentQuestionIndex; i++) {
          if (!updatedResponses[questions[i].id]) {
            nextUnansweredIndex = i;
            break;
          }
        }
      }

      if (nextUnansweredIndex !== -1) {
        setCurrentQuestionIndex(nextUnansweredIndex);
      }
    }
  };

  const handleSubmit = async () => {
    // Call Edge Function 'submit-game' with action 'submit'
    try {
      if (!supabaseRealtime) throw new Error("Realtime client not initialized");

      setLoading(true); // Show loading state briefly
      const { data, error } = await supabaseRealtime.functions.invoke("submit-game", {
        body: {
          action: "submit",
          sessionId,
          participantId
        }
      });

      if (error) throw error;

      // Handle response - logic handled by RT subscription for redirect usually,
      // but 'submit' might return status immediately if we need to redirect explicitly?
      // Edge function implementation returns: { status: "active" | "finished", mode: ... }

      // If wait_timer mode and active, we might wait on specific waiting screen or result screen?
      // Requirement: "Jika game_end_mode = wait_timer ... Jika belum semua selesai ... session tetap active ... Player diarahkan ke halaman result."
      // So regardless of status, player goes to result page (which acts as waiting room for results if session not finished).

      router.push(`/result/${sessionId}`);
    } catch (err: any) {
      console.error("Submit Error:", err);
      toast.error("Failed to submit: " + err.message);
      setLoading(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rose-50">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.keys(responses).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const currentQAnswer = currentQuestion ? responses[currentQuestion.id] : undefined;

  // Calculate Progress
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen w-full bg-rose-50">
      <div className="relative flex h-auto w-full flex-col items-center md:h-16 md:flex-row">
        {/* ===== BARIS 1 (Mobile) / KIRI (Desktop) ===== */}
        <div className="flex w-full items-center justify-between px-2 py-2 md:flex-1 md:justify-start md:py-0">
          <Image
            src="/gameforsmartlogo.png"
            width={200}
            height={40}
            alt="gameforsmart"
            className="opacity-80 dark:opacity-100"
            unoptimized
          />

          {/* End Session (Mobile only) - REPURPOSED AS TIMER BADGE PER REQUEST */}
          <div className="flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 font-semibold text-purple-700 shadow-sm md:hidden">
            <Timer className="h-4 w-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* ===== STATISTIK (Baris 2 Mobile / Tengah Desktop) ===== */}
        <div className="flex w-full flex-col items-center justify-center gap-2 px-6 py-2 md:flex-1 md:py-0">
          <div className="flex w-full items-center justify-between text-sm font-medium text-slate-600">
            <p>Progress</p>
            <p>
              {answeredCount}/{questions.length}
            </p>
          </div>
          <Progress indicatorColor="bg-blue-500" value={progressPercent} className="h-2 w-full" />
        </div>

        {/* ===== KANAN DESKTOP ===== */}
        <div className="hidden items-center justify-end px-2 md:flex md:flex-1">
          <div className="flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 font-semibold text-purple-700 shadow-sm">
            <Timer className="h-4 w-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_320px]">
        {/* KIRI: Soal + Jawaban */}
        <div className="order-1 flex flex-col space-y-4 overflow-y-auto p-4 pb-24 lg:pb-4">
          {/* Soal */}
          {currentQuestion && (
            <>
              <Card className="border-none py-4 shadow-sm">
                <CardContent className="bg-surface-light dark:bg-surface-dark rounded-lg px-4">
                  <div className="flex items-center justify-between">
                    <h1 className="mb-2 text-xl font-semibold text-slate-800">
                      Question {currentQuestionIndex + 1}
                    </h1>
                    <Button
                      variant={flagged.has(currentQuestion.id) ? "secondary" : "outline"}
                      className={
                        flagged.has(currentQuestion.id)
                          ? "border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200"
                          : ""
                      }
                      onClick={handleFlag}>
                      <Flag
                        className={cn(
                          "mr-2 h-4 w-4",
                          flagged.has(currentQuestion.id) && "fill-current"
                        )}
                      />
                      {flagged.has(currentQuestion.id) ? "Flagged" : "Flag"}
                    </Button>
                  </div>
                  <div className="mt-4 text-lg">{currentQuestion.question}</div>
                </CardContent>
              </Card>

              {/* Pilihan Jawaban */}
              <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(() => {
                  let displayOptions: any[] = [];

                  // Priority 1: 'answers' array (from user structure)
                  if (
                    Array.isArray(currentQuestion.answers) &&
                    currentQuestion.answers.length > 0
                  ) {
                    displayOptions = currentQuestion.answers.map((a) => ({
                      id: a.id,
                      text: a.answer,
                      key: a.id
                    }));
                  }
                  // Priority 2: 'options' array (legacy)
                  else if (
                    Array.isArray(currentQuestion.options) &&
                    currentQuestion.options.length > 0
                  ) {
                    displayOptions = currentQuestion.options;
                  }
                  // Priority 3: Flat option_x keys (legacy)
                  else {
                    const keys = ["a", "b", "c", "d", "e"];
                    keys.forEach((key) => {
                      const text = (currentQuestion as any)[`option_${key}`];
                      if (text) {
                        displayOptions.push({
                          id: key,
                          text: text,
                          key: key
                        });
                      }
                    });
                  }

                  return displayOptions.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => handleAnswer(item.id)}
                      className={cn(
                        "cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md active:scale-[0.98]",
                        currentQAnswer === item.id
                          ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-200"
                          : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50"
                      )}>
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                            currentQAnswer === item.id
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                          )}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="pt-1">{item.text || item.key}</div>
                      </div>
                    </div>
                  ));
                })()}
              </section>
            </>
          )}

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}>
              Previous
            </Button>

            {isLastQuestion && allAnswered ? (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setSubmitDialogOpen(true)}>
                Submit Quiz
              </Button>
            ) : (
              <Button variant="outline" onClick={handleNext}>
                {isLastQuestion ? "First Question" : "Next"}
              </Button>
            )}

            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Quiz?</DialogTitle>
                  <DialogDescription>
                    You have answered all {questions.length} questions. Are you sure you want to
                    submit?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Review</Button>
                  </DialogClose>
                  <Button onClick={handleSubmit}>Yes, Submit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KANAN / BAWAH: Nav Soal */}
        <aside className="order-2 p-4 lg:order-2 lg:pl-0">
          <Card className="border-none py-4 shadow-sm">
            <CardContent className="sticky bottom-0 px-4 lg:top-0">
              <p className="mb-3 font-semibold text-slate-700">Question Navigation</p>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(44px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(48px,1fr))] lg:grid-cols-5">
                {questions.map((q, i) => {
                  // Determine status color
                  const isCurrent = currentQuestionIndex === i;
                  const isAnswered = !!responses[q.id];
                  const isFlagged = flagged.has(q.id);

                  let bgClass = "bg-white hover:bg-slate-50 border-slate-200 text-slate-700";
                  if (isCurrent)
                    bgClass =
                      "bg-blue-100 border-blue-500 text-blue-700 font-bold ring-2 ring-blue-200";
                  else if (isFlagged) bgClass = "bg-amber-100 border-amber-500 text-amber-700";
                  else if (isAnswered) bgClass = "bg-green-100 border-green-500 text-green-700";

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleJumpTo(i)}
                      className={cn(
                        "flex aspect-square cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition",
                        bgClass
                      )}>
                      {i + 1}
                      {isFlagged && (
                        <div className="absolute top-0 right-0 -mt-1 -mr-1 h-2 w-2 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                <div className="flex items-center gap-3 text-sm">
                  <div className="size-4 rounded-sm border border-blue-500 bg-blue-100"></div>
                  <span className="text-slate-600 dark:text-slate-400">Current Question</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="size-4 rounded-sm border border-green-500 bg-green-100"></div>
                  <span className="text-slate-600 dark:text-slate-400">Answered</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="size-4 rounded-sm border border-amber-500 bg-amber-100"></div>
                  <span className="text-slate-600 dark:text-slate-400">Flagged</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="size-4 rounded-sm border border-slate-200 bg-white"></div>
                  <span className="text-slate-600 dark:text-slate-400">Not Answered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
