// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
// };

// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     // 1. Initialize Clients

//     // Realtime DB (Self - Default Env Vars)
//     // The function is deployed to the RT project, so default vars point to RT DB.
//     const rtUrl = Deno.env.get("SUPABASE_URL");
//     const rtKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

//     // Main DB (Persistence - Custom Secrets)
//     // USER MUST SET THESE SECRETS IN DASHBOARD: MAIN_DB_URL, MAIN_DB_SERVICE_ROLE_KEY
//     const mainUrl = Deno.env.get("MAIN_DB_URL");
//     const mainKey = Deno.env.get("MAIN_DB_SERVICE_ROLE_KEY");

//     if (!rtUrl || !rtKey) throw new Error("RT Config Missing (Default Env)");
//     if (!mainUrl || !mainKey) throw new Error("Main DB Config Missing (Check Secrets)");

//     const rtClient = createClient(rtUrl, rtKey);
//     const mainClient = createClient(mainUrl, mainKey);

//     // 2. Parse Body
//     // action: 'submit' | 'end' | 'cron'
//     const { action, sessionId, participantId } = await req.json();

//     if (!sessionId) throw new Error("Session ID Required");

//     // ===========================================
//     // LOGIC: SUBMIT (Player)
//     // ===========================================
//     if (action === "submit") {
//       if (!participantId) throw new Error("Participant ID Required for Submit");

//       // A. Lock & Get Session Info (RT)
//       const { data: session, error: sessError } = await rtClient
//         .from("game_sessions_rt")
//         .select("status, game_end_mode, participant_count:game_participants_rt(count)")
//         .eq("id", sessionId)
//         .single();

//       if (sessError || !session) throw new Error("Session not found (RT)");

//       // B. Mark Player as Ended (RT) + Calculate Score
//       const now = new Date().toISOString();

//       // 1. Calculate Score (Function RPC on RT)
//       // UPDATED NAME: calculate_score_new_rt
//       const { error: scoreError } = await rtClient.rpc("calculate_score_new_rt", {
//         p_session_id: sessionId,
//         p_participant_id: participantId
//       });
//       if (scoreError) console.error("Score Calc Error:", scoreError);

//       // 2. Update 'ended' timestamp
//       const { data: updatedPart, error: partError } = await rtClient
//         .from("game_participants_rt")
//         .update({ ended: now })
//         .eq("id", participantId)
//         .select() // Get the full updated row with score
//         .single();

//       if (partError) throw partError;

//       // C. Handle Game End Modes
//       const mode = session.game_end_mode || "manual";

//       if (mode === "first_finish") {
//         // --- FIRST FINISH MODE ---
//         // End the game for EVERYONE immediately
//         await runEndGameLogic(rtClient, mainClient, sessionId);

//         return new Response(JSON.stringify({ status: "finished", mode: "first_finish" }), {
//           headers: { ...corsHeaders, "Content-Type": "application/json" }
//         });
//       } else if (mode === "wait_timer") {
//         // --- WAIT TIMER MODE ---
//         // Check if ALL participants have finished
//         const { count: finishedCount } = await rtClient
//           .from("game_participants_rt")
//           .select("id", { count: "exact", head: true })
//           .eq("session_id", sessionId)
//           .not("ended", "is", null);

//         const { count: totalCount } = await rtClient
//           .from("game_participants_rt")
//           .select("id", { count: "exact", head: true })
//           .eq("session_id", sessionId);

//         if (totalCount && finishedCount && finishedCount >= totalCount) {
//           // ALL DONE -> End Game Full Sync
//           await runEndGameLogic(rtClient, mainClient, sessionId);
//           return new Response(JSON.stringify({ status: "finished", mode: "wait_timer_all_done" }), {
//             headers: { ...corsHeaders, "Content-Type": "application/json" }
//           });
//         } else {
//           // NOT ALL DONE -> Sync ONLY this participant to Main DB
//           // This safeguards data without closing session
//           await syncParticipantsToMain(mainClient, sessionId, [updatedPart]);

//           return new Response(JSON.stringify({ status: "active", mode: "wait_timer_partial" }), {
//             headers: { ...corsHeaders, "Content-Type": "application/json" }
//           });
//         }
//       }

//       // Default: Just return success, no status change
//       return new Response(JSON.stringify({ status: "active", mode: "manual" }), {
//         headers: { ...corsHeaders, "Content-Type": "application/json" }
//       });
//     }

//     // ===========================================
//     // LOGIC: END (Host Manual) / CRON
//     // ===========================================
//     if (action === "end" || action === "cron") {
//       await runEndGameLogic(rtClient, mainClient, sessionId);
//       return new Response(JSON.stringify({ message: "Game Ended & Synced" }), {
//         headers: { ...corsHeaders, "Content-Type": "application/json" }
//       });
//     }

//     throw new Error("Invalid Action");
//   } catch (error: any) {
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 400,
//       headers: { ...corsHeaders, "Content-Type": "application/json" }
//     });
//   }
// });

// // ============================================================
// // HELPERS
// // ============================================================

// async function runEndGameLogic(rtClient: any, mainClient: any, sessionId: string) {
//   const now = new Date().toISOString();

//   // 1. Update Session Status to FINISHED (RT)
//   await rtClient
//     .from("game_sessions_rt")
//     .update({ status: "finished", ended_at: now })
//     .eq("id", sessionId);

//   // 2. Mark any unfinished players as ended (RT)
//   await rtClient
//     .from("game_participants_rt")
//     .update({ ended: now })
//     .eq("session_id", sessionId)
//     .is("ended", null);

//   // 3. Calculate Scores for ALL (RT RPC)
//   await rtClient.rpc("calculate_score_new_rt", {
//     p_session_id: sessionId,
//     p_participant_id: null // All
//   });

//   // 4. Fetch ALL Participants (RT)
//   const { data: allParticipants } = await rtClient
//     .from("game_participants_rt")
//     .select("*")
//     .eq("session_id", sessionId);

//   if (allParticipants && allParticipants.length > 0) {
//     // 5. Sync to Main DB (RPC Merge)
//     // Ensure data shape matches what Main DB expects in JSONB
//     // User example: id, ended, score, started, user_id, nickname
//     const formattedData = allParticipants.map((p: any) => ({
//       id: p.id,
//       ended: p.ended,
//       score: p.score,
//       started: p.started,
//       user_id: p.user_id,
//       nickname: p.nickname,
//       // Add responses if needed for history, user showed structure with responses in separate example?
//       // "Contoh struktur JSONB responses" implies specific needs, but merge example used participant structure.
//       // Let's include everything important.
//       responses: p.responses
//     }));

//     await syncParticipantsToMain(mainClient, sessionId, formattedData);
//   }

//   // 6. Update Session Status in Main DB
//   await mainClient
//     .from("game_sessions")
//     .update({ status: "finished", ended_at: now })
//     .eq("id", sessionId);
// }

// async function syncParticipantsToMain(mainClient: any, sessionId: string, participantsData: any[]) {
//   // Call the Main DB RPC to merge
//   const { error } = await mainClient.rpc("merge_session_participants_main", {
//     p_session_id: sessionId,
//     p_new_data: participantsData
//   });

//   if (error) {
//     console.error("Merge Params:", { sessionId, participantsData });
//     console.error("Merge Error:", error);
//     throw new Error("Failed to sync to Main DB: " + error.message);
//   }
// }
