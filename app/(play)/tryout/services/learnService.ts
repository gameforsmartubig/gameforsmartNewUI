// ============================================================
// _services/learnService.ts
//
// Semua operasi Supabase untuk alur tryout:
//   settings → play → result
//
// Fungsi:
//   fetchProfileId          – ambil profile XID dari auth user
//   fetchQuizForSettings    – ambil data quiz (halaman settings)
//   createLearnSession      – buat sesi baru
//   fetchLearnSession       – ambil sesi + data quiz (play & result)
//   startSession            – ubah status waiting → active
//   saveAnswerToSession     – simpan jawaban ke JSONB responses
//   finishSession           – hitung skor + tandai selesai
//   updateSessionScore      – update skor di DB (dipakai di result)
//   createRetakeSession     – buat sesi ulang (hasil → play lagi)
// ============================================================

import { supabase } from "@/lib/supabase";
import { generateXID } from "@/lib/id-generator";
import type {
  QuizForSettings,
  LearnSessionWithQuiz,
  Question,
} from "../types";

// ─── Profile ─────────────────────────────────────────────────

/** Ambil profile XID berdasarkan auth user UUID */
export async function fetchProfileId(authUserId: string): Promise<string> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (error || !profile) throw new Error("Profile not found");
  return profile.id;
}

// ─── Settings ────────────────────────────────────────────────

