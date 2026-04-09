import { createBrowserClient } from "@supabase/ssr";
import { clientEnv, validateClientEnv } from "./env-config";

// ============================================================
// SHARED SESSION via COOKIE (SSO antar subdomain)
// ============================================================

/**
 * Simpan access_token + refresh_token ke shared cookie (.gameforsmart.com)
 * Format: access_token|refresh_token (~1.5KB, aman di bawah batas 4KB)
 */
export function syncSessionCookie(tokens: { access_token: string; refresh_token: string } | null) {
  if (typeof document === 'undefined') return;
  const hostname = window.location.hostname;
  const isGfs = hostname.endsWith('gameforsmart.com');
  const isHttps = window.location.protocol === 'https:';

  if (!tokens) {
    // Hapus cookie
    let cookieStr = `gfs-session=; path=/; max-age=0`;
    if (isGfs) cookieStr += `; domain=.gameforsmart.com`;
    document.cookie = cookieStr;
    return;
  }

  const value = `${tokens.access_token}|${tokens.refresh_token}`;
  const parts = [
    `gfs-session=${encodeURIComponent(value)}`,
    `path=/`,
    `max-age=${60 * 60 * 24 * 365}`,
    `SameSite=Lax`,
  ];
  if (isGfs) parts.push(`domain=.gameforsmart.com`);
  if (isHttps) parts.push(`Secure`);
  document.cookie = parts.join('; ');
}

/**
 * Baca access_token + refresh_token dari shared cookie
 */
export function getSessionFromCookie(): { access_token: string; refresh_token: string } | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  const found = cookies.find(c => c.startsWith('gfs-session='));
  if (!found) return null;
  try {
    const eqIndex = found.indexOf('=');
    const value = decodeURIComponent(found.substring(eqIndex + 1));
    const pipeIndex = value.indexOf('|');
    if (pipeIndex === -1) return null;
    const access_token = value.substring(0, pipeIndex);
    const refresh_token = value.substring(pipeIndex + 1);
    if (!access_token || !refresh_token) return null;
    return { access_token, refresh_token };
  } catch {
    return null;
  }
}

import type { Database } from "./database.types";

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
