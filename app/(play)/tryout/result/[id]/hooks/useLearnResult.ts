"use client";

// ============================================================
// result/_hooks/useLearnResult.ts
// State + business logic untuk halaman result tryout.
// Semua Supabase I/O lewat learnService.
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  fetchProfileId,
  fetchSessionResults,
  updateSessionScore,
  createRetakeSession,
} from "../../../services/learnService";
import type {
  LearnSessionWithQuiz,
  QuestionDetail,
  LearnStats,
} from "../../../types";

export function useLearnResult(sessionId: string) {
  const { user } = useAuth();
  const router   = useRouter();

  // ── UI state ────────────────────────────────────────────────
  const [loading,     setLoading]     = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // ── Data state ───────────────────────────────────────────────
  const [learnSession,    setLearnSession]    = useState<LearnSessionWithQuiz | null>(null);
  const [learnStats,      setLearnStats]      = useState<LearnStats | null>(null);
  const [questionDetails, setQuestionDetails] = useState<QuestionDetail[]>([]);

  // ── Auth init ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthLoading(false);
      if (!user) { router.push("/login"); return; }
      init();
    }, 2000);

    if (user) {
      clearTimeout(timer);
      setAuthLoading(false);
      init();
    }

    return () => clearTimeout(timer);
  }, [user, sessionId]);

  const init = async () => {
    if (!user) return;
    try {
      const pid     = await fetchProfileId(user.id);
      await loadResults(pid);
    } catch (err: any) {
      console.error("[useLearnResult] init:", err);
      setError("Profile not found");
      setLoading(false);
    }
  };

  // ── Load & process results ───────────────────────────────────
  const loadResults = async (profileId: string) => {
    try {
      const session = await fetchSessionResults(sessionId, profileId);
      setLearnSession(session);

      const sessionResponses = session.responses ?? { answers: [], point: 0 };
      const responsesArray   = Array.isArray(sessionResponses.answers)
        ? sessionResponses.answers : [];
      const questionsArray   = Array.isArray(session.questions)
        ? session.questions : [];

      const totalQuestions     = responsesArray.length;
      const pointsPerQuestion  = totalQuestions > 0 ? 100 / totalQuestions : 0;

      // Process each response into QuestionDetail
      const processedDetails: QuestionDetail[] = responsesArray.map((response: any) => {
        const rawQ = questionsArray.find((q: any) => q.id === response.question_id);

        const question = rawQ ? {
          id:           rawQ.id,
          question_text: rawQ.question_text || rawQ.question || "",
          image_url:    rawQ.image_url || rawQ.image || null,
          points:       rawQ.points || 1000,
          answers: Array.isArray(rawQ.answers)
            ? rawQ.answers.map((a: any, i: number) => {
                const id        = a.id !== undefined ? a.id : i.toString();
                const isCorrect = a.is_correct !== undefined
                  ? a.is_correct
                  : rawQ.correct === a.id || rawQ.correct === i.toString();
                return {
                  id,
                  answer_text: a.answer_text || a.answer || "",
                  is_correct:  isCorrect,
                  color:       a.color || "#e74c3c",
                  image_url:   a.image_url || a.image || null,
                };
              })
            : [],
        } : null;

        // Find selected answer with multiple fallback strategies
        const selectedAns = _findAnswer(question?.answers ?? [], response.answer_id);

        const correctAns = question?.answers?.find((a: any) => a.is_correct) ?? {
          id: "0", answer_text: "Unknown", color: "#e74c3c", image_url: null,
        };

        const safeSelected = _buildSafeAnswer(selectedAns, response);

        const finalIsCorrect = _checkCorrect(safeSelected, correctAns);

        return {
          id:             question?.id ?? "unknown",
          question_text:  question?.question_text ?? "Unknown Question",
          image_url:      question?.image_url ?? null,
          points:         Math.round(pointsPerQuestion),
          selected_answer: safeSelected,
          correct_answer:  correctAns,
          is_correct:      finalIsCorrect,
          response_time:   0,
          points_earned:   finalIsCorrect ? Math.round(pointsPerQuestion) : 0,
        };
      });

      setQuestionDetails(processedDetails);

      // Score calculation
      const correctAnswers   = processedDetails.filter((q) => q.is_correct).length;
      const normalizedScore  = Math.round(correctAnswers * pointsPerQuestion);

      let totalTimeSpent = 0;
      if (session.started_at && session.ended_at) {
        totalTimeSpent = Math.round(
          (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000
        );
      }

      const finalScore =
        sessionResponses.point !== undefined && sessionResponses.point !== null
          ? sessionResponses.point
          : normalizedScore;

      const stats: LearnStats = {
        total_questions:     processedDetails.length,
        correct_answers:     correctAnswers,
        total_points:        finalScore,
        total_time_spent:    totalTimeSpent,
        accuracy_percentage:
          processedDetails.length > 0
            ? Math.round((correctAnswers / processedDetails.length) * 100)
            : 0,
      };

      setLearnStats(stats);

      // Recalculate if score is missing
      if (
        sessionResponses.point === undefined ||
        sessionResponses.point === null ||
        sessionResponses.point === 0
      ) {
        updateSessionScore(sessionId, sessionResponses, normalizedScore).catch(console.error);
      }
    } catch (err: any) {
      console.error("[useLearnResult] loadResults:", err);
      setError(err.message || "An error occurred while loading results");
    } finally {
      setLoading(false);
    }
  };

  // ── Answer finding helpers ───────────────────────────────────
  const _findAnswer = (answers: any[], answerId: any): any => {
    if (!answers.length || !answerId) return null;

    return (
      answers.find((a) => a.id === answerId) ||
      answers.find((a) => String(a.id) === String(answerId)) ||
      answers.find((a) =>
        !isNaN(Number(a.id)) && !isNaN(Number(answerId)) &&
        Number(a.id) === Number(answerId)
      ) ||
      (() => {
        const idx = parseInt(answerId);
        return !isNaN(idx) && idx >= 0 && idx < answers.length ? answers[idx] : undefined;
      })() ||
      answers.find((a) => {
        const ai = String(a.id), ri = String(answerId);
        return ai.includes(ri) || ri.includes(ai);
      }) ||
      null
    );
  };

  const _buildSafeAnswer = (found: any | null, response: any) => {
    if (found && (found.answer_text || found.answer || found.image_url || found.image)) {
      return {
        ...found,
        color: found.color || "#e74c3c",
        answer_text: found.answer_text || found.answer || "",
        image_url: found.image_url || found.image || null,
      };
    }
    if (response.answer_id) {
      const id  = String(response.answer_id);
      const text = id.match(/^\d+$/) ? `Option ${parseInt(id) + 1}`
                  : id.length > 10    ? `Answer (${id.substring(0, 8)}...)`
                  :                     `Answer "${id}"`;
      return { id: response.answer_id, answer_text: text, color: "#f59e0b", image_url: null, is_correct: response.is_correct || false };
    }
    return { id: "0", answer_text: "No Answer", color: "#6b7280", image_url: null, is_correct: false };
  };

  const _checkCorrect = (selected: any, correct: any): boolean => {
    if (!selected || !correct) return false;
    const textMatch = (selected.answer_text || "").toLowerCase().trim() ===
                      (correct.answer_text || "").toLowerCase().trim() &&
                      (selected.answer_text || "") !== "";
    return textMatch || selected.id === correct.id || selected.is_correct === true;
  };

  // ── Actions ──────────────────────────────────────────────────
  const handleRetakeQuiz = async () => {
    if (!learnSession || !user) return;
    try {
      const newId = await createRetakeSession(learnSession);
      toast.success("Starting tryout with the same questions");
      router.push(`/tryout/play/${newId}`);
    } catch (err: any) {
      console.error("[useLearnResult] retake:", err);
      toast.error("An error occurred while creating new session");
    }
  };

  const handleShareResults = async () => {
    if (!learnStats || !learnSession) return;
    const text = `I just completed the tryout "${learnSession.quizzes?.title ?? "Quiz"}" with a score of ${learnStats.total_points} points! (${learnStats.accuracy_percentage}% correct out of ${learnStats.total_questions} questions)`;
    if (navigator.share) {
      try { await navigator.share({ title: "Tryout Results", text, url: window.location.href }); }
      catch { navigator.clipboard.writeText(text); toast.success("Results successfully copied to clipboard!"); }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Results successfully copied to clipboard!");
    }
  };

  // ── Helpers ──────────────────────────────────────────────────
  const formatTime = (timeValue: number, isMs = false): string => {
    if (timeValue <= 0) return "--";
    const s = isMs ? Math.round(timeValue / 1000) : Math.round(timeValue);
    const m = Math.floor(s / 60);
    const r = s % 60;
    const min = "m";
    const sec = "s";
    if (m === 0)  return `${r}${sec}`;
    if (r === 0)  return `${m}${min}`;
    return `${m}${min} ${r}${sec}`;
  };

  return {
    loading, authLoading, error,
    learnSession, learnStats, questionDetails,
    handleRetakeQuiz, handleShareResults, formatTime,
  };
}