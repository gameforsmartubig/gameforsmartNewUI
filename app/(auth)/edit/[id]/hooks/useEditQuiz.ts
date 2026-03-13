"use client";

// ============================================================
// _hooks/useEditQuiz.ts
//
// Mengelola state + business logic untuk halaman Edit Quiz.
// TIDAK ada import supabase di sini — semua I/O dilakukan
// lewat _services/quizService.ts.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/use-i18n";
import { ANSWER_COLORS, getCategories, getLanguages } from "../utils/constants";
import type { Quiz, Question } from "../types";
import {
  fetchQuizForEdit,
  autoSaveQuizInfo   as svcAutoSaveQuizInfo,
  autoSaveQuestionImage as svcAutoSaveQuestionImage,
  autoSaveAnswerImage   as svcAutoSaveAnswerImage,
  deleteQuestionFromDb,
  saveQuiz           as svcSaveQuiz,
} from "../services/quizService";

export function useEditQuiz(quizId: string) {
  const { user } = useAuth();
  const router   = useRouter();
  const { toast } = useToast();
  const { t }    = useI18n();

  // ── UI state ──────────────────────────────────────────────
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [savingProgress,   setSavingProgress]   = useState("");
  const [authLoading,      setAuthLoading]      = useState(true);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  // ── Data state ────────────────────────────────────────────
  const [quiz,             setQuiz]             = useState<Quiz | null>(null);
  const [deletedAnswerIds, setDeletedAnswerIds] = useState<string[]>([]);

  // Ref untuk debounce timer (tidak trigger re-render)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Dialog state ──────────────────────────────────────────
  const [showSaveConfirm,              setShowSaveConfirm]              = useState(false);
  const [showPublicRequestDialog,      setShowPublicRequestDialog]      = useState(false);
  const [showDeleteQuestionConfirm,    setShowDeleteQuestionConfirm]    = useState(false);
  const [questionToDelete,             setQuestionToDelete]             = useState<string | null>(null);
  const [skipQuestionDeleteConfirmation, setSkipQuestionDeleteConfirmation] = useState(false);
  const [showDeleteAnswerConfirm,      setShowDeleteAnswerConfirm]      = useState(false);
  const [answerToDelete,               setAnswerToDelete]               = useState<{ questionId: string; answerId: string } | null>(null);
  const [skipAnswerDeleteConfirmation, setSkipAnswerDeleteConfirmation] = useState(false);

  // ── Derived helpers ───────────────────────────────────────
  const categories = getCategories(t);
  const languages  = getLanguages(t);

  // ── Effects ───────────────────────────────────────────────
  useEffect(() => {
    if (user?.id && quizId) loadQuiz();
  }, [user?.id, quizId]);

  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => { if (!user) router.push("/"); }, 2000);
      return () => clearTimeout(t);
    }
    setAuthLoading(false);
  }, [user, router]);

  // Bersihkan debounce timer saat unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // ── Load ──────────────────────────────────────────────────
  const loadQuiz = async () => {
    if (!user?.id) return;
    try {
      const data = await fetchQuizForEdit(quizId, user.id);
      setQuiz(data);
    } catch (error: any) {
      const msg =
        error?.code === "PGRST116"                ? "Quiz not found."
        : error?.code === "42501"                 ? "You don't have access to edit this quiz."
        : error?.message                          ? error.message
        :                                           "Failed to load quiz. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ── Update quiz field + debounced auto-save ───────────────
  const updateQuiz = (field: string, value: any) => {
    if (!quiz) return;

    const updated = { ...quiz, [field]: value };
    setQuiz(updated);

    if (field === "image_url") {
      // Upload / hapus gambar → simpan langsung
      if (value === null || (value && !value.startsWith("data:"))) {
        setTimeout(() => _autoSaveInfo(updated), 100);
      }
    } else {
      // Field teks → debounce 2 detik
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => _autoSaveInfo(updated), 2000);
    }
  };

  /** Kirim snapshot quiz ke service (tidak modifikasi state) */
  const _autoSaveInfo = async (snapshot: Quiz) => {
    if (saving) return;
    try {
      await svcAutoSaveQuizInfo({
        id:          snapshot.id,
        title:       snapshot.title,
        description: snapshot.description,
        category:    snapshot.category,
        language:    snapshot.language,
        is_public:   snapshot.is_public,
        image_url:   snapshot.image_url,
      });
    } catch (err) {
      console.error("[useEditQuiz] autoSaveInfo failed:", err);
    }
  };

  // ── Question mutations ────────────────────────────────────
  const updateQuestion = (questionId: string, field: string, value: any) => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    });
    // Auto-save image soal ke DB
    if (field === "image_url") {
      const shouldSync = value === null || (value && !value.startsWith("data:"));
      if (shouldSync) {
        setTimeout(
          () => svcAutoSaveQuestionImage(questionId, value).catch(console.error),
          100
        );
      }
    }
  };

  const updateAnswer = (questionId: string, answerId: string, field: string, value: any) => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === questionId
          ? { ...q, answers: q.answers.map((a) => a.id === answerId ? { ...a, [field]: value } : a) }
          : q
      ),
    });
    // Auto-save image jawaban ke DB
    if (field === "image_url") {
      const shouldSync = value === null || (value && !value.startsWith("data:"));
      if (shouldSync) {
        setTimeout(
          () => svcAutoSaveAnswerImage(answerId, value).catch(console.error),
          100
        );
      }
    }
  };

  const setCorrectAnswer = (questionId: string, answerId: string) => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === questionId ? { ...q, correct: answerId } : q
      ),
    });
  };

  const addQuestion = () => {
    if (!quiz) return;
    const newQ: Question = {
      id:        `new_${Date.now()}`,
      text:      "",
      timeLimit: 20,
      image_url: null,
      correct:   "0",
      answers:   ANSWER_COLORS.map((color, i) => ({
        id: i.toString(), text: "", color, image_url: null,
      })),
    };
    setQuiz({ ...quiz, questions: [...quiz.questions, newQ] });
    setSelectedQuestionIndex(quiz.questions.length);
  };

  // ── Delete question ───────────────────────────────────────
  const removeQuestion = async (questionId: string) => {
    if (!quiz || quiz.questions.length <= 1) return;
    if (skipQuestionDeleteConfirmation) {
      await _deleteQuestion(questionId);
    } else {
      setQuestionToDelete(questionId);
      setShowDeleteQuestionConfirm(true);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    await _deleteQuestion(questionToDelete);
    setQuestionToDelete(null);
    setShowDeleteQuestionConfirm(false);
  };

  const _deleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestionFromDb(questionId);
    } catch (err) {
      console.error("[useEditQuiz] deleteQuestion failed:", err);
      return;
    }
    setQuiz((prev) => {
      if (!prev) return prev;
      const remaining = prev.questions.filter((q) => q.id !== questionId);
      setSelectedQuestionIndex((i) => Math.min(i, Math.max(0, remaining.length - 1)));
      return { ...prev, questions: remaining };
    });
  };

  // ── Delete answer ─────────────────────────────────────────
  const addAnswer = (questionId: string) => {
    if (!quiz) return;
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: [
                ...q.answers,
                {
                  id:        `new_${Date.now()}_${q.answers.length + 1}`,
                  text:      "",
                  color:     ANSWER_COLORS[q.answers.length % ANSWER_COLORS.length],
                  image_url: null,
                },
              ],
            }
          : q
      ),
    });
  };

  const removeAnswer = (questionId: string, answerId: string) => {
    if (!quiz) return;
    const question = quiz.questions.find((q) => q.id === questionId);
    if (!question || question.answers.length <= 2) return;
    if (skipAnswerDeleteConfirmation) {
      _deleteAnswer(questionId, answerId);
    } else {
      setAnswerToDelete({ questionId, answerId });
      setShowDeleteAnswerConfirm(true);
    }
  };

  const confirmDeleteAnswer = () => {
    if (!answerToDelete) return;
    _deleteAnswer(answerToDelete.questionId, answerToDelete.answerId);
    setAnswerToDelete(null);
    setShowDeleteAnswerConfirm(false);
  };

  const _deleteAnswer = (questionId: string, answerId: string) => {
    if (!answerId.startsWith("new_")) {
      setDeletedAnswerIds((prev) => [...prev, answerId]);
    }
    setQuiz((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId
            ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) }
            : q
        ),
      };
    });
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSaveClick = () => {
    if (!quiz || !user) return;

    // If user toggled visibility to public, show request dialog instead
    if (quiz.is_public) {
      setShowPublicRequestDialog(true);
      return;
    }

    setShowSaveConfirm(true);
  };

  const confirmSaveAsPublicRequest = async () => {
    setShowPublicRequestDialog(false);
    await executeSave(true);
  };

  const saveQuiz = async () => {
    setShowSaveConfirm(false);
    await executeSave(false);
  };

  const executeSave = async (isPublicRequest: boolean) => {
    if (!quiz || !user) return;
    setSaving(true);
    setSavingProgress("Menyimpan informasi quiz...");

    try {
      // ── Upload all pending data URL images before saving ──
      const { uploadImage } = await import("@/lib/upload-image");

      // Helper: convert a data URL to a File and upload to Supabase
      const uploadDataUrl = async (dataUrl: string): Promise<string | null> => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `image_${Date.now()}.webp`, { type: blob.type });
        return uploadImage(file);
      };

      setSavingProgress("Mengupload gambar...");

      // Deep-clone quiz and upload any data URL images in questions/answers
      const updatedQuestions = await Promise.all(
        quiz.questions.map(async (question) => {
          let imageUrl = question.image_url;
          if (imageUrl?.startsWith("data:")) {
            imageUrl = await uploadDataUrl(imageUrl) || null;
          }

          const updatedAnswers = await Promise.all(
            question.answers.map(async (answer) => {
              let answerImage = answer.image_url;
              if (answerImage?.startsWith("data:")) {
                answerImage = await uploadDataUrl(answerImage) || null;
              }
              return { ...answer, image_url: answerImage };
            })
          );

          return { ...question, image_url: imageUrl, answers: updatedAnswers };
        })
      );

      // Replace quiz questions with uploaded URLs
      const quizToSave: typeof quiz = {
        ...quiz,
        questions: updatedQuestions,
      };

      setSavingProgress("Memproses semua pertanyaan dan jawaban...");

      const result = await svcSaveQuiz(quizToSave, isPublicRequest);
      if (!result.success) throw new Error(result.error);

      setSavingProgress("Selesai!");
      setDeletedAnswerIds([]);

      if (isPublicRequest) {
        toast({
          title: "Success",
          description: "Quiz berhasil disimpan! Quiz akan menjadi publik setelah disetujui oleh tim support.",
          duration: 5000,
        });
      } else {
        toast({ title: "Success", description: t("editQuiz.messages.saved") });
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error("[useEditQuiz] saveQuiz failed:", error);
      toast({
        title: "Failed",
        description: t("editQuiz.messages.saveFailed"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setSavingProgress("");
    }
  };

  // ── Return ────────────────────────────────────────────────
  return {
    // data
    quiz,
    categories,
    languages,
    // ui state
    loading,
    authLoading,
    saving,
    savingProgress,
    selectedQuestionIndex,
    setSelectedQuestionIndex,
    // dialogs
    showSaveConfirm,              setShowSaveConfirm,
    showPublicRequestDialog,      setShowPublicRequestDialog,
    showDeleteQuestionConfirm,    setShowDeleteQuestionConfirm,
    skipQuestionDeleteConfirmation, setSkipQuestionDeleteConfirmation,
    showDeleteAnswerConfirm,      setShowDeleteAnswerConfirm,
    skipAnswerDeleteConfirmation,  setSkipAnswerDeleteConfirmation,
    // mutations
    updateQuiz,
    updateQuestion,
    updateAnswer,
    setCorrectAnswer,
    addQuestion,
    removeQuestion,  confirmDeleteQuestion,
    addAnswer,
    removeAnswer,    confirmDeleteAnswer,
    handleSaveClick,
    saveQuiz,
    confirmSaveAsPublicRequest,
  };
}
