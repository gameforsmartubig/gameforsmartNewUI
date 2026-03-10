"use client";

// ============================================================
// _hooks/useCreateQuiz.ts
// Central state management & business logic for Create Quiz wizard
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/use-i18n";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-config";
import { batchInsertQuiz, type QuizData } from "@/lib/quiz-batch-insert";
import { generateXID } from "@/lib/id-generator";
import { ANSWER_COLORS, DEFAULT_QUESTION, QUESTIONS_PER_PAGE, DAILY_TOKEN_LIMIT } from "../utils/constants";
import { generateBasicMetadata, combineMetadata } from "../utils/metadata";
import type {
  Answer,
  Question,
  ValidationIssue,
  QuizFormData,
  AiOptions,
  UserQuota,
  CreationMethod,
} from "../types";

export function useCreateQuiz() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // ----- Profile & Quota -----
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [userQuota, setUserQuota] = useState<UserQuota>({
    tokensUsed: 0,
    remainingTokens: DAILY_TOKEN_LIMIT,
  });
  const [showQuotaExceededDialog, setShowQuotaExceededDialog] = useState(false);

  // ----- Wizard state -----
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<CreationMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // ----- Form data -----
  const [formData, setFormData] = useState<QuizFormData>({
    title: "",
    description: "",
    is_public: false,
    category: "general",
    language: "id",
    image_url: null,
  });

  // ----- Questions -----
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // ----- AI -----
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [aiOptions, setAiOptions] = useState<AiOptions>({
    generateMetadata: true,
    questionCount: 5,
    randomizeCorrectAnswer: true,
    appendToExisting: true,
    updateMetadata: true,
  });

  // ----- Validation -----
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

  // ===== Derived pagination values =====
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, questions.length);
  const currentPageQuestions = questions.slice(startIndex, endIndex);

  // ===== Effects =====

  // Auto-adjust question index when questions list shrinks
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= questions.length) {
      setCurrentQuestionIndex(questions.length - 1);
    }
  }, [questions.length, currentQuestionIndex]);

  // Sync page when question index changes
  useEffect(() => {
    const newPage = Math.floor(currentQuestionIndex / QUESTIONS_PER_PAGE);
    if (newPage !== currentPage && questions.length > 0) {
      setCurrentPage(newPage);
    }
  }, [currentQuestionIndex, questions.length]);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setIsProfileLoading(false);
        return;
      }
      setIsProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast({ title: "Error", description: "Failed to load profile data", variant: "destructive" });
          return;
        }
        setProfileId(data.id);
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        setIsProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id, toast]);

  // ===== Quota helpers =====

  const checkUserQuota = useCallback(async () => {
    if (!profileId) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from("user_quota")
        .select("id, token, date")
        .eq("user_id", profileId)
        .gte("date", today.toISOString())
        .lt("date", tomorrow.toISOString())
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking user quota:", error);
        return;
      }

      const tokensUsedToday = data?.token ?? 0;
      const remaining = Math.max(0, DAILY_TOKEN_LIMIT - tokensUsedToday);
      setUserQuota({ tokensUsed: tokensUsedToday, remainingTokens: remaining });
    } catch (error) {
      console.error("Error checking quota:", error);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId) checkUserQuota();
  }, [profileId, checkUserQuota]);

  const updateUserQuota = async (): Promise<boolean> => {
    if (!profileId) return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: existingRecord, error: checkError } = await supabase
        .from("user_quota")
        .select("id, token, user_id")
        .eq("user_id", profileId)
        .gte("date", today.toISOString())
        .lt("date", tomorrow.toISOString())
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        toast({ title: "Error", description: "Failed to check usage quota", variant: "destructive" });
        return false;
      }

      let result;
      if (existingRecord) {
        const { data, error } = await supabase
          .from("user_quota")
          .update({ token: (existingRecord.token || 0) + 1, date: new Date().toISOString() })
          .eq("id", existingRecord.id)
          .eq("user_id", profileId)
          .select()
          .single();
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from("user_quota")
          .insert({ id: generateXID(), user_id: profileId, date: new Date().toISOString(), token: 1 })
          .select()
          .single();
        result = { data, error };
      }

      if (result.error) {
        toast({ title: "Error", description: "Failed to update usage quota", variant: "destructive" });
        return false;
      }

      await checkUserQuota();
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to update usage quota", variant: "destructive" });
      return false;
    }
  };

  // ===== Wizard navigation =====

  const nextStep = () => setCurrentStep((s) => s + 1);
  const prevStep = () => setCurrentStep((s) => Math.max(0, s - 1));
  const goToStep = (stepIndex: number) => setCurrentStep(stepIndex);

  const handleMethodSelection = (method: CreationMethod) => {
    setSelectedMethod(method);
    setTimeout(() => nextStep(), 800);
  };

  // ===== Question management =====

  const addQuestion = () => {
    const newQuestion: Question = {
      ...DEFAULT_QUESTION,
      id: generateXID(),
      answers: DEFAULT_QUESTION.answers.map((a, index) => ({ ...a, id: index.toString() })),
    };
    setQuestions((prev) => {
      const newQuestions = [...prev, newQuestion];
      const newIndex = newQuestions.length - 1;
      setCurrentQuestionIndex(newIndex);
      setCurrentPage(Math.floor(newIndex / QUESTIONS_PER_PAGE));
      return newQuestions;
    });
  };

  const updateQuestion = (questionId: string, field: string, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, [field]: value } : q))
    );
  };

  const updateAnswer = (questionId: string, answerId: string, field: string, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, answers: q.answers.map((a) => (a.id === answerId ? { ...a, [field]: value } : a)) }
          : q
      )
    );
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions((prev) => {
      const newQuestions = prev.filter((q) => q.id !== questionId);
      if (newQuestions.length === 0) {
        setCurrentQuestionIndex(0);
        setCurrentPage(0);
      } else if (currentQuestionIndex >= newQuestions.length) {
        const newIndex = newQuestions.length - 1;
        setCurrentQuestionIndex(newIndex);
        setCurrentPage(Math.floor(newIndex / QUESTIONS_PER_PAGE));
      }
      return newQuestions;
    });
  };

  const navigateToQuestion = (questionIndex: number) => {
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setCurrentQuestionIndex(questionIndex);
      const newPage = Math.floor(questionIndex / QUESTIONS_PER_PAGE);
      if (newPage !== currentPage) setCurrentPage(newPage);
    }
  };

  // ===== AI Generation =====

  const generateQuestionsWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Perhatian", description: "Silakan masukkan prompt terlebih dahulu", variant: "destructive" });
      return;
    }
    if (isProfileLoading) {
      toast({ title: "Mohon Tunggu", description: "Sedang memuat profile pengguna...", variant: "default" });
      return;
    }
    if (userQuota.remainingTokens <= 0) {
      setShowQuotaExceededDialog(true);
      return;
    }
    if (questions.length > 0 && !aiOptions.appendToExisting) {
      const confirmed = window.confirm(`Anda akan mengganti ${questions.length} soal yang sudah ada. Lanjutkan?`);
      if (!confirmed) return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch("@app/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          language: formData.language,
          count: aiOptions.questionCount,
          generateMetadata: aiOptions.generateMetadata,
          model: "gemini-2.5-flash",
          randomizeCorrectAnswer: aiOptions.randomizeCorrectAnswer,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate questions");

      // Update metadata
      if (aiOptions.generateMetadata && aiOptions.updateMetadata) {
        const rawMeta = data.metadata ?? generateBasicMetadata(aiPrompt, formData.language);
        const combined = combineMetadata(
          formData,
          rawMeta,
          aiPrompt,
          formData.language,
          aiOptions.appendToExisting && questions.length > 0
        );
        setFormData((prev) => ({
          ...prev,
          title: combined.title ?? prev.title,
          description: combined.description ?? prev.description,
          category: combined.category ?? prev.category,
          language: data.metadata?.language ?? prev.language,
        }));
      } else if (!formData.title.trim()) {
        setFormData((prev) => ({
          ...prev,
          title: prev.title || t("createQuiz.generate.messages.aiGeneratedQuiz"),
          description: prev.description || t("createQuiz.generate.messages.aiGeneratedDescription"),
        }));
      }

      // Transform questions
      const generatedQuestions: Question[] = data.questions.map((q: {
        question_text: string;
        image_url?: string | null;
        answers: Array<{ answer_text: string; is_correct: boolean; image_url?: string | null }>;
      }) => {
        const correctIndex = q.answers.findIndex((a) => a.is_correct);
        return {
          ...DEFAULT_QUESTION,
          id: generateXID(),
          question: q.question_text,
          image: q.image_url ?? null,
          correct: correctIndex.toString(),
          answers: q.answers.map((a, index) => ({
            id: index.toString(),
            answer: a.answer_text,
            image: a.image_url ?? null,
          })),
        };
      });

      setQuestions((prev) => {
        const newQuestions = aiOptions.appendToExisting
          ? [...prev, ...generatedQuestions]
          : generatedQuestions;

        const message = aiOptions.appendToExisting
          ? `${generatedQuestions.length} soal baru ditambahkan. Total: ${newQuestions.length} soal`
          : `${generatedQuestions.length} soal berhasil dibuat`;

        toast({ title: t("common.success"), description: message, variant: "default", duration: 8000 });
        return newQuestions;
      });

      setAiPrompt("");
      await updateUserQuota();
      setTimeout(() => nextStep(), 1000);
    } catch (error) {
      console.error("Error generating questions:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("createQuiz.generate.messages.errorGenerating"),
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  // ===== Excel Import =====

  const handleExcelImport = async (file: File) => {
    try {
      const { parseExcelFile } = await import("@/lib/excel-utils");
      const excelData = await parseExcelFile(file);

      if (excelData.questions?.length > 0) {
        const correctAnswerMap: Record<string, string> = { A: "0", B: "1", C: "2", D: "3" };
        const importedQuestions: Question[] = excelData.questions.map((q: {
          question_text?: string;
          image_url?: string | null;
          answer_a?: string;
          answer_b?: string;
          answer_c?: string;
          answer_d?: string;
          correct_answer?: string;
        }) => ({
          ...DEFAULT_QUESTION,
          id: generateXID(),
          question: q.question_text || "",
          image: q.image_url || null,
          correct: correctAnswerMap[q.correct_answer || "A"] || "0",
          answers: [
            { id: "0", answer: q.answer_a || "", image: null },
            { id: "1", answer: q.answer_b || "", image: null },
            { id: "2", answer: q.answer_c || "", image: null },
            { id: "3", answer: q.answer_d || "", image: null },
          ],
        }));

        setQuestions(importedQuestions);

        if (excelData.title) {
          setFormData((prev) => ({
            ...prev,
            title: excelData.title || prev.title,
            description: excelData.description || prev.description,
            category: excelData.category || prev.category,
          }));
        }

        toast({
          title: t("common.success"),
          description: `Successfully imported ${importedQuestions.length} questions`,
          variant: "default",
        });

        setTimeout(() => nextStep(), 500);
      }
    } catch (error) {
      console.error("Error importing Excel:", error);
      toast({ title: t("common.error"), description: "Failed to import Excel file", variant: "destructive" });
    }
  };

  // ===== Download template =====

  const downloadExcelTemplate = async () => {
    try {
      const { downloadExcelTemplate } = await import("@/lib/excel-utils");
      await downloadExcelTemplate();
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({ title: t("common.error"), description: "Failed to download template", variant: "destructive" });
    }
  };

  // ===== Validation =====

  const validateQuestions = (): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    questions.forEach((question, index) => {
      const questionIssues: string[] = [];

      if (!question.question?.trim()) {
        questionIssues.push("Pertanyaan harus diisi");
      }

      question.answers.forEach((answer, answerIndex) => {
        const hasText = answer.answer?.trim();
        const hasImage = answer.image?.trim();
        if (!hasText && !hasImage) {
          questionIssues.push(`Jawaban ${String.fromCharCode(65 + answerIndex)} harus memiliki teks atau gambar`);
        }
      });

      if (!question.answers.some((a) => a.id === question.correct)) {
        questionIssues.push("Belum ada jawaban yang ditandai sebagai benar");
      }

      if (questionIssues.length > 0) {
        issues.push({ questionIndex: index, questionNumber: index + 1, issues: questionIssues });
      }
    });
    return issues;
  };

  const handleFixValidation = () => {
    if (validationIssues.length > 0) {
      setCurrentStep(2);
      navigateToQuestion(validationIssues[0].questionIndex);
      setShowValidationDialog(false);
    }
  };

  // ===== Submit =====

  const handleSubmit = async () => {
    const issues = validateQuestions();
    if (issues.length > 0) {
      setValidationIssues(issues);
      setShowValidationDialog(true);
      return;
    }

    const now = Date.now();
    if (!profileId) {
      toast({ title: "Error", description: "Profile data not loaded. Please refresh the page.", variant: "destructive" });
      return;
    }
    if (now - lastSubmitTime < 2000) {
      toast({ title: "⚠️ Pelan-pelan", description: "Mohon tunggu sebentar sebelum menyimpan lagi", variant: "default", duration: 2000 });
      return;
    }
    if (isSubmitting || loading) return;
    if (!user) {
      toast({ title: t("common.error"), description: t("createQuiz.generate.messages.loginRequired"), variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: t("common.error"), description: t("createQuiz.generate.messages.addOneQuestion"), variant: "destructive" });
      return;
    }

    setLastSubmitTime(now);
    setIsSubmitting(true);
    setLoading(true);

    try {
      const quizData: QuizData = {
        title: formData.title,
        description: formData.description,
        is_public: formData.is_public,
        category: formData.category,
        language: formData.language,
        image_url: formData.image_url,
        creator_id: profileId,
        questions: questions.map((q) => ({
          question_text: q.question,
          image_url: q.image,
          question_type: q.type,
          answers: q.answers.map((a, index) => ({
            answer_text: a.answer,
            is_correct: q.correct === a.id,
            color: ANSWER_COLORS[index],
            order_index: index,
            image_url: a.image,
          })),
        })),
      };

      await batchInsertQuiz(quizData);

      toast({ title: t("common.success"), description: t("createQuiz.generate.messages.quizCreatedSuccess") });

      // Invalidate caches
      try {
        const { queryKeys: qKeys } = await import("@/lib/query-config");
        await queryClient.invalidateQueries({ queryKey: qKeys.myQuizzes(user?.id || "") });
        if (formData.is_public) {
          await queryClient.invalidateQueries({ queryKey: ["quizzes", "public"] });
        }
      } catch {
        // skip if cache not available
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast({ title: t("common.error"), description: t("createQuiz.generate.messages.failedCreateQuiz"), variant: "destructive" });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return {
    // Auth & Profile
    user,
    profileId,
    isProfileLoading,
    userQuota,
    showQuotaExceededDialog,
    setShowQuotaExceededDialog,

    // Wizard
    currentStep,
    selectedMethod,
    loading,
    isSubmitting,
    nextStep,
    prevStep,
    goToStep,
    handleMethodSelection,

    // Form
    formData,
    setFormData,

    // Questions
    questions,
    currentQuestionIndex,
    currentPage,
    setCurrentPage,
    currentPageQuestions,
    totalPages,
    startIndex,
    endIndex,
    addQuestion,
    updateQuestion,
    updateAnswer,
    deleteQuestion,
    navigateToQuestion,

    // AI
    aiPrompt,
    setAiPrompt,
    aiGenerating,
    showAIHelper,
    setShowAIHelper,
    aiOptions,
    setAiOptions,
    generateQuestionsWithAI,

    // Excel
    handleExcelImport,
    downloadExcelTemplate,

    // Validation
    showValidationDialog,
    setShowValidationDialog,
    validationIssues,
    handleFixValidation,

    // Submit
    handleSubmit,

    // i18n
    t,
  };
}