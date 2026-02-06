import { createClient, SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { generateXID } from "./id-generator";

// Using process.env directly as in the previous step
const realtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_REALTIME_URL;
const realtimeAnonKey = process.env.NEXT_PUBLIC_SUPABASE_REALTIME_ANON_KEY;

export const isRealtimeDbConfigured = !!(realtimeUrl && realtimeAnonKey);

if (typeof window !== "undefined") {
  console.log("🔧 Realtime DB Config:", {
    isConfigured: isRealtimeDbConfigured,
    hasUrl: !!realtimeUrl,
    hasKey: !!realtimeAnonKey
  });
}

// Reuse Database definitions if possible, or just use 'any' for now since we are focusing on RT
export const supabaseRealtime: SupabaseClient | null = isRealtimeDbConfigured
  ? createClient(realtimeUrl!, realtimeAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    realtime: {
      params: {
        eventsPerSecond: 20
      }
    }
  })
  : null;

// ============================================================
// Types
// ============================================================

export interface GameSessionRT {
  id: string;
  game_pin: string;
  quiz_id: string;
  host_id: string;
  status: "waiting" | "active" | "finished";
  total_time_minutes: number;
  question_limit: string;
  game_end_mode: "manual" | "first_finish" | "wait_timer";
  allow_join_after_start: boolean;
  difficulty: string | null;
  application: string;
  countdown_started_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  current_questions: any[] | null;
}

export interface ParticipantResponseItem {
  question_id: string;
  answer_id: string | null;
}

export interface GameParticipantRT {
  id: string;
  session_id: string;
  user_id: string | null;
  nickname: string;
  score: number;
  started: string | null;
  ended: string | null;
  joined_at: string;
  responses: ParticipantResponseItem[];
}

// ============================================================
// Profile Cache (to reduce requests to main DB)
// ============================================================

const profileCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

export function getCachedProfile(userId: string) {
  const timestamp = cacheTimestamps.get(userId);
  if (timestamp && Date.now() - timestamp < CACHE_TTL) {
    return profileCache.get(userId);
  }
  return null;
}

export function setCachedProfile(userId: string, profile: any) {
  profileCache.set(userId, profile);
  cacheTimestamps.set(userId, Date.now());
}

export function clearProfileCache() {
  profileCache.clear();
  cacheTimestamps.clear();
}

// ============================================================
// Game Session Functions
// ============================================================

export async function createGameSessionRT(data: {
  id: string;
  game_pin: string;
  quiz_id: string;
  host_id: string;
  total_time_minutes?: number;
  question_limit?: string;
  game_end_mode?: string;
  allow_join_after_start?: boolean;
  difficulty?: string;
  application?: string;
}): Promise<GameSessionRT | null> {
  if (!supabaseRealtime) {
    console.warn("⚠️ createGameSessionRT: supabaseRealtime client is null");
    return null;
  }

  const { data: session, error } = await supabaseRealtime
    .from("game_sessions_rt")
    .insert({
      id: data.id,
      game_pin: data.game_pin,
      quiz_id: data.quiz_id,
      host_id: data.host_id,
      total_time_minutes: data.total_time_minutes || 60,
      question_limit: data.question_limit || "all",
      game_end_mode: data.game_end_mode || "manual",
      allow_join_after_start: data.allow_join_after_start || false,
      difficulty: data.difficulty || null,
      application: data.application || "gameforsmartNewUI"
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Error creating game session RT:", error);
    return null;
  }

  return session;
}

export async function getGameSessionRT(sessionId: string): Promise<GameSessionRT | null> {
  if (!supabaseRealtime) return null;

  const { data, error } = await supabaseRealtime
    .from("game_sessions_rt")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) {
    console.error("Error getting game session RT:", error);
    return null;
  }

  return data;
}

export async function updateGameSessionRT(
  sessionId: string,
  updates: Partial<GameSessionRT> | any
): Promise<boolean> {
  if (!supabaseRealtime) return false;

  const { error } = await supabaseRealtime
    .from("game_sessions_rt")
    .update(updates)
    .eq("id", sessionId);

  if (error) {
    console.error("Error updating game session RT:", error);
    return false;
  }

  return true;
}

export async function deleteGameSessionRT(sessionId: string): Promise<boolean> {
  if (!supabaseRealtime) return false;

  const { error } = await supabaseRealtime.from("game_sessions_rt").delete().eq("id", sessionId);

  if (error) {
    console.error("Error deleting game session RT:", error);
    return false;
  }

  return true;
}

// ============================================================
// Participants Functions
// ============================================================

export async function getParticipantsRT(sessionId: string): Promise<GameParticipantRT[]> {
  if (!supabaseRealtime) return [];

  const { data, error } = await supabaseRealtime
    .from("game_participants_rt")
    .select("*")
    .eq("session_id", sessionId)
    .order("score", { ascending: false });

  if (error) {
    console.error("Error getting participants RT:", error);
    return [];
  }

  return data || [];
}

