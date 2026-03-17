// ============================================================
// _types/index.ts
// Shared domain types untuk semua halaman tryout:
//   settings → play → result
// ============================================================

// ─── Quiz & Settings ─────────────────────────────────────────

export interface QuizProfile {
  username: string;
  avatar_url: string | null;
}

export interface QuizForSettings {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  creator_id: string;
  questions: any[];
  profiles: QuizProfile;
}

// ─── Learn Session ────────────────────────────────────────────

export interface SessionResponse {
  answers: Array<{
    id: string;
    answer_id: string;
    question_id: string;
  }>;
  point: number;
}

export interface LearnSession {
  id: string;
  quiz_id: string;
  user_id: string;
  status: string;
  total_time_minutes: number;
  question_limit: string;
  questions?: any[];
  responses?: SessionResponse;
  created_at?: string;
  started_at: string | null;
  ended_at: string | null;
}

/** LearnSession yang sudah join dengan tabel quizzes (untuk play & result) */
export interface LearnSessionWithQuiz extends LearnSession {
  quizzes: {
    id: string;
    title: string;
    description: string | null;
    questions?: any[];
  } | null;
}

// ─── Play ─────────────────────────────────────────────────────

export interface Answer {
  id: string;
  answer_text: string;
  is_correct: boolean;
  color: string;
  order_index: number;
  image_url?: string | null;
}

export interface Question {
  id: string;
  question_text: string;
  time_limit: number;
  order_index: number;
  image_url?: string | null;
  answers: Answer[];
}

export interface LearnResponse {
  id: string;
  session_id: string;
  question_id: string;
  answer_id: string | null;
  is_correct: boolean | null;
  points: number;
  started_at: string | null;
  ended_at: string | null;
  cumulative_time?: number;
}

// ─── Result ───────────────────────────────────────────────────

export interface QuestionDetail {
  id: string;
  question_text: string;
  image_url?: string | null;
  points: number;
  selected_answer: {
    id: string;
    answer_text: string;
    image_url?: string | null;
    is_correct: boolean;
    color: string;
  } | null;
  correct_answer: {
    id: string;
    answer_text: string;
    image_url?: string | null;
    color: string;
  };
  is_correct: boolean;
  response_time: number;
  points_earned: number;
}

export interface LearnStats {
  total_questions: number;
  correct_answers: number;
  total_points: number;
  total_time_spent: number;
  accuracy_percentage: number;
}
