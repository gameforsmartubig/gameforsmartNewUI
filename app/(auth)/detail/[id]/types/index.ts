// ============================================================
// _types/index.ts
// Domain types untuk halaman Quiz Detail
// ============================================================

export interface QuizCreator {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

export interface QuizDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  language: string;
  is_public: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  creator_id: string;
  questions: any[];
  favorite: string[];
  creator: QuizCreator;
  is_favorited: boolean;
  favorite_count: number;
  played: number;
}