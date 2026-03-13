// ============================================================
// _services/dashboardService.ts
//
// Semua operasi Supabase untuk halaman Dashboard.
//   fetchDashboardData  → dipanggil dari page.tsx (Server Component)
//   toggleFavorite      → dipanggil dari useDashboard (Client)
//   createGameSession   → dipanggil dari useDashboard (Client)
// ============================================================

import { formatTimeAgo } from "@/lib/utils";
import type { Quiz } from "../component/types";

// ─── Return types ────────────────────────────────────────────

export interface DashboardData {
  publicQuizzes: Quiz[];
  myQuizzes: Quiz[];
  favoriteQuizzes: Quiz[];
  currentProfileId?: string;
}

export interface ToggleFavoriteResult {
  success: boolean;
  added: boolean; // true = ditambahkan, false = dihapus
  error?: string;
}

export interface CreateSessionResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

// ─── fetchDashboardData ──────────────────────────────────────

/**
 * Mengambil semua data yang dibutuhkan dashboard sekaligus.
 * Menerima `supabase` client yang di-inject dari page.tsx
 * agar kompatibel dengan createClient() server-side.
 */
export async function fetchDashboardData(
  supabase: any
): Promise<DashboardData> {
  // 1. User & profile aktif
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let currentProfileId: string | undefined;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (profile) currentProfileId = (profile as any).id;
  }

  // 2. Semua quiz (exclude soft-deleted)
  const { data: quizzesData, error: quizzesError } = await supabase
    .from("quizzes")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (quizzesError) throw quizzesError;

  const safeQuizzes = (quizzesData || []) as any[];
  const creatorIds = safeQuizzes.map((q: any) => q.creator_id).filter(Boolean);

  // 3. Profil kreator (batch)
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, auth_user_id")
    .in("id", creatorIds);

  const profileMap: Record<string, any> = {};
  (profilesData || []).forEach((p: any) => {
    profileMap[p.id] = p;
    if (p.auth_user_id) profileMap[p.auth_user_id] = p;
  });

  // 4. Transform → Quiz[]
  const allQuizzes: Quiz[] = safeQuizzes.map((q: any) => {
    const profile   = profileMap[q.creator_id];
    const favorites = Array.isArray(q.favorite) ? q.favorite : [];

    return {
      id:             q.id,
      title:          q.title,
      creator:        profile?.username || "Unknown",
      creatorPicture: profile?.avatar_url || "/images/avatars/01.png",
      categoryId:     (q.category || "general").toLowerCase(),
      questions:      Array.isArray(q.questions) ? q.questions.length : 0,
      language:       q.language || "English",
      played:         q.played || 0,
      createdAt:      formatTimeAgo(q.created_at, "short", "id"),
      _raw: {
        isPublic:   q.is_public,
        creatorId:  q.creator_id,
        isFavorite: currentProfileId ? favorites.includes(currentProfileId) : false
      }
    };
  });

  // 5. Partisi per tab
  return {
    currentProfileId,
    publicQuizzes:   allQuizzes.filter((q) => q._raw?.isPublic === true),
    myQuizzes:       allQuizzes.filter(
      (q) => q._raw?.creatorId === currentProfileId
    ),
    favoriteQuizzes: allQuizzes.filter((q) => q._raw?.isFavorite === true)
  };
}

// ─── toggleFavorite ──────────────────────────────────────────

/**
 * Tambah/hapus quiz dari favorit user.
 * Update dua tabel:
 *   profiles.favorite_quiz  (array quiz ID milik user)
 *   quizzes.favorite         (array profile ID di sisi quiz)
 */
