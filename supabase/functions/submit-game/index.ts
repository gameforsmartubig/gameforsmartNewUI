import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Initialize Clients

        // Realtime DB (Self - Default Env Vars)
        // The function is deployed to the RT project, so default vars point to RT DB.
        const rtUrl = Deno.env.get("SUPABASE_URL");
        const rtKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        // Main DB (Persistence - Custom Secrets)
        // USER MUST SET THESE SECRETS IN DASHBOARD: MAIN_DB_URL, MAIN_DB_SERVICE_ROLE_KEY
        const mainUrl = Deno.env.get("MAIN_DB_URL");
        const mainKey = Deno.env.get("MAIN_DB_SERVICE_ROLE_KEY");

        if (!rtUrl || !rtKey) throw new Error("RT Config Missing (Default Env)");
        if (!mainUrl || !mainKey) throw new Error("Main DB Config Missing (Check Secrets)");

        const rtClient = createClient(rtUrl, rtKey);
        const mainClient = createClient(mainUrl, mainKey);

        // 2. Parse Body
        // action: 'submit' | 'end' | 'cron'
        const { action, sessionId, participantId } = await req.json();

        if (!sessionId) throw new Error("Session ID Required");

        // ===========================================
        // LOGIC: SUBMIT (Player)
        // ===========================================
        if (action === "submit") {
            if (!participantId) throw new Error("Participant ID Required for Submit");

            // A. Lock & Get Session Info (RT)
            const { data: session, error: sessError } = await rtClient
                .from("game_sessions_rt")
                .select("status, game_end_mode")
                .eq("id", sessionId)
                .single();

            if (sessError || !session) throw new Error("Session not found (RT)");

            // B. Mark Player as Ended (RT) + Calculate Score
            const now = new Date().toISOString();

            // 1. Calculate Score (Function RPC on RT)
            const { error: scoreError } = await rtClient.rpc("calculate_score_new_rt", {
                p_session_id: sessionId,
                p_participant_id: participantId
            });
            if (scoreError) console.error("Score Calc Error:", scoreError);

            // 2. Update 'ended' timestamp
            const { data: updatedPart, error: partError } = await rtClient
                .from("game_participants_rt")
                .update({ ended: now })
                .eq("id", participantId)
                .select() // Get the full updated row with score
                .single();

            if (partError) throw partError;

            // C. Handle Game End Modes
            const mode = session.game_end_mode || "manual";

            if (mode === "first_finish") {
                // --- FIRST FINISH MODE ---
                // End the game for EVERYONE immediately
                await runEndGameLogic(rtClient, mainClient, sessionId);

                return new Response(JSON.stringify({ status: "finished", mode: "first_finish" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } else if (mode === "wait_timer") {
                // --- WAIT TIMER MODE ---
                // Check if ALL participants have finished
                const { count: finishedCount } = await rtClient
                    .from("game_participants_rt")
                    .select("id", { count: "exact", head: true })
                    .eq("session_id", sessionId)
                    .not("ended", "is", null);

                const { count: totalCount } = await rtClient
                    .from("game_participants_rt")
                    .select("id", { count: "exact", head: true })
                    .eq("session_id", sessionId);

                if (totalCount && finishedCount && finishedCount >= totalCount) {
                    // ALL DONE -> End Game Full Sync
                    await runEndGameLogic(rtClient, mainClient, sessionId);
                    return new Response(JSON.stringify({ status: "finished", mode: "wait_timer_all_done" }), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                } else {
                    // NOT ALL DONE -> Sync ONLY this participant to Main DB
                    // This safeguards data without closing session
                    await syncSingleParticipantToMain(mainClient, sessionId, updatedPart);

                    return new Response(JSON.stringify({ status: "active", mode: "wait_timer_partial" }), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }
            }

            // Default (manual mode): Just return success, no full sync yet
            // But still sync this single participant's data for safety
            await syncSingleParticipantToMain(mainClient, sessionId, updatedPart);

            return new Response(JSON.stringify({ status: "active", mode: "manual" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // ===========================================
        // LOGIC: END (Host Manual) / CRON
        // ===========================================
        if (action === "end" || action === "cron") {
            await runEndGameLogic(rtClient, mainClient, sessionId);
            return new Response(JSON.stringify({ message: "Game Ended & Synced" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        throw new Error("Invalid Action");
    } catch (error: any) {
        console.error("Submit Game Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});

// ============================================================
// HELPERS
// ============================================================

async function runEndGameLogic(rtClient: any, mainClient: any, sessionId: string) {
    const now = new Date().toISOString();

    // 1. Update Session Status to FINISHED (RT)
    await rtClient
        .from("game_sessions_rt")
        .update({ status: "finished", ended_at: now })
        .eq("id", sessionId);

    // 2. Mark any unfinished players as ended (RT)
    await rtClient
        .from("game_participants_rt")
        .update({ ended: now })
        .eq("session_id", sessionId)
        .is("ended", null);

    // 3. Calculate Scores for ALL (RT RPC)
    await rtClient.rpc("calculate_score_new_rt", {
        p_session_id: sessionId,
        p_participant_id: null // All
    });

    // 4. Fetch ALL Participants (RT) + Session Info for normalization
    const { data: allParticipants } = await rtClient
        .from("game_participants_rt")
        .select("*")
        .eq("session_id", sessionId);

    const { data: sessionInfo } = await rtClient
        .from("game_sessions_rt")
        .select("question_limit")
        .eq("id", sessionId)
        .single();

    const limit = parseInt(sessionInfo?.question_limit || "0");

    if (allParticipants && allParticipants.length > 0) {
        // 5. Sync to Main DB - SEPARATE participants and responses + NORMALIZE SCORE
        await syncAllParticipantsToMain(mainClient, sessionId, allParticipants, limit);
    }

    // 6. Update Session Status in Main DB
    await mainClient
        .from("game_sessions")
        .update({ status: "finished", ended_at: now })
        .eq("id", sessionId);
}

/**
 * Sync a single participant to Main DB
 * Used for partial sync (wait_timer mode, manual mode)
 */
async function syncSingleParticipantToMain(mainClient: any, sessionId: string, participant: any) {
    // 1. Get current session data from Main DB
    const { data: session, error: fetchError } = await mainClient
        .from("game_sessions")
        .select("participants, responses, question_limit")
        .eq("id", sessionId)
        .single();

    if (fetchError) {
        console.error("Fetch session error:", fetchError);
        return;
    }

    // Normalize Score
    // Raw Score (e.g. 500) / Limit (e.g. 5) = 100
    const limit = parseInt(session.question_limit || "0");
    const rawScore = participant.score || 0;
    const normalizedScore = (limit > 0) ? Math.round(rawScore / limit) : 0;

    // 2. Prepare participant data (WITHOUT responses - Clean Separation + Normalized Score)
    const participantData = {
        id: participant.id,
        user_id: participant.user_id,
        nickname: participant.nickname,
        score: rawScore, // Saved as 0-100
        started: participant.started,
        ended: participant.ended
    };

    // 3. Prepare response data
    const participantResponses = (participant.responses || []).map((r: any) => ({
        participant_id: participant.id,
        user_id: participant.user_id,
        question_id: r.question_id,
        answer_id: r.answer_id
    }));

    // 4. Merge with existing data
    let existingParticipants: any[] = session?.participants || [];
    let existingResponses: any[] = session?.responses || [];

    // Remove old data for this participant (if exists)
    existingParticipants = existingParticipants.filter((p: any) => p.id !== participant.id);
    existingResponses = existingResponses.filter((r: any) => r.participant_id !== participant.id);

    // Add new data
    existingParticipants.push(participantData);
    existingResponses.push(...participantResponses);

    // 5. Update Main DB
    const { error: updateError } = await mainClient
        .from("game_sessions")
        .update({
            participants: existingParticipants,
            responses: existingResponses
        })
        .eq("id", sessionId);

    if (updateError) {
        console.error("Sync single participant error:", updateError);
        throw new Error("Failed to sync participant to Main DB: " + updateError.message);
    }
}

/**
 * Sync ALL participants to Main DB at once
 * Used for full game end sync
 */
async function syncAllParticipantsToMain(mainClient: any, sessionId: string, allParticipants: any[], limit: number) {
    // 1. Prepare participants data (WITHOUT responses - Clean Separation + Normalized Score)
    const participantsData = allParticipants.map((p: any) => {
        const rawScore = p.score || 0;
        const normalizedScore = (limit > 0) ? Math.round(rawScore / limit) : 0;

        return {
            id: p.id,
            user_id: p.user_id,
            nickname: p.nickname,
            score: rawScore, // Saved as 0-100
            started: p.started,
            ended: p.ended
        };
    });

    // 2. Prepare ALL responses in flat array format (New Structure)
    const allResponses: any[] = [];

    allParticipants.forEach((p: any) => {
        const participantResponses = (p.responses || []).map((r: any) => ({
            participant_id: p.id,
            user_id: p.user_id,
            question_id: r.question_id,
            answer_id: r.answer_id
        }));
        allResponses.push(...participantResponses);
    });

    // 3. Update Main DB with separated data
    const { error: updateError } = await mainClient
        .from("game_sessions")
        .update({
            participants: participantsData,
            responses: allResponses
        })
        .eq("id", sessionId);

    if (updateError) {
        console.error("Sync all participants error:", updateError);
        throw new Error("Failed to sync to Main DB: " + updateError.message);
    }

    console.log(`✅ Synced ${participantsData.length} participants (Clean, Normalized) and ${allResponses.length} responses to Main DB`);
}
