"use client";

// ============================================================
// play/_hooks/useLearnPlay.ts
// State + business logic untuk halaman play tryout.
// Semua Supabase I/O lewat learnService.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { generateXID } from "@/lib/id-generator";
import {
  fetchProfileId,
  fetchLearnSession,
  startSession,
  saveAnswerToSession,
  finishSession,
} from "../../../services/learnService";
import type { Question, LearnResponse, LearnSessionWithQuiz } from "../../../types";

export function useLearnPlay(sessionId: string) {
  const { user } = useAuth();
  const router   = useRouter();

  // ── UI state ────────────────────────────────────────────────
  const [loading,                  setLoading]                  = useState(true);
  const [authLoading,              setAuthLoading]              = useState(true);
  const [isSubmitting,             setIsSubmitting]             = useState(false);
  const [showFinishConfirmation,   setShowFinishConfirmation]   = useState(false);
  const [hasShownCompletionDialog, setHasShownCompletionDialog] = useState(false);
  const [timeLeft,                 setTimeLeft]                 = useState(0);
  const [currentQuestionIndex,     setCurrentQuestionIndex]     = useState(0);
  const [selectedAnswer,           setSelectedAnswer]           = useState<string | null>(null);

  // ── Data state ───────────────────────────────────────────────
  const [learnSession, setLearnSession] = useState<LearnSessionWithQuiz | null>(null);
  const [questions,    setQuestions]    = useState<Question[]>([]);
  const [responses,    setResponses]    = useState<Map<string, LearnResponse>>(new Map());
  const [profileId,    setProfileId]    = useState<string | null>(null);

  // ── Tracker for cumulative timing ───────────────────────────
  const [activeQuestionTracker, setActiveQuestionTracker] = useState<{
    questionId: string | null;
    startedAt:  Date | null;
  }>({ questionId: null, startedAt: null });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Auth init ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthLoading(false);
      if (!user) { router.push("/login"); return; }
      loadData();
    }, 2000);

    if (user) {
      clearTimeout(timer);
      setAuthLoading(false);
      loadData();
    }

    return () => clearTimeout(timer);
  }, [user, sessionId]);

  // ── Countdown timer ──────────────────────────────────────────
  useEffect(() => {
    if (learnSession?.status === "active" && learnSession.started_at) {
      if (timerRef.current) clearInterval(timerRef.current);

      const tick = () => {
        const now       = Date.now();
        const startMs   = new Date(learnSession.started_at!).getTime();
        const totalMs   = learnSession.total_time_minutes * 60 * 1000;
        const remaining = Math.max(0, startMs + totalMs - now);
        setTimeLeft(Math.ceil(remaining / 1000));
        if (remaining <= 0) handleFinishLearn();
      };

      tick();
      timerRef.current = setInterval(tick, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [learnSession]);

  // ── Auto show completion dialog ──────────────────────────────
  useEffect(() => {
    if (questions.length === 0) return;
    const answered = Array.from(responses.values()).filter(
      (r) => r.answer_id && r.answer_id.trim() !== ""
    ).length;
    if (answered === questions.length && !hasShownCompletionDialog) {
      setHasShownCompletionDialog(true);
      setShowFinishConfirmation(true);
    }
  }, [responses, questions.length, hasShownCompletionDialog]);

  // ── Track question visit time ────────────────────────────────
  useEffect(() => {
    if (questions.length === 0) return;
    const q = questions[currentQuestionIndex];
    const now = new Date();
    setActiveQuestionTracker({ questionId: q.id, startedAt: now });
  }, [currentQuestionIndex, questions]);

  // ── Load data ────────────────────────────────────────────────
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const pid     = await fetchProfileId(user.id);
      setProfileId(pid);

      const session = await fetchLearnSession(sessionId, pid);
      setLearnSession(session);

      // Transform JSONB questions
      const raw: any[] = Array.isArray(session.questions)
        ? session.questions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        : [];

      const transformed: Question[] = raw.map((q: any) => ({
        id:           q.id,
        question_text: q.question_text || q.question || "",
        time_limit:   q.time_limit || 20,
        order_index:  q.order_index || 0,
        image_url:    q.image_url || q.image || null,
        answers: Array.isArray(q.answers)
          ? q.answers.map((a: any, i: number) => ({
              id:           a.id !== undefined ? a.id : i.toString(),
              answer_text:  a.answer_text || a.answer || "",
              is_correct:   a.is_correct ?? (q.correct === a.id || q.correct === i.toString()),
              color:        a.color || "#e74c3c",
              order_index:  a.order_index ?? i,
              image_url:    a.image_url || a.image || null,
            }))
          : [],
      }));

      setQuestions(transformed);

      // Restore existing responses
      const existing = session.responses?.answers ?? [];
      if (existing.length > 0) {
        const map = new Map<string, LearnResponse>();
        existing.forEach((r: any) => map.set(r.question_id, r));
        setResponses(map);
        if (transformed[0]) setSelectedAnswer(map.get(transformed[0].id)?.answer_id ?? null);
      }

      // Activate session if waiting
      if (session.status === "waiting") {
        await startSession(sessionId);
        setLearnSession((prev) =>
          prev ? { ...prev, status: "active", started_at: new Date().toISOString() } : null
        );
      }
    } catch (error: any) {
      console.error("[useLearnPlay] loadData:", error);
      toast.error("Learning session not found");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ── Answer selection ─────────────────────────────────────────
  const selectAnswer = async (answerId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSelectedAnswer(answerId);

    const question   = questions[currentQuestionIndex];
    const isNewAnswer = !responses.get(question.id)?.answer_id;

    // Optimistic update
    const now = new Date();
    setResponses((prev) => new Map(prev.set(question.id, {
      id:          generateXID(),
      session_id:  sessionId,
      question_id: question.id,
      answer_id:   answerId,
      is_correct:  question.answers.find((a) => a.id === answerId)?.is_correct ?? false,
      points:      0,
      started_at:  activeQuestionTracker.startedAt?.toISOString() ?? now.toISOString(),
      ended_at:    null,
    })));

    // Navigate after short delay
    setTimeout(() => {
      setIsSubmitting(false);
      _navigateAfterAnswer(question.id, answerId, isNewAnswer);
    }, 300);

    // Background save
    saveAnswerToSession(sessionId, question.id, answerId).catch(console.error);
  };

  const _navigateAfterAnswer = (
    questionId: string,
    answerId: string,
    isNewAnswer: boolean
  ) => {
    const tempMap = new Map(responses);
    tempMap.set(questionId, {
      id: "temp", session_id: sessionId, question_id: questionId,
      answer_id: answerId, is_correct: false, points: 0, started_at: null, ended_at: null,
    });

    const answeredCount = Array.from(tempMap.values()).filter(
      (r) => r.answer_id && r.answer_id.trim() !== ""
    ).length;
    const allDone = answeredCount >= questions.length;

    if (allDone) {
      // Sequential / wrap-around in review mode
      const next = currentQuestionIndex + 1 < questions.length
        ? currentQuestionIndex + 1
        : 0;
      handleQuestionNavigation(next);
    } else if (isNewAnswer) {
      // Smart: jump to next unanswered
      const unanswered = questions
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => {
          const r = tempMap.get(q.id);
          return !r || !r.answer_id || r.answer_id.trim() === "";
        });

      const next = unanswered.find(({ i }) => i > currentQuestionIndex)
        ?? unanswered[0];
      if (next) handleQuestionNavigation(next.i);
    } else {
      if (currentQuestionIndex < questions.length - 1) {
        handleQuestionNavigation(currentQuestionIndex + 1);
      }
    }
  };

  // ── Navigation ───────────────────────────────────────────────
  const handleQuestionNavigation = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= questions.length || targetIndex === currentQuestionIndex) return;

    const target = questions[targetIndex];
    const existing = responses.get(target.id);

    setCurrentQuestionIndex(targetIndex);
    setSelectedAnswer(existing?.answer_id ?? null);
    setActiveQuestionTracker({ questionId: target.id, startedAt: new Date() });
    setIsSubmitting(false);
  };

  const handleNextQuestion     = () => handleQuestionNavigation(currentQuestionIndex + 1);
  const handlePreviousQuestion = () => handleQuestionNavigation(currentQuestionIndex - 1);

  // ── Finish ───────────────────────────────────────────────────
  const handleFinishLearn = async () => {
    try {
      await finishSession(sessionId, questions);
      toast.success("Tryout completed!");
      router.push(`/tryout/result/${sessionId}`);
    } catch (error) {
      console.error("[useLearnPlay] finish:", error);
      toast.error("Failed to complete learning session");
    }
  };

  // ── Derived values ───────────────────────────────────────────
  const answeredCount = Array.from(responses.values()).filter(
    (r) => r.answer_id && r.answer_id.trim() !== ""
  ).length;
  const progress             = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const allQuestionsAnswered = answeredCount === questions.length && questions.length > 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return {
    // state
    loading, authLoading, isSubmitting,
    learnSession, questions, responses,
    currentQuestionIndex, selectedAnswer,
    timeLeft, progress, answeredCount, allQuestionsAnswered,
    showFinishConfirmation, setShowFinishConfirmation,
    // actions
    selectAnswer,
    handleNextQuestion,
    handlePreviousQuestion,
    handleQuestionNavigation,
    handleFinishLearn,
    formatTime,
  };
}