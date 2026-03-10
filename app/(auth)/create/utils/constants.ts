// ============================================================
// _utils/constants.ts
// Shared constants for Create Quiz feature
// ============================================================

import { generateXID } from "@/lib/id-generator";
import type { Question } from "../types";

export const ANSWER_COLORS = [
  "#e74c3c", // Red
  "#3498db", // Blue
  "#2ecc71", // Green
  "#f1c40f", // Yellow
];

export const DEFAULT_QUESTION: Question = {
  id: generateXID(),
  question: "",
  image: null,
  correct: "0",
  type: "multiple_choice",
  answers: [
    { id: "0", answer: "", image: null },
    { id: "1", answer: "", image: null },
    { id: "2", answer: "", image: null },
    { id: "3", answer: "", image: null },
  ],
};

export const QUESTIONS_PER_PAGE = 20;

export const DAILY_TOKEN_LIMIT = 2;

export const CATEGORY_EMOJI: Record<string, string> = {
  general: "🌍",
  science: "🔬",
  math: "📊",
  history: "📚",
  geography: "🗺️",
  language: "💬",
  technology: "💻",
  sports: "⚽",
  entertainment: "🎬",
  business: "💼",
};
