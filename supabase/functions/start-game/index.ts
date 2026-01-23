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
//     // Client for Main Database (Default env vars provided by Supabase)
//     const supabaseClient = createClient(
//       Deno.env.get("SUPABASE_URL") ?? "",
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
//     );

//     // Client for Realtime Database (Custom env vars - YOU MUST SET THESE IN SUPABASE SECRETS)
//     // Please go to Supabase Dashboard > Project Settings > Edge Functions > Secrets
//     // And add: RT_SUPABASE_URL, RT_NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
//     const rtUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_REALTIME_URL");
//     const rtKey = Deno.env.get("NEXT_PUBLIC_SUPABASE_REALTIME_SERVICE_ROLE_KEY");

//     if (!rtUrl || !rtKey) {
//       throw new Error("Realtime Database configuration missing in Edge Function Secrets");
//     }

//     const rtClient = createClient(rtUrl, rtKey);

//     const { sessionId } = await req.json();

//     if (!sessionId) {
//       throw new Error("Session ID is required");
//     }

//     const now = new Date();
//     const countdownStart = now.toISOString();

//     // 1. Start Countdown: Update Realtime DB ONLY first (fast feedback)
//     const { error: rtStartError } = await rtClient
//       .from("game_sessions_rt")
//       .update({
//         countdown_started_at: countdownStart
//       })
//       .eq("id", sessionId);

//     if (rtStartError) throw rtStartError;

//     // 2. Wait for 10 seconds (Server-side delay)
//     await new Promise((resolve) => setTimeout(resolve, 10000));

//     const activeStart = new Date().toISOString();
//     const activeUpdate = {
//       status: "active",
//       started_at: activeStart
//     };

//     // 3. Set Status to Active in Realtime DB
//     const { error: rtActiveError } = await rtClient
//       .from("game_sessions_rt")
//       .update(activeUpdate)
//       .eq("id", sessionId);

//     if (rtActiveError) throw rtActiveError;

//     // 4. Set Status to Active in Main DB (Persistence)
//     const { error: mainActiveError } = await supabaseClient
//       .from("game_sessions")
//       .update(activeUpdate)
//       .eq("id", sessionId);

//     if (mainActiveError) throw mainActiveError;

//     return new Response(JSON.stringify({ message: "Game started successfully" }), {
//       headers: { ...corsHeaders, "Content-Type": "application/json" }
//     });
//   } catch (error) {
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 400,
//       headers: { ...corsHeaders, "Content-Type": "application/json" }
//     });
//   }
// });