export async function addParticipantRT(data: {
  id?: string;
  session_id: string;
  user_id?: string | null;
  nickname: string;
}): Promise<GameParticipantRT | null> {
  if (!supabaseRealtime) {
    console.warn("⚠️ addParticipantRT: supabaseRealtime client is null");
    return null;
  }

  const participantId = data.id || generateXID();

  const { data: participant, error } = await supabaseRealtime
    .from("game_participants_rt")
    .insert({
      id: participantId,
      session_id: data.session_id,
      user_id: data.user_id || null,
      nickname: data.nickname,
      responses: []
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Error adding participant RT:", error);
    return null;
  }

  return participant;
}

export async function updateParticipantResponseRT(
  sessionId: string,
  participantId: string,
  questionId: string,
  answerId: string
): Promise<boolean> {
  if (!supabaseRealtime) return false;

  // We use an RPC to atomically append/update the response in the JSONB array
  // This prevents race conditions if multiple updates happen quickly, though simpler overwrite for single user might work.
  // Ideally, we'd have an RPC like 'update_participant_response'.
  // If no RPC, we have to fetch-modify-update, which is risky for concurrency but okay for single-player context.

  // Let's assume we use a fetch-modify-update for now as creating a new RPC might be out of scope or complex to deploy without migrations.
  // OR, better: Does Supabase have a way to update JSONB path? Yes, but usually via raw SQL or nice helpers.
  // Simple approach:

  try {
    const { data: participant, error: fetchError } = await supabaseRealtime
      .from("game_participants_rt")
      .select("responses")
      .eq("id", participantId)
      .single();

    if (fetchError || !participant) {
      console.error("Error fetching participant for response update:", fetchError);
      return false;
    }

    let responses = participant.responses || [];
    // Remove existing response for this question if any
    responses = responses.filter((r: any) => r.question_id !== questionId);
    // Add new response
    responses.push({ question_id: questionId, answer_id: answerId });

    const { error: updateError } = await supabaseRealtime
      .from("game_participants_rt")
      .update({ responses })
      .eq("id", participantId);

    if (updateError) {
      console.error("Error updating participant response:", updateError);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception in updateParticipantResponseRT:", err);
    return false;
  }
}

export async function updateParticipantStartRT(participantId: string): Promise<boolean> {
  if (!supabaseRealtime) return false;

  try {
    // Check if already started to avoid overwriting (optional, but good practice)
    // Or just update if null? The query below updates only if it is null logic could be complex in one go without RPC.
    // For now, simpler: just update. The client usage should check if it needs to update or we do it here.
    // Let's do a check first.

    const { data: current, error: fetchError } = await supabaseRealtime
      .from("game_participants_rt")
      .select("started")
      .eq("id", participantId)
      .single();

    if (fetchError) return false;

    if (current && !current.started) {
      const { error } = await supabaseRealtime
        .from("game_participants_rt")
        .update({ started: new Date().toISOString() })
        .eq("id", participantId);

      if (error) {
        console.error("Error updating participant start time:", error);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("Exception in updateParticipantStartRT:", err);
    return false;
  }
}

// ============================================================
// Realtime Subscription Helpers
// ============================================================

export function subscribeToGameRT(
  sessionId: string,
  callbacks: {
    onSessionChange?: (session: GameSessionRT) => void;
    onParticipantChange?: (payload: {
      eventType: string;
      new: GameParticipantRT;
      old: GameParticipantRT | null;
    }) => void;
  }
): RealtimeChannel | null {
  if (!supabaseRealtime) {
    console.warn("⚠️ subscribeToGameRT: supabaseRealtime client is null");
    return null;
  }

  const channel = supabaseRealtime
    .channel(`game_rt_${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "game_sessions_rt",
        filter: `id=eq.${sessionId}`
      },
      (payload) => {
        if (callbacks.onSessionChange && payload.new) {
          callbacks.onSessionChange(payload.new as GameSessionRT);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "game_participants_rt",
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        console.log(`[Realtime] Participant change event:`, payload.eventType, payload.new);
        if (callbacks.onParticipantChange) {
          callbacks.onParticipantChange({
            eventType: payload.eventType,
            new: payload.new as GameParticipantRT,
            old: payload.old as GameParticipantRT | null
          });
        }
      }
    )
    .subscribe((status, err) => {
      console.log(`[Realtime] Channel game_rt_${sessionId} status:`, status);
      if (err) {
        console.error(`[Realtime] Channel error:`, err);
      }
    });

  return channel;
}

export function unsubscribeFromGameRT(channel: RealtimeChannel | null) {
  if (channel && supabaseRealtime) {
    supabaseRealtime.removeChannel(channel);
  }
}

// ============================================================
// Broadcast Helpers for Countdown Sync
// ============================================================

/**
 * Subscribe to countdown broadcast events for a game session.
 * When host broadcasts "countdown_start", all clients receive it simultaneously.
 */
export function subscribeToCountdownBroadcast(
  sessionId: string,
  onCountdownStart: (payload: any) => void
): RealtimeChannel | null {
  if (!supabaseRealtime) {
    console.warn("⚠️ subscribeToCountdownBroadcast: supabaseRealtime client is null");
    return null;
  }

  const channel = supabaseRealtime
    .channel(`countdown_${sessionId}`)
    .on("broadcast", { event: "countdown_start" }, (payload) => {
      console.log("[Broadcast] Received countdown_start:", payload);
      onCountdownStart(payload.payload);
    })
    .subscribe((status, err) => {
      console.log(`[Broadcast] Channel countdown_${sessionId} status:`, status);
      if (err) {
        console.error(`[Broadcast] Channel error:`, err);
      }
    });

  return channel;
}

/**
 * Send countdown start event using an existing active channel.
 * Reuses the channel created by subscribeToCountdownBroadcast.
 */
export async function sendCountdownSignal(channel: RealtimeChannel, startedAt?: string): Promise<boolean> {
  if (!channel) return false;

  const time = startedAt || new Date().toISOString();

  try {
    await channel.send({
      type: "broadcast",
      event: "countdown_start",
      payload: { startedAt: time }
    });

    console.log("[Broadcast] Sent countdown_start signal");
    return true;
  } catch (err) {
    console.error("Error sending countdown signal:", err);
    return false;
  }
}

/**
 * Unsubscribe from countdown broadcast channel.
 */
export function unsubscribeFromCountdownBroadcast(channel: RealtimeChannel | null) {
  if (channel && supabaseRealtime) {
    supabaseRealtime.removeChannel(channel);
  }
}
