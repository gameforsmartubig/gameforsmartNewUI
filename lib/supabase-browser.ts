import { createBrowserClient } from "@supabase/ssr";
import { clientEnv, validateClientEnv } from "./env-config";
import type { Database } from "./supabase";

// Validate environment configuration
const envValidation = validateClientEnv();
if (!envValidation.isValid) {
  console.error("❌ Supabase configuration errors:");
  envValidation.errors.forEach((error) => console.error(`  - ${error}`));

  if (process.env.NODE_ENV === "production") {
    console.error("⚠️ Supabase config invalid in production - app may not function correctly");
  }
}

const supabaseUrl = clientEnv.supabase.url || "https://placeholder.supabase.co";
const supabaseAnonKey = clientEnv.supabase.anonKey || "placeholder-key";

if (supabaseUrl === "https://placeholder.supabase.co" || supabaseAnonKey === "placeholder-key") {
  console.warn("⚠️ Supabase credentials not configured. Using placeholder values.");
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
