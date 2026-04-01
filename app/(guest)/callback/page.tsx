"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Helper: cek apakah URL adalah domain gameforsmart.com (website 1)
function isExternalGameForSmart(url: string | null): boolean {
  if (!url) return false;
  return (
    url.startsWith("https://gameforsmart.com")
  );
}

// Helper: baca nilai cookie berdasarkan nama
function getCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

// Helper: hapus cookie
function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Memproses login...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus("Memverifikasi session...");

        // Handle hash fragment dari OAuth redirect
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");

        console.log("🔥 Hash params:", window.location.hash);
        console.log("🔥 Access token from hash:", accessToken ? "Found" : "Not found");

        if (accessToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || ""
          });

          if (sessionError) {
            console.error("Error setting session from hash:", sessionError);
            throw sessionError;
          }

          console.log("🔥 Session set from hash successfully");
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error auth callback:", error);
          setStatus("Gagal memverifikasi session");
          setIsError(true);
          setTimeout(() => {
            router.push("/login?error=Authentication failed");
          }, 2000);
          return;
        }

        if (data.session) {
          setStatus("Menyiapkan profil...");
          await ensureUserProfile(data.session.user);

          // Baca redirect dari URL params
          let redirectPath = searchParams.get("redirect");
          let gamePin = searchParams.get("pin");

          // Fallback ke localStorage jika tidak ada di URL (OAuth flow)
          if (!redirectPath || !gamePin) {
            redirectPath = redirectPath || localStorage.getItem("oauth_redirect_path");
            gamePin = gamePin || localStorage.getItem("oauth_game_pin");

            if (redirectPath || gamePin) {
              localStorage.removeItem("oauth_redirect_path");
              localStorage.removeItem("oauth_game_pin");
            }
          }

          // Baca cookie external-redirect (disimpan saat Google login dari external URL)
          const externalRedirectUrl = getCookie("external-redirect");
          if (externalRedirectUrl) {
            deleteCookie("external-redirect");
            console.log("🔥 Found external-redirect cookie:", externalRedirectUrl);
          }

          console.log("🔥 Callback - redirectPath:", redirectPath);
          console.log("🔥 Callback - gamePin:", gamePin);
          console.log("🔥 Callback - externalRedirectUrl:", externalRedirectUrl);

          // Cek kelengkapan profil
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, country_id")
            .eq("auth_user_id", data.session.user.id)
            .single();

          const safeProfile = profile as any;

          // Simpan profile ID ke localStorage
          if (safeProfile?.id) {
            localStorage.setItem("user_id", safeProfile.id);
          }

          const hasValidUsername =
            safeProfile?.username &&
            !safeProfile.username.includes("@") &&
            !safeProfile.username.startsWith("user_") &&
            safeProfile.username.length >= 3;
          const hasLocation =
            safeProfile?.country_id !== null && safeProfile?.country_id !== undefined;

          if (!hasValidUsername || !hasLocation) {
            // Profil belum lengkap → ke /required
            setStatus("Lengkapi profil Anda...");

            // Jika ada external redirect, simpan ke localStorage supaya tidak hilang
            if (externalRedirectUrl) {
              localStorage.setItem("pending_external_redirect", externalRedirectUrl);
            }

            if (redirectPath && gamePin) {
              console.log("🔥 Redirecting to /required with redirect + pin");
              router.push(`/required?redirect=${encodeURIComponent(redirectPath)}&pin=${gamePin}`);
            } else if (redirectPath) {
              console.log("🔥 Redirecting to /required with redirect");
              router.push(`/required?redirect=${encodeURIComponent(redirectPath)}`);
            } else {
              console.log("🔥 Redirecting to /required");
              router.push("/required");
            }
          } else if (externalRedirectUrl) {
            // Profil lengkap + ada external redirect dari Google OAuth
            setStatus("Berhasil! Mengarahkan ke halaman pendaftaran...");
            const token = data.session.access_token;
            console.log("🔥 Redirecting externally to:", externalRedirectUrl);
            window.location.href = `${externalRedirectUrl}?token=${encodeURIComponent(token)}`;
          } else if (redirectPath && gamePin) {
            setStatus("Berhasil! Mengarahkan ke game...");
            console.log("🔥 Redirecting to:", `${redirectPath}?pin=${gamePin}`);
            router.push(`${redirectPath}?pin=${gamePin}`);
          } else if (redirectPath) {
            setStatus("Berhasil! Mengarahkan...");
            console.log("🔥 Redirecting to:", redirectPath);
            router.push(redirectPath);
          } else {
            setStatus("Berhasil! Mengarahkan ke dashboard...");
            console.log("🔥 Redirecting to: /dashboard");
            router.push("/dashboard");
          }
        } else {
          setStatus("Session tidak ditemukan");
          setIsError(true);
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
      } catch (error) {
        console.error("Error in auth callback:", error);
        setStatus("Terjadi kesalahan saat memproses login");
        setIsError(true);
        setTimeout(() => {
          router.push("/login?error=Callback processing failed");
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  // Buat profil baru jika belum ada (untuk OAuth user)
  const ensureUserProfile = async (user: any) => {
    if (!user) return;

    try {
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        console.log("Creating new profile for OAuth user");

        let username = "";
        if (user.email) {
          username = user.email.split("@")[0];

          const { data: usernameExists } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", username)
            .single();

          if (usernameExists) {
            username = `${username}${Math.floor(Math.random() * 1000)}`;
          }
        } else {
          username = `user_${Math.floor(Math.random() * 10000)}`;
        }

        const fullname = user.user_metadata?.full_name || user.user_metadata?.name || username;

        const profileData: any = {
          auth_user_id: user.id,
          username: username,
          email: user.email || "",
          fullname: fullname || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase.from("profiles").insert(profileData);

        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        } else {
          console.log("Profile created successfully for user:", user.id);
        }
      } else if (profileError) {
        console.error("Error checking existing profile:", profileError);
        throw profileError;
      }
    } catch (error) {
      console.error("Error ensuring user profile:", error);
      throw error;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50/50">
      <div className="mx-auto max-w-md rounded-3xl border border-orange-100 bg-white/40 p-8 text-center shadow-xl shadow-orange-100/20 backdrop-blur-sm">
        {!isError ? (
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-t-4 border-b-4 border-orange-500"></div>
            <div className="animate-spin-slow absolute inset-2 rounded-full border-r-4 border-l-4 border-yellow-400 opacity-50"></div>
          </div>
        ) : (
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-100 bg-red-50">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        )}

        <h2 className={`text-xl font-bold ${isError ? "text-red-600" : "text-orange-600"}`}>
          {status}
        </h2>

        {isError ? (
          <p className="mt-3 text-sm text-gray-500">
            Terjadi kendala. Anda akan diarahkan kembali dalam beberapa detik...
          </p>
        ) : (
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-green-400"></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:-0.15s]"></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-yellow-400 [animation-delay:-0.3s]"></span>
            <p className="ml-1 text-xs font-medium tracking-widest text-gray-400 uppercase">
              Processing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-orange-50/30">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-yellow-200 border-t-orange-500"></div>
            <p className="animate-pulse font-medium text-orange-600">Memuat halaman...</p>
          </div>
        </div>
      }>
      <AuthCallbackPageContent />
    </Suspense>
  );
}
