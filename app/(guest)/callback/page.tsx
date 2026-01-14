"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Memproses login...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Proses callback OAuth dari provider
    const handleAuthCallback = async () => {
      try {
        setStatus("Memverifikasi session...");

        // Handle hash fragment from OAuth redirect
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");

        console.log("🔥 Hash params:", window.location.hash);
        console.log("🔥 Access token from hash:", accessToken ? "Found" : "Not found");

        // If we have access token in hash, exchange it for session
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
          // Cek apakah user sudah memiliki profil
          await ensureUserProfile(data.session.user);

          // Check if there's a redirect parameter with game PIN from URL or localStorage
          let redirectPath = searchParams.get("redirect");
          let gamePin = searchParams.get("pin");

          // If not in URL, check localStorage (for OAuth flow)
          if (!redirectPath || !gamePin) {
            redirectPath = localStorage.getItem("oauth_redirect_path");
            gamePin = localStorage.getItem("oauth_game_pin");

            // Clean up localStorage after reading
            if (redirectPath && gamePin) {
              localStorage.removeItem("oauth_redirect_path");
              localStorage.removeItem("oauth_game_pin");
            }
          }

          console.log("🔥 Callback - redirectPath:", redirectPath);
          console.log("🔥 Callback - gamePin:", gamePin);

          // Check profile completeness for dashboard redirection
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, country_id")
            .eq("auth_user_id", data.session.user.id)
            .single();

          // Check if profile needs completion (username or location missing)
          const hasValidUsername =
            profile?.username &&
            !profile.username.includes("@") &&
            !profile.username.startsWith("user_") &&
            profile.username.length >= 3;
          const hasLocation = profile?.country_id !== null && profile?.country_id !== undefined;

          if (!hasValidUsername || !hasLocation) {
            // Redirect to required page to complete profile
            setStatus("Lengkapi profil Anda...");
            if (redirectPath && gamePin) {
              console.log("🔥 Redirecting to /required with callback");
              router.push(`/required?redirect=${redirectPath}&pin=${gamePin}`);
            } else {
              console.log("🔥 Redirecting to /required");
              router.push("/required");
            }
          } else if (redirectPath && gamePin) {
            setStatus("Berhasil! Mengarahkan ke game...");
            console.log("🔥 Redirecting to:", `${redirectPath}?pin=${gamePin}`);
            router.push(`${redirectPath}?pin=${gamePin}`);
          } else {
            setStatus("Berhasil! Mengarahkan ke dashboard...");
            console.log("🔥 Redirecting to: /dashboard");
            router.push("/dashboard");
          }
        } else {
          setStatus("Session tidak ditemukan");
          setIsError(true);
          // Tidak ada session, kembali ke login
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

  // Fungsi untuk memastikan user memiliki profil
  const ensureUserProfile = async (user: any) => {
    if (!user) return;

    try {
      // Cek apakah profil sudah ada
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      // Jika profil tidak ditemukan, buat profil baru
      if (profileError && profileError.code === "PGRST116") {
        console.log("Creating new profile for OAuth user");

        // Ekstrak username dari email
        let username = "";
        if (user.email) {
          username = user.email.split("@")[0];

          // Tambahkan angka random jika username sudah ada
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

        // Buat profil baru dengan semua field yang diperlukan
        // NOTE: Don't pass 'id' - the trigger will auto-generate XID
        // Pass 'auth_user_id' to link with auth.users table
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-md p-6 text-center">
        {!isError ? (
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        ) : (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
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
        <p className={`${isError ? "text-red-600" : "text-blue-600"} font-medium`}>{status}</p>
        {isError && (
          <p className="mt-2 text-sm text-gray-500">
            Anda akan diarahkan kembali dalam beberapa detik...
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }>
      <AuthCallbackPageContent />
    </Suspense>
  );
}
