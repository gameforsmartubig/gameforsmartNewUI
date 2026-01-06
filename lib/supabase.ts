import { createClient } from "@supabase/supabase-js";
import { clientEnv, validateClientEnv } from "./env-config";

// Validate environment configuration
const envValidation = validateClientEnv();
if (!envValidation.isValid) {
  console.error("❌ Supabase configuration errors:");
  envValidation.errors.forEach((error) => console.error(`  - ${error}`));

  // Don't throw in production - log error and continue with fallback
  // This prevents "Application Error" page from showing
  if (process.env.NODE_ENV === "production") {
    console.error("⚠️ Supabase config invalid in production - app may not function correctly");
  }
}

const supabaseUrl = clientEnv.supabase.url || "https://placeholder.supabase.co";
const supabaseAnonKey = clientEnv.supabase.anonKey || "placeholder-key";

if (supabaseUrl === "https://placeholder.supabase.co" || supabaseAnonKey === "placeholder-key") {
  console.warn("⚠️ Supabase credentials not configured. Using placeholder values.");
  console.warn(
    "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Database types for current schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          fullname: string | null;
          avatar_url: string | null;
          phone: string | null;
          organization: string | null;
          birthdate: string | null;
          language: string;
          role: string;
          notifications: Json;
          last_active: string | null;
          created_at: string | null;
          updated_at: string | null;
          favorite_quiz: Json;
          auth_user_id: string;
          is_profile_public: boolean | null;
          is_blocked: boolean | null;
          blocked_at: string | null;
          nickname: string | null;
          country_id: number | null;
          state_id: number | null;
          city_id: number | null;
          deleted_at: string | null;
          grade: string | null;
          gender: string | null;
          admin_since: string | null;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          fullname?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          organization?: string | null;
          birthdate?: string | null;
          language?: string;
          role?: string;
          notifications?: Json;
          last_active?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          favorite_quiz?: Json;
          auth_user_id: string;
          is_profile_public?: boolean | null;
          is_blocked?: boolean | null;
          blocked_at?: string | null;
          nickname?: string | null;
          country_id?: number | null;
          state_id?: number | null;
          city_id?: number | null;
          deleted_at?: string | null;
          grade?: string | null;
          gender?: string | null;
          admin_since?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          fullname?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          organization?: string | null;
          birthdate?: string | null;
          language?: string;
          role?: string;
          notifications?: Json;
          last_active?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          favorite_quiz?: Json;
          auth_user_id?: string;
          is_profile_public?: boolean | null;
          is_blocked?: boolean | null;
          blocked_at?: string | null;
          nickname?: string | null;
          country_id?: number | null;
          state_id?: number | null;
          city_id?: number | null;
          deleted_at?: string | null;
          grade?: string | null;
          gender?: string | null;
          admin_since?: string | null;
        };
      };
      quizzes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string | null;
          time_limit: number | null;
          language: string | null;
          is_public: boolean | null;
          creator_id: string;
          questions: Json;
          created_at: string | null;
          updated_at: string | null;
          is_hidden: boolean | null;
          hidden_at: string | null;
          hidden_reason: string | null;
          favorite: Json;
          status: string | null;
          deleted_at: string | null;
          request: boolean | null;
          played: number | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string | null;
          time_limit?: number | null;
          language?: string | null;
          is_public?: boolean | null;
          creator_id: string;
          questions?: Json;
          created_at?: string | null;
          updated_at?: string | null;
          is_hidden?: boolean | null;
          hidden_at?: string | null;
          hidden_reason?: string | null;
          favorite?: Json;
          status?: string | null;
          deleted_at?: string | null;
          request?: boolean | null;
          played?: number | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          time_limit?: number | null;
          language?: string | null;
          is_public?: boolean | null;
          creator_id?: string;
          questions?: Json;
          created_at?: string | null;
          updated_at?: string | null;
          is_hidden?: boolean | null;
          hidden_at?: string | null;
          hidden_reason?: string | null;
          favorite?: Json;
          status?: string | null;
          deleted_at?: string | null;
          request?: boolean | null;
          played?: number | null;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          creator_id: string;
          members: Json;
          activities: Json;
          join_requests: Json;
          settings: Json;
          created_at: string | null;
          updated_at: string | null;
          slug: string | null;
          deleted_at: string | null;
          category: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          creator_id: string;
          members?: Json;
          activities?: Json;
          join_requests?: Json;
          settings?: Json;
          created_at?: string | null;
          updated_at?: string | null;
          slug?: string | null;
          deleted_at?: string | null;
          category?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          creator_id?: string;
          members?: Json;
          activities?: Json;
          join_requests?: Json;
          settings?: Json;
          created_at?: string | null;
          updated_at?: string | null;
          slug?: string | null;
          deleted_at?: string | null;
          category?: string | null;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          quiz_id: string | null;
          host_id: string;
          game_pin: string;
          status: string | null;
          total_time_minutes: number | null;
          question_limit: string | null;
          game_end_mode: string | null;
          allow_join_after_start: boolean | null;
          participants: Json;
          responses: Json;
          created_at: string | null;
          countdown_started_at: string | null;
          started_at: string | null;
          ended_at: string | null;
          current_questions: Json;
          application: string;
          quiz_detail: Json;
          difficulty: string | null;
        };
        Insert: {
          id?: string;
          quiz_id?: string | null;
          host_id: string;
          game_pin: string;
          status?: string | null;
          total_time_minutes?: number | null;
          question_limit?: string | null;
          game_end_mode?: string | null;
          allow_join_after_start?: boolean | null;
          participants?: Json;
          responses?: Json;
          created_at?: string | null;
          countdown_started_at?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          current_questions?: Json;
          application?: string;
          quiz_detail?: Json;
          difficulty?: string | null;
        };
        Update: {
          id?: string;
          quiz_id?: string | null;
          host_id?: string;
          game_pin?: string;
          status?: string | null;
          total_time_minutes?: number | null;
          question_limit?: string | null;
          game_end_mode?: string | null;
          allow_join_after_start?: boolean | null;
          participants?: Json;
          responses?: Json;
          created_at?: string | null;
          countdown_started_at?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          current_questions?: Json;
          application?: string;
          quiz_detail?: Json;
          difficulty?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