export async function toggleFavorite(
  supabase: any,
  quiz: Quiz,
  currentProfileId: string
): Promise<ToggleFavoriteResult> {
  const isCurrentlyFavorited = quiz._raw?.isFavorite ?? false;

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("favorite_quiz")
      .eq("id", currentProfileId)
      .single();

    if (profileError) throw profileError;

    const favData = profile?.favorite_quiz as { favorites?: string[] } | null;
    const currentFavorites: string[] =
      favData && Array.isArray(favData.favorites) ? favData.favorites : [];

    const { data: quizData, error: quizDataError } = await supabase
      .from("quizzes")
      .select("favorite")
      .eq("id", quiz.id)
      .single();

    if (quizDataError) throw quizDataError;

    const quizFavoriteProfiles: string[] =
      quizData?.favorite && Array.isArray(quizData.favorite)
        ? quizData.favorite
        : [];

    const newFavorites = isCurrentlyFavorited
      ? currentFavorites.filter((id) => id !== quiz.id)
      : Array.from(new Set([...currentFavorites, quiz.id]));

    const newQuizFavorites = isCurrentlyFavorited
      ? quizFavoriteProfiles.filter((id) => id !== currentProfileId)
      : Array.from(new Set([...quizFavoriteProfiles, currentProfileId]));

    const { error: e1 } = await supabase
      .from("profiles")
      .update({ favorite_quiz: { favorites: newFavorites } })
      .eq("id", currentProfileId);
    if (e1) throw e1;

    const { error: e2 } = await supabase
      .from("quizzes")
      .update({ favorite: newQuizFavorites })
      .eq("id", quiz.id);
    if (e2) throw e2;

    return { success: true, added: !isCurrentlyFavorited };
  } catch (error: any) {
    console.error("[dashboardService] toggleFavorite:", error);
    return { success: false, added: false, error: error?.message };
  }
}

// ─── createGameSession ───────────────────────────────────────

/**
 * Buat game session baru di DB utama dan DB realtime.
 * Mengembalikan sessionId untuk redirect ke /host/:id/settings.
 */
export async function createGameSession(
  supabase: any,
  supabaseRealtime: any,
  quizId: string,
  currentProfileId: string
): Promise<CreateSessionResult> {
  try {
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select(
        "id, title, description, category, language, image_url, profiles ( username, avatar_url )"
      )
      .eq("id", quizId)
      .single();

    if (quizError || !quizData) {
      return { success: false, error: "Quiz tidak ditemukan" };
    }

    const profileData = Array.isArray(quizData.profiles)
      ? quizData.profiles[0]
      : quizData.profiles;

    const gamePin = Math.floor(100000 + Math.random() * 900000).toString();

    const { data: newSession, error: sessionError } = await supabase
      .from("game_sessions")
      .insert({
        quiz_id:              quizId,
        host_id:              currentProfileId,
        game_pin:             gamePin,
        status:               "waiting",
        game_end_mode:        "first_finish",
        allow_join_after_start: false,
        question_limit:       "5",
        total_time_minutes:   5,
        current_questions:    [],
        application:          "Quiz V2",
        quiz_detail: {
          title:            quizData.title,
          description:      quizData.description || null,
          category:         quizData.category || "general",
          language:         quizData.language || "id",
          image:            quizData.image_url || null,
          creator_username: profileData?.username || "Unknown",
          creator_avatar:   profileData?.avatar_url || null
        }
      })
      .select()
      .single();

    if (sessionError || !newSession) {
      console.error("[dashboardService] session insert failed:", sessionError);
      return { success: false, error: "Gagal membuat sesi game" };
    }

    // Realtime DB (tidak blocking)
    if (supabaseRealtime) {
      const { error: rtError } = await supabaseRealtime
        .from("game_sessions_rt")
        .insert({
          id:                   newSession.id,
          game_pin:             gamePin,
          quiz_id:              quizId,
          host_id:              currentProfileId,
          status:               "waiting",
          total_time_minutes:   5,
          game_end_mode:        "first_finish",
          allow_join_after_start: false,
          question_limit:       "5",
          application:          "Quiz V2"
        });

      if (rtError) {
        console.warn("[dashboardService] realtime insert failed:", rtError);
      }
    }

    return { success: true, sessionId: newSession.id };
  } catch (error: any) {
    console.error("[dashboardService] createGameSession:", error);
    return { success: false, error: error?.message || "Unknown error" };
  }
}

// ─── softDeleteQuiz ──────────────────────────────────────────

export interface SoftDeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Soft-delete quiz: set `deleted_at` to NOW().
 * Quiz tidak benar-benar dihapus dari database.
 */
export async function softDeleteQuiz(
  supabase: any,
  quizId: string
): Promise<SoftDeleteResult> {
  try {
    const { error } = await supabase
      .from("quizzes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", quizId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("[dashboardService] softDeleteQuiz:", error);
    return { success: false, error: error?.message || "Unknown error" };
  }
}
