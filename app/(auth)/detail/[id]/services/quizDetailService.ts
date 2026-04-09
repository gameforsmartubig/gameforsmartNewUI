// ============================================================
// _services/quizDetailService.ts
//
// Semua operasi Supabase untuk halaman Quiz Detail.
//   fetchQuizDetail      – ambil quiz + creator + favorite + play count
//   toggleFavorite       – tambah/hapus favorit (quiz + profile)
// ============================================================

import { supabase } from "@/lib/supabase";
import type { QuizDetail } from "../types";

// ─── fetchQuizDetail ─────────────────────────────────────────

export interface FetchQuizDetailResult {
  quiz: QuizDetail;
  profileId: string | null;
  userFavoriteQuizIds: string[];
}

export async function fetchQuizDetail(
  quizId: string,
  authUserId?: string
): Promise<FetchQuizDetailResult> {
  // 1. Fetch quiz + creator
  const { data: quizData, error: quizError } = await supabase
    .from("quizzes")
    .select(
      `*, creator:profiles!quizzes_creator_id_fkey (
        id, username, email, avatar_url
      )`
    )
    .eq("id", quizId)
    .single();

  if (quizError) throw quizError;
  if (!quizData) throw new Error("Quiz not found");

  // 2. Fetch profile + user favorites (if logged in)
  let profileId: string | null = null;
  let userFavoriteQuizIds: string[] = [];

  if (authUserId) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, favorite_quiz")
      .eq("auth_user_id", authUserId)
      .single();

    if (profileData) {
      profileId = profileData.id;
      const favs = profileData.favorite_quiz?.favorites;
      userFavoriteQuizIds = Array.isArray(favs)
        ? Array.from(new Set(favs.filter((id: unknown): id is string => typeof id === "string")))
        : [];
    }
  }

  // 3. Normalize quiz favorites array
  const quizFavorites: string[] = Array.isArray(quizData.favorite)
    ? Array.from(
        new Set(
          (quizData.favorite as unknown[]).filter(
            (id): id is string => typeof id === "string"
          )
        )
      )
    : [];

  const isFavorited = profileId ? quizFavorites.includes(profileId) : false;

  const quiz: QuizDetail = {
    ...quizData,
    favorite:       quizFavorites,
    is_favorited:   isFavorited,
    favorite_count: quizFavorites.length,
    played:         quizData.played ?? 0,
  };

  return { quiz, profileId, userFavoriteQuizIds };
}

// ─── toggleFavorite ──────────────────────────────────────────

export interface ToggleFavoritePayload {
  quizId:              string;
  profileId:           string;
  isFavorited:         boolean;
  currentQuizFavs:     string[];
  currentProfileFavs:  string[];
}

export interface ToggleFavoriteResult {
  updatedQuizFavs:    string[];
  updatedProfileFavs: string[];
}

export async function toggleFavorite(
  payload: ToggleFavoritePayload
): Promise<ToggleFavoriteResult> {
  const {
    quizId, profileId, isFavorited,
    currentQuizFavs, currentProfileFavs,
  } = payload;

  const updatedQuizFavs: string[] = isFavorited
    ? currentQuizFavs.filter((id) => id !== profileId)
    : Array.from(new Set([...currentQuizFavs, profileId]));

  const updatedProfileFavs: string[] = isFavorited
    ? currentProfileFavs.filter((id) => id !== quizId)
    : Array.from(new Set([...currentProfileFavs, quizId]));

  const [{ error: quizErr }, { error: profileErr }] = await Promise.all([
    supabase.from("quizzes").update({ favorite: updatedQuizFavs }).eq("id", quizId),
    supabase.from("profiles").update({ favorite_quiz: { favorites: updatedProfileFavs } }).eq("id", profileId),
  ]);

  if (quizErr)    throw quizErr;
  if (profileErr) throw profileErr;

  return { updatedQuizFavs, updatedProfileFavs };
}

// ─── fetchQuizLocationChart ─────────────────────────────────

export interface ChartItem {
  name: string;
  value: number;
}

export interface QuizLocationChartData {
  countryData: ChartItem[];
  stateData: ChartItem[];
}

/**
 * Fetch game sessions that used this quiz, join country/state names,
 * aggregate counts, and return top 5 for each.
 */
export async function fetchQuizLocationChart(
  quizId: string
): Promise<QuizLocationChartData> {
  const { data: sessions, error } = await supabase
    .from("game_sessions")
    .select(
      `country_id, state_id,
       countries!game_sessions_country_id_fkey(name),
       states!game_sessions_state_id_fkey(name)`
    )
    .eq("quiz_id", quizId);

  if (error) throw error;
  if (!sessions || sessions.length === 0) {
    return { countryData: [], stateData: [] };
  }

  const countryMap = new Map<string, number>();
  const stateMap = new Map<string, number>();

  sessions.forEach((s: any) => {
    const countryName =
      (Array.isArray(s.countries) ? s.countries[0]?.name : s.countries?.name) || null;
    const stateName =
      (Array.isArray(s.states) ? s.states[0]?.name : s.states?.name) || null;

    if (countryName) {
      countryMap.set(countryName, (countryMap.get(countryName) || 0) + 1);
    }
    if (stateName) {
      stateMap.set(stateName, (stateMap.get(stateName) || 0) + 1);
    }
  });

  const toTop5 = (map: Map<string, number>): ChartItem[] =>
    [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

  return {
    countryData: toTop5(countryMap),
    stateData: toTop5(stateMap),
  };
}