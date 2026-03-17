"use client";

// ============================================================
// settings/_hooks/useLearnSettings.ts
// State + business logic untuk halaman settings tryout.
// Semua Supabase I/O lewat learnService.
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  fetchProfileId,
  fetchQuizForSettings,
  createLearnSession,
} from "../../../services/learnService";
import type { QuizForSettings } from "../../../types";

export function useLearnSettings(quizId: string) {
  const { user } = useAuth();
  const router    = useRouter();

  // ── UI state ────────────────────────────────────────────────
  const [isLoading,      setIsLoading]      = useState(true);
  const [isSaving,       setIsSaving]       = useState(false);
  const [authLoading,    setAuthLoading]    = useState(true);

  // ── Data state ───────────────────────────────────────────────
  const [quiz,           setQuiz]           = useState<QuizForSettings | null>(null);
  const [profileId,      setProfileId]      = useState<string | null>(null);
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number>(10);
  const [questionLimit,  setQuestionLimit]  = useState<string>("all");

  // ── Auth & init ──────────────────────────────────────────────
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
  }, [user]);

  const init = async () => {
    if (!user) return;
    try {
      const [pid, quiz] = await Promise.all([
        fetchProfileId(user.id),
        fetchQuizForSettings(quizId),
      ]);

      setProfileId(pid);
      setQuiz(quiz);

      // Default question limit
      setQuestionLimit(quiz.questions.length > 10 ? "10" : "all");
    } catch (error: any) {
      console.error("[useLearnSettings] init:", error);
      toast.error("Quiz not found");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shuffle (seeded Fisher-Yates) ────────────────────────────
  const shuffleArray = <T,>(arr: T[], seed: string): T[] => {
    const result = [...arr];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const rng = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng(hash + i) * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  // ── Save & proceed ───────────────────────────────────────────
  const saveSettingsAndProceed = async () => {
    if (!quiz || !user || !profileId) {
      toast.error("Incomplete data");
      return;
    }
    if (!totalTimeMinutes || totalTimeMinutes < 1 || totalTimeMinutes > 60) {
      toast.error("Time must be between 1-60 minutes");
      return;
    }

    setIsSaving(true);
    try {
      const seed = `${user.id}-${quiz.id}-${Date.now()}`;
      let shuffled = shuffleArray([...quiz.questions], seed);

      if (questionLimit !== "all") {
        const limit = parseInt(questionLimit);
        if (!isNaN(limit) && limit > 0 && limit < shuffled.length) {
          shuffled = shuffled.slice(0, limit);
        }
      }

      const sessionId = await createLearnSession({
        quizId: quiz.id,
        profileId,
        totalTimeMinutes,
        questionLimit,
        shuffledQuestions: shuffled,
      });

      toast.success("Learning session created successfully");
      router.push(`/tryout/play/${sessionId}`);
    } catch (error: any) {
      console.error("[useLearnSettings] save:", error);
      const msg = error?.message || "";
      if (msg)      toast.error(`${"Failed to save"}: ${msg}`);
      else          toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    // state
    quiz,
    profileId,
    totalTimeMinutes, setTotalTimeMinutes,
    questionLimit,    setQuestionLimit,
    isLoading,
    isSaving,
    authLoading,
    // action
    saveSettingsAndProceed,
  };
}