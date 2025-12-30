import { createClient, SupabaseClient, RealtimeChannel } from "@supabase/supabase-js"
import { clientEnv } from './env-config'
import { generateXID } from './id-generator'

// ============================================================
// Realtime Database Client (Database kedua untuk game sessions)
// Simplified: Hanya 2 tabel - game_sessions_rt & game_participants_rt
// ============================================================

const realtimeUrl = clientEnv.supabaseRealtime.url
const realtimeAnonKey = clientEnv.supabaseRealtime.anonKey

export const isRealtimeDbConfigured = !!(realtimeUrl && realtimeAnonKey)

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔧 Realtime DB Config:', {
    isConfigured: isRealtimeDbConfigured,
    hasUrl: !!realtimeUrl,
    hasKey: !!realtimeAnonKey,
    url: realtimeUrl ? realtimeUrl.substring(0, 30) + '...' : 'NOT SET'
  })
}

export const supabaseRealtime: SupabaseClient | null = isRealtimeDbConfigured
  ? createClient(realtimeUrl, realtimeAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    })
  : null

// ============================================================
// Types
// ============================================================

export interface GameSessionRT {
  id: string
  game_pin: string
  quiz_id: string
  host_id: string
  status: 'waiting' | 'active' | 'finished'
  total_time_minutes: number
  question_limit: string
  game_end_mode: 'manual' | 'first_finish' | 'wait_timer'
  allow_join_after_start: boolean
  difficulty: string | null
  application: string
  countdown_started_at: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export interface ParticipantResponseItem {
  question_id: string
  answer_id: string | null
}

export interface GameParticipantRT {
  id: string
  session_id: string
  user_id: string | null
  nickname: string
  score: number
  started: string | null
  ended: string | null
  joined_at: string
  responses: ParticipantResponseItem[]
}

// ============================================================
// Profile Cache (untuk mengurangi request ke main DB)
// ============================================================

const profileCache = new Map<string, any>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cacheTimestamps = new Map<string, number>()

export function getCachedProfile(userId: string) {
  const timestamp = cacheTimestamps.get(userId)
  if (timestamp && Date.now() - timestamp < CACHE_TTL) {
    return profileCache.get(userId)
  }
  return null
}

export function setCachedProfile(userId: string, profile: any) {
  profileCache.set(userId, profile)
  cacheTimestamps.set(userId, Date.now())
}

export function clearProfileCache() {
  profileCache.clear()
  cacheTimestamps.clear()
}

// ============================================================
// Game Session Functions
// ============================================================

export async function createGameSessionRT(data: {
  id: string
  game_pin: string
  quiz_id: string
  host_id: string
  total_time_minutes?: number
  question_limit?: string
  game_end_mode?: string
  allow_join_after_start?: boolean
  difficulty?: string
  application?: string
}): Promise<GameSessionRT | null> {
  if (!supabaseRealtime) {
    console.warn('⚠️ createGameSessionRT: supabaseRealtime client is null')
    return null
  }

  console.log('📡 Creating session in Realtime DB:', { id: data.id, pin: data.game_pin })

  const { data: session, error } = await supabaseRealtime
    .from('game_sessions_rt')
    .insert({
      id: data.id,
      game_pin: data.game_pin,
      quiz_id: data.quiz_id,
      host_id: data.host_id,
      total_time_minutes: data.total_time_minutes || 60,
      question_limit: data.question_limit || 'all',
      game_end_mode: data.game_end_mode || 'manual',
      allow_join_after_start: data.allow_join_after_start || false,
      difficulty: data.difficulty || null,
      application: data.application || 'gameforsmart.com',
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating game session RT:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    return null
  }

  console.log('✅ Session created in Realtime DB:', session?.id)
  return session
}

export async function getGameSessionRT(sessionId: string): Promise<GameSessionRT | null> {
  if (!supabaseRealtime) return null

  const { data, error } = await supabaseRealtime
    .from('game_sessions_rt')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Error getting game session RT:', error)
    return null
  }

  return data
}

export async function getGameSessionByPinRT(pin: string): Promise<GameSessionRT | null> {
  if (!supabaseRealtime) return null

  const { data, error } = await supabaseRealtime
    .from('game_sessions_rt')
    .select('*')
    .eq('game_pin', pin)
    .single()

  if (error) {
    console.error('Error getting game session by pin RT:', error)
    return null
  }

  return data
}

export async function updateGameSessionRT(
  sessionId: string,
  updates: Partial<GameSessionRT>
): Promise<boolean> {
  if (!supabaseRealtime) return false

  const { error } = await supabaseRealtime
    .from('game_sessions_rt')
    .update(updates)
    .eq('id', sessionId)

  if (error) {
    console.error('Error updating game session RT:', error)
    return false
  }

  return true
}

// ============================================================
// Participants Functions
// ============================================================

export async function addParticipantRT(data: {
  id?: string  // Optional: use same ID as Main DB for consistency
  session_id: string
  user_id?: string | null
  nickname: string
}): Promise<GameParticipantRT | null> {
  if (!supabaseRealtime) {
    console.warn('⚠️ addParticipantRT: supabaseRealtime client is null')
    return null
  }

  const participantId = data.id || generateXID()
  console.log('📡 Adding participant to Realtime DB:', { id: participantId, session_id: data.session_id, nickname: data.nickname })

  const { data: participant, error } = await supabaseRealtime
    .from('game_participants_rt')
    .insert({
      id: participantId,
      session_id: data.session_id,
      user_id: data.user_id || null,
      nickname: data.nickname,
      responses: [],
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error adding participant RT:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    return null
  }

  console.log('✅ Participant added to Realtime DB:', participant?.id)
  return participant
}

export async function getParticipantsRT(sessionId: string): Promise<GameParticipantRT[]> {
  if (!supabaseRealtime) return []

  const { data, error } = await supabaseRealtime
    .from('game_participants_rt')
    .select('*')
    .eq('session_id', sessionId)
    .order('score', { ascending: false })

  if (error) {
    console.error('Error getting participants RT:', error)
    return []
  }

  return data || []
}

export async function updateParticipantRT(
  participantId: string,
  updates: Partial<GameParticipantRT>
): Promise<boolean> {
  if (!supabaseRealtime) return false

  const { error } = await supabaseRealtime
    .from('game_participants_rt')
    .update(updates)
    .eq('id', participantId)

  if (error) {
    console.error('Error updating participant RT:', error)
    return false
  }

  return true
}

// ============================================================
// Response Functions (responses stored in participant's JSONB)
// ============================================================

export async function addResponseRT(
  participantId: string,
  questionId: string,
  answerId: string | null
): Promise<ParticipantResponseItem[] | null> {
  if (!supabaseRealtime) return null

  // Get current participant responses
  const { data: participant, error: fetchError } = await supabaseRealtime
    .from('game_participants_rt')
    .select('responses')
    .eq('id', participantId)
    .single()

  if (fetchError) {
    console.error('Error fetching participant for response:', fetchError)
    return null
  }

  const currentResponses: ParticipantResponseItem[] = participant?.responses || []
  
  // Remove existing response for same question (if any) and add new one
  const filteredResponses = currentResponses.filter(r => r.question_id !== questionId)
  const newResponse: ParticipantResponseItem = { question_id: questionId, answer_id: answerId }
  const updatedResponses = [...filteredResponses, newResponse]

  // Update participant with new responses
  const { error: updateError } = await supabaseRealtime
    .from('game_participants_rt')
    .update({ responses: updatedResponses })
    .eq('id', participantId)

  if (updateError) {
    console.error('Error adding response RT:', updateError)
    return null
  }

  return updatedResponses
}

export async function getParticipantResponsesRT(participantId: string): Promise<ParticipantResponseItem[]> {
  if (!supabaseRealtime) return []

  const { data, error } = await supabaseRealtime
    .from('game_participants_rt')
    .select('responses')
    .eq('id', participantId)
    .single()

  if (error) {
    console.error('Error getting participant responses RT:', error)
    return []
  }

  return data?.responses || []
}

// Helper: Get all responses from all participants in a session
export async function getAllResponsesRT(sessionId: string): Promise<{
  participant_id: string
  responses: ParticipantResponseItem[]
}[]> {
  if (!supabaseRealtime) return []

  const participants = await getParticipantsRT(sessionId)
  return participants.map(p => ({
    participant_id: p.id,
    responses: p.responses || []
  }))
}

// ============================================================
// Realtime Subscription Helpers
// ============================================================

export function subscribeToGameRT(
  sessionId: string,
  callbacks: {
    onSessionChange?: (session: GameSessionRT) => void
    onParticipantChange?: (payload: { eventType: string; new: GameParticipantRT; old: GameParticipantRT | null }) => void
  }
): RealtimeChannel | null {
  if (!supabaseRealtime) {
    console.warn('⚠️ subscribeToGameRT: supabaseRealtime client is null')
    return null
  }

  console.log('📡 subscribeToGameRT: Setting up subscription for session:', sessionId)

  const channel = supabaseRealtime
    .channel(`game_rt_${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_sessions_rt',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('📡 Realtime event received (game_sessions_rt):', {
          eventType: payload.eventType,
          sessionId: (payload.new as any)?.id,
          status: (payload.new as any)?.status
        })
        if (callbacks.onSessionChange && payload.new) {
          callbacks.onSessionChange(payload.new as GameSessionRT)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_participants_rt',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('📡 Realtime event received (game_participants_rt):', {
          eventType: payload.eventType,
          participantId: (payload.new as any)?.id,
          nickname: (payload.new as any)?.nickname,
          sessionId: (payload.new as any)?.session_id
        })
        if (callbacks.onParticipantChange) {
          callbacks.onParticipantChange({
            eventType: payload.eventType,
            new: payload.new as GameParticipantRT,
            old: payload.old as GameParticipantRT | null,
          })
        }
      }
    )
    .subscribe((status, err) => {
      console.log('📡 Realtime subscription status:', status)
      if (err) {
        console.error('❌ Realtime subscription error:', err)
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to Realtime DB for session:', sessionId)
      }
    })

  return channel
}

export function unsubscribeFromGameRT(channel: RealtimeChannel | null) {
  if (channel && supabaseRealtime) {
    supabaseRealtime.removeChannel(channel)
  }
}

// ============================================================
// Sync to Main DB (called when game finishes)
// ============================================================

export async function getGameDataForSync(sessionId: string): Promise<{
  session: GameSessionRT | null
  participants: GameParticipantRT[]
} | null> {
  if (!supabaseRealtime) return null

  const session = await getGameSessionRT(sessionId)
  const participants = await getParticipantsRT(sessionId)

  return { session, participants }
}

// ============================================================
// Cleanup
// ============================================================

export async function deleteGameSessionRT(sessionId: string): Promise<boolean> {
  if (!supabaseRealtime) return false

  const { error } = await supabaseRealtime
    .from('game_sessions_rt')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('Error deleting game session RT:', error)
    return false
  }

  return true
}
