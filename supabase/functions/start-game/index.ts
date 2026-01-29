// @ts-nocheck - Deno runtime, not Node.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Client for Main Database (Default env vars provided by Supabase)
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Client for Realtime Database (Custom env vars - YOU MUST SET THESE IN SUPABASE SECRETS)
        // Please go to Supabase Dashboard > Project Settings > Edge Functions > Secrets
        // And add: NEXT_PUBLIC_SUPABASE_REALTIME_URL, NEXT_PUBLIC_SUPABASE_REALTIME_SERVICE_ROLE_KEY
        const rtUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_REALTIME_URL");
        const rtKey = Deno.env.get("NEXT_PUBLIC_SUPABASE_REALTIME_SERVICE_ROLE_KEY");

        const { sessionId } = await req.json();

        if (!sessionId) {
            throw new Error("Session ID is required");
        }

        const now = new Date();
        const countdownStart = now.toISOString();

        // Check if Realtime DB is configured
        if (rtUrl && rtKey) {
            const rtClient = createClient(rtUrl, rtKey);

            // 1. Start Countdown: Update Realtime DB first (fast feedback)
            const { error: rtStartError } = await rtClient
                .from("game_sessions_rt")
                .update({
                    countdown_started_at: countdownStart
                })
                .eq("id", sessionId);

            if (rtStartError) {
                console.error("RT DB update error:", rtStartError);
                // Continue anyway - will use main DB
            }

            // 2. Wait for 10 seconds (Server-side delay)
            await new Promise((resolve) => setTimeout(resolve, 10000));

            const activeStart = new Date().toISOString();
            const activeUpdate = {
                status: "active",
                started_at: activeStart
            };

            // 3. Set Status to Active in Realtime DB
            const { error: rtActiveError } = await rtClient
                .from("game_sessions_rt")
                .update(activeUpdate)
                .eq("id", sessionId);

            if (rtActiveError) {
                console.error("RT DB active update error:", rtActiveError);
            }

            // 4. Set Status to Active in Main DB (Persistence)
            const { error: mainActiveError } = await supabaseClient
                .from("game_sessions")
                .update(activeUpdate)
                .eq("id", sessionId);

            if (mainActiveError) throw mainActiveError;
        } else {
            // No Realtime DB configured - use Main DB only
            console.log("No RT DB configured, using Main DB only");

            // 1. Start Countdown in Main DB
            const { error: mainCountdownError } = await supabaseClient
                .from("game_sessions")
                .update({
                    countdown_started_at: countdownStart
                })
                .eq("id", sessionId);

            if (mainCountdownError) throw mainCountdownError;

            // 2. Wait for 10 seconds
            await new Promise((resolve) => setTimeout(resolve, 10000));

            // 3. Set Status to Active in Main DB
            const activeStart = new Date().toISOString();
            const { error: mainActiveError } = await supabaseClient
                .from("game_sessions")
                .update({
                    status: "active",
                    started_at: activeStart
                })
                .eq("id", sessionId);

            if (mainActiveError) throw mainActiveError;
        }

        return new Response(JSON.stringify({ message: "Game started successfully" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Start game error:", error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
