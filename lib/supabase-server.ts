import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { clientEnv } from "./env-config";
import type { Database } from "./database.types";

export const createClient = async () => {
  const cookieStore = await cookies();
  const host = (await headers()).get("host") || "";

  // Environment Checks
  const isProdDomain = host.endsWith("gameforsmart.com");
  const isVercel = host.endsWith(".vercel.app");
  const isNgrok = host.includes("ngrok-free.app") || host.includes("ngrok.io");
  
  // Cookie secure only on HTTPS domains
  const isSecureContext = isProdDomain || isVercel || isNgrok;

  return createServerClient<Database>(
    clientEnv.supabase.url || "",
    clientEnv.supabase.anonKey || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = {
                ...options,
                secure: isSecureContext,
                sameSite: "lax" as const,
                ...(isProdDomain && { domain: ".gameforsmart.com" })
              };
              cookieStore.set(name, value, cookieOptions);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        }
      }
    }
  );
};