/** Ambil data quiz beserta pertanyaan dan profil kreator */
export async function fetchQuizForSettings(
  quizId: string
): Promise<QuizForSettings> {
  const { data, error } = await supabase
    .from("quizzes")
    .select(
      `id, title, description, is_public, creator_id, questions,
       profiles:creator_id ( username, avatar_url )`
    )
    .eq("id", quizId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Quiz not found");

  const questionsArray = Array.isArray(data.questions) ? data.questions : [];

  return {
    ...data,
    questions: questionsArray,
    profiles: Array.isArray(data.profiles)
      ? data.profiles[0] || { username: "", avatar_url: null }
      : data.profiles,
  };
}

// ─── Session CRUD ─────────────────────────────────────────────

export interface CreateSessionPayload {
  quizId: string;
  profileId: string;
  totalTimeMinutes: number;
  questionLimit: string;
  shuffledQuestions: any[];
}

/** Buat learn session baru dan kembalikan ID-nya */
export async function createLearnSession(
  payload: CreateSessionPayload
): Promise<string> {
  const { data, error } = await supabase
    .from("learn_sessions")
    .insert({
      quiz_id: payload.quizId,
      user_id: payload.profileId,
      total_time_minutes: Number(payload.totalTimeMinutes),
      question_limit: String(payload.questionLimit),
      questions: payload.shuffledQuestions,
      responses: { answers: [], point: 0 },
      status: "waiting",
    })
    .select()
    .single();

  if (error) {
    const msg =
      error.message || error.details || error.hint || "Failed to create session";
    throw new Error(msg);
  }
  if (!data) throw new Error("Failed to create learn session");

  return data.id;
}

/** Ambil sesi + quiz data (dipakai oleh play & result) */
export async function fetchLearnSession(
  sessionId: string,
  profileId: string
): Promise<LearnSessionWithQuiz> {
  const { data, error } = await supabase
    .from("learn_sessions")
    .select(`*, quizzes ( id, title, description )`)
    .eq("id", sessionId)
    .eq("user_id", profileId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Learn session not found");

  return data as LearnSessionWithQuiz;
}

/** Mulai sesi: ubah status waiting → active */
export async function startSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("learn_sessions")
    .update({ status: "active", started_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) throw error;
}

// ─── Answer saving ────────────────────────────────────────────

/**
 * Simpan jawaban ke JSONB responses di learn_sessions.
 * Jika sudah ada jawaban untuk pertanyaan itu, update;
 * jika belum, tambahkan baru.
 */
export async function saveAnswerToSession(
  sessionId: string,
  questionId: string,
  answerId: string
): Promise<void> {
  // Baca state responses saat ini
  const { data: sessionData } = await supabase
    .from("learn_sessions")
    .select("responses")
    .eq("id", sessionId)
    .single();

  const currentResponses = sessionData?.responses || { answers: [], point: 0 };
  const currentAnswers: any[] = Array.isArray(currentResponses.answers)
    ? currentResponses.answers
    : [];

  // Cek apakah sudah ada jawaban untuk pertanyaan ini
  const existingIndex = currentAnswers.findIndex(
    (r: any) => r.question_id === questionId
  );

  // Jika jawaban sudah sama persis, skip
  if (
    existingIndex >= 0 &&
    currentAnswers[existingIndex].answer_id === answerId
  ) {
    return;
  }

  let updatedAnswers: any[];

  if (existingIndex >= 0) {
    // Update jawaban yang sudah ada
    updatedAnswers = [...currentAnswers];
    updatedAnswers[existingIndex] = {
      ...updatedAnswers[existingIndex],
      answer_id: answerId,
    };
  } else {
    // Tambah jawaban baru
    updatedAnswers = [
      ...currentAnswers,
      { id: generateXID(), question_id: questionId, answer_id: answerId },
    ];
  }

  const { error } = await supabase
    .from("learn_sessions")
    .update({
      responses: { answers: updatedAnswers, point: currentResponses.point || 0 },
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) throw error;
}

// ─── Finish ───────────────────────────────────────────────────

export interface FinishResult {
  finalScore: number;
  correctCount: number;
  totalQuestions: number;
}

/**
 * Selesaikan sesi:
 *  1. Ambil responses + questions dari DB
 *  2. Hitung skor 0–100 (normalized)
 *  3. Update status → finished + ended_at + skor
 */
export async function finishSession(
  sessionId: string,
  localQuestions: Question[]
): Promise<FinishResult> {
  const finishTime = new Date().toISOString();

  const { data: sessionData } = await supabase
    .from("learn_sessions")
    .select("responses, questions")
    .eq("id", sessionId)
    .single();

  const currentResponses = sessionData?.responses || { answers: [], point: 0 };
  const answersArray: any[] = Array.isArray(currentResponses.answers)
    ? currentResponses.answers
    : [];
  const questionsArray: any[] = Array.isArray(sessionData?.questions)
    ? sessionData.questions
    : localQuestions;

  const totalQuestions = questionsArray.length;
  const pointsPerQuestion = totalQuestions > 0 ? 100 / totalQuestions : 0;

  let calculatedScore = 0;
  let correctCount = 0;

  answersArray.forEach((answer: any) => {
    const question = questionsArray.find((q: any) => q.id === answer.question_id);
    if (!question) return;

    let isCorrect = false;

    if (question.correct !== undefined && question.correct !== null) {
      isCorrect = String(question.correct) === String(answer.answer_id);
    } else if (Array.isArray(question.answers)) {
      const correctAnswer = question.answers.find((a: any) => a.is_correct === true);
      if (correctAnswer) {
        isCorrect = String(correctAnswer.id) === String(answer.answer_id);
      }
    }

    if (isCorrect) {
      calculatedScore += pointsPerQuestion;
      correctCount++;
    }
  });

  const finalScore = Math.round(calculatedScore);

  const { error } = await supabase
    .from("learn_sessions")
    .update({
      status: "finished",
      ended_at: finishTime,
      responses: { ...currentResponses, point: finalScore },
    })
    .eq("id", sessionId);

  if (error) throw error;

  return { finalScore, correctCount, totalQuestions };
}

// ─── Result ───────────────────────────────────────────────────

/** Fetch hasil sesi lengkap (sama dengan fetchLearnSession, alias untuk clarity) */
export const fetchSessionResults = fetchLearnSession;

/** Update skor di DB (dipakai saat hasil halaman recalculate) */
export async function updateSessionScore(
  sessionId: string,
  sessionResponses: any,
  normalizedScore: number
): Promise<void> {
  const { error } = await supabase
    .from("learn_sessions")
    .update({
      responses: { ...sessionResponses, point: normalizedScore },
    })
    .eq("id", sessionId);

  if (error) throw error;
}

/** Buat sesi ulang dengan soal yang sama (dari halaman result → play lagi) */
export async function createRetakeSession(
  originalSession: LearnSessionWithQuiz
): Promise<string> {
  const { data, error } = await supabase
    .from("learn_sessions")
    .insert({
      quiz_id:            originalSession.quiz_id,
      user_id:            originalSession.user_id,
      total_time_minutes: originalSession.total_time_minutes,
      question_limit:     originalSession.question_limit,
      questions:          originalSession.questions,
      responses:          { answers: [], point: 0 },
      status:             "waiting",
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create retake session");

  return data.id;
}
