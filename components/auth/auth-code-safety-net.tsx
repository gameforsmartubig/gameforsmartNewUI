"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function AuthCodeSafetyNet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    // If we landed on Homepage ("/") but have an Auth Code,
    // it means Supabase Redirect fallback kicked in.
    // We must manually forward this code to our Callback Handler.
    if (code) {
      console.log("🛡️ AuthSafetyNet: Detected auth code on homepage. Redirecting to callback...");
      const callbackUrl = `/auth/callback?code=${code}`;
      router.replace(callbackUrl);
    }
  }, [code, router]);

  return null; // Invisible component
}
