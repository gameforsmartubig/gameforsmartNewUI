// ============================================================
// types/index.ts
// Shared types for Create Quiz feature
// ============================================================

export type Answer = {
  id: string;
  answer: string;
  image: string | null;
};

export type Question = {
  id: string;
  question: string;
  image: string | null;
  answers: Answer[];
  correct: string; // Index of correct answer ("0" | "1" | "2" | "3")
  type: string;    // Question type e.g. "multiple_choice"
};

export type ValidationIssue = {
  questionIndex: number;
  questionNumber: number;
  issues: string[];
};

export type QuizFormData = {
  title: string;
  description: string;
  is_public: boolean;
  category: string;
  language: string;
  image_url: string | null;
};

export type AiOptions = {
  generateMetadata: boolean;
  questionCount: number;
  randomizeCorrectAnswer: boolean;
  appendToExisting: boolean;
  updateMetadata: boolean;
};

export type UserQuota = {
  tokensUsed: number;
  remainingTokens: number;
};

export type CreationMethod = "ai" | "excel" | "manual";
