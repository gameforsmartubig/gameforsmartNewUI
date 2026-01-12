import { createClient } from "@supabase/supabase-js";
import { Database } from "./supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_REALTIME_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_REALTIME_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase Realtime credentials not configured. Please set NEXT_PUBLIC_SUPABASE_REALTIME_URL and NEXT_PUBLIC_SUPABASE_REALTIME_ANON_KEY."
  );
}

// Client for the secondary "Realtime" database
export const supabaseRealtime = createClient<Database>(supabaseUrl || "", supabaseAnonKey || "", {
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
