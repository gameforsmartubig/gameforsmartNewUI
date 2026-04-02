"use client";

import type React from "react";
import { useState, useEffect, useCallback, Suspense, useActionState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { User, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-browser";
import { LocationSelector, type LocationValue } from "@/components/ui/location-selector";
import { updateProfileAction, checkUsernameAction } from "@/app/service/profile";

// Helper: cek apakah URL adalah domain gameforsmart.com (website 1)
function isExternalGameForSmart(url: string | null): boolean {
  if (!url) return false;
  return (
    url.startsWith("https://gameforsmart.com") ||
    url.startsWith("http://gameforsmart.com")
  );
}

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function Page() {
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
      <RequiredPage />
    </Suspense>
  );
}

function RequiredPage() {
  const [errorLocal, setErrorLocal] = useState("");
  const [username, setUsername] = useState("");
  const [usernameValidation, setUsernameValidation] = useState({
    isValid: true,
    isChecking: false,
    message: ""
  });
  const [location, setLocation] = useState<LocationValue>({
    countryId: null,
    stateId: null,
    cityId: null,
    countryName: "",
    stateName: "",
    cityName: "",
    latitude: null,
    longitude: null
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPendingTrans, startTransition] = useTransition();

  const [state, formAction, isPendingForm] = useActionState(updateProfileAction, null);

  // Helper: handle redirect after save
  const handleRedirectAfterSave = async () => {
    const redirectPath = searchParams.get("redirect") || "/dashboard";
    const gamePin = searchParams.get("pin");
    const isExternal = isExternalGameForSmart(redirectPath);
    const pendingExternal = localStorage.getItem("pending_external_redirect");

    if (isExternal || pendingExternal) {
      const targetUrl = pendingExternal || redirectPath;
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        localStorage.removeItem("pending_external_redirect");
        if (token) {
          console.log("🔥 Required - Redirecting externally to:", targetUrl);
          window.location.href = `${targetUrl}?token=${encodeURIComponent(token)}`;
        } else {
          window.location.href = targetUrl;
        }
      } catch {
        window.location.href = targetUrl;
      }
    } else {
      const url = redirectPath && gamePin ? `${redirectPath}?pin=${gamePin}` : redirectPath;
      console.log("🔥 Required - Redirecting to:", url);
      router.push(url);
    }
  };

  // Monitor form action results
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      // Refresh profile in background (for UI), but redirect immediately
      refreshProfile().catch(console.error);
      handleRedirectAfterSave();
    } else if (state?.error) {
      setErrorLocal(state.error);
    }
  }, [state?.success, state?.error, state?.message]);

  // Initialize username dan location dari profil yang sudah ada
  useEffect(() => {
    if (profile) {
      if (
        profile.username &&
        !profile.username.includes("@") &&
        !profile.username.startsWith("user_")
      ) {
        setUsername(profile.username);
      }

      if (profile.country_id) {
        setLocation((prev) => ({
          ...prev,
          countryId: profile.country_id,
          countryName: profile.countries?.name || ""
        }));
      }
    }
  }, [profile]);

  // Redirect jika profil sudah lengkap
  useEffect(() => {
    if (!authLoading && profile) {
      const hasValidUsername =
        profile.username &&
        !profile.username.includes("@") &&
        !profile.username.startsWith("user_") &&
        profile.username.length >= 3;

      const hasLocation = profile.country_id !== null;

      if (hasValidUsername && hasLocation && (!state || state.success)) {
        const redirectPath = searchParams.get("redirect") || "/dashboard";
        const gamePin = searchParams.get("pin");
        const isExternal = isExternalGameForSmart(redirectPath);

        if (isExternal) {
          // Cek juga pending_external_redirect dari localStorage (dari Google OAuth flow)
          const pendingExternal =
            localStorage.getItem("pending_external_redirect") || redirectPath;

          supabase.auth.getSession().then(({ data }) => {
            const token = data.session?.access_token;
            if (token) {
              localStorage.removeItem("pending_external_redirect");
              console.log("🔥 Required - External redirect to:", pendingExternal);
              window.location.href = `${pendingExternal}?token=${encodeURIComponent(token)}`;
            } else {
              // Fallback jika tidak ada token
              window.location.href = pendingExternal;
            }
          });
        } else {
          // Cek apakah ada pending_external_redirect di localStorage
          // (bisa terjadi jika user masuk via Google OAuth lalu ke /required)
          const pendingExternal = localStorage.getItem("pending_external_redirect");

          if (pendingExternal) {
            supabase.auth.getSession().then(({ data }) => {
              const token = data.session?.access_token;
              if (token) {
                localStorage.removeItem("pending_external_redirect");
                console.log("🔥 Required - Pending external redirect to:", pendingExternal);
                window.location.href = `${pendingExternal}?token=${encodeURIComponent(token)}`;
              } else {
                localStorage.removeItem("pending_external_redirect");
                window.location.href = pendingExternal;
              }
            });
          } else {
            // Internal redirect seperti biasa
            const url =
              redirectPath && gamePin ? `${redirectPath}?pin=${gamePin}` : redirectPath;
            console.log("🔥 Required - Internal redirect to:", url);
            router.push(url);
          }
        }
      }
    }
  }, [
    authLoading,
    profile?.id,
    profile?.username,
    profile?.country_id,
    router,
    searchParams,
    state?.success
  ]);

  // Redirect ke login jika belum authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Bawa redirect URL supaya tidak hilang setelah login
      const redirectPath = searchParams.get("redirect");
      const pendingExternal = localStorage.getItem("pending_external_redirect");
      const targetRedirect = redirectPath || pendingExternal;

      if (targetRedirect) {
        router.push(`/auth/login?redirect=${encodeURIComponent(targetRedirect)}`);
      } else {
        router.push("/auth/login");
      }
    }
  }, [authLoading, user, router, searchParams]);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung geolocation");
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `/api/locations/reverse-geocode?lat=${latitude}&lon=${longitude}`
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Gagal mendeteksi lokasi");
          }

          const data = await response.json();

          if (data.success) {
            setLocation({
              countryId: data.country?.id || null,
              stateId: data.state?.id || null,
              cityId: data.city?.id || null,
              countryName: data.country?.name || "",
              stateName: data.state?.name || "",
              cityName: data.city?.name || "",
              latitude:
                data.city?.latitude || data.state?.latitude || data.country?.latitude || latitude,
              longitude:
                data.city?.longitude ||
                data.state?.longitude ||
                data.country?.longitude ||
                longitude
            });

            const locationParts = [data.city?.name, data.state?.name, data.country?.name].filter(
              Boolean
            );
            toast.success(`Lokasi terdeteksi: ${locationParts.join(", ")}`);
          } else {
            throw new Error("Gagal mendeteksi lokasi");
          }
        } catch (error: any) {
          console.error("Error detecting location:", error);
          toast.error(error.message || "Gagal mendeteksi lokasi");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Izin lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Informasi lokasi tidak tersedia");
            break;
          case error.TIMEOUT:
            toast.error("Waktu permintaan lokasi habis");
            break;
          default:
            toast.error("Gagal mendapatkan lokasi");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, []);

  // Real-time username validation
  const validateUsernameRealtime = useCallback(
    async (usernameToCheck: string) => {
      if (!usernameToCheck) {
        setUsernameValidation({ isValid: true, isChecking: false, message: "" });
        return;
      }

      if (usernameToCheck.length < 3) {
        setUsernameValidation({
          isValid: false,
          isChecking: false,
          message: "Username must be at least 3 characters"
        });
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/;

      if (usernameToCheck.length > 0 && !usernameRegex.test(usernameToCheck)) {
        setUsernameValidation({
          isValid: false,
          isChecking: false,
          message: "Username can only contain letters, numbers, and underscores"
        });
        return;
      }

      if (usernameToCheck.length >= 3) {
        setUsernameValidation({
          isValid: true,
          isChecking: true,
          message: "Checking availability..."
        });

        try {
          const result = await checkUsernameAction(usernameToCheck, profile?.id);

          setUsernameValidation({
            isValid: result.isValid,
            isChecking: false,
            message: result.message
          });
        } catch (err) {
          console.error("Username validation catch error:", err);
          setUsernameValidation({
            isValid: true,
            isChecking: false,
            message: "Username is available"
          });
        }
      } else {
        setUsernameValidation({ isValid: true, isChecking: false, message: "" });
      }
    },
    [profile?.id]
  );

  const debouncedUsername = useDebounce(username, 500);

  useEffect(() => {
    if (debouncedUsername) {
      validateUsernameRealtime(debouncedUsername);
    }
  }, [debouncedUsername, validateUsernameRealtime]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorLocal("");

    if (!usernameValidation.isValid || usernameValidation.isChecking) {
      setErrorLocal("Please enter a valid and available username");
      return;
    }

    if (!location.countryId) {
      setErrorLocal("Please select your country");
      return;
    }

    // Build FormData explicitly from React state (don't rely on hidden inputs)
    const formData = new FormData();
    formData.set("currentUserId", (profile as any).id);
    formData.set("username", username);
    formData.set("countryId", String(location.countryId || ""));
    formData.set("stateId", String(location.stateId || ""));
    formData.set("cityId", String(location.cityId || ""));

    console.log("🔥 Required - Submitting FormData:", {
      currentUserId: (profile as any).id,
      username,
      countryId: location.countryId,
      stateId: location.stateId,
      cityId: location.cityId
    });

    startTransition(() => {
      formAction(formData);
    });
  };

  const isSaving = isPendingForm || isPendingTrans;

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f5f4]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-teal-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Jangan render jika belum authenticated
  if (!user || !profile) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f5f4] p-4">
      <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg">
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Welcome!</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="currentUserId" value={profile.id} />
            <input type="hidden" name="countryId" value={location.countryId || ""} />
            <input type="hidden" name="stateId" value={location.stateId || ""} />
            <input type="hidden" name="cityId" value={location.cityId || ""} />

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="font-medium text-amber-600">
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="@username (use _ not space or -)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`h-10 rounded-none border-0 border-b-2 bg-transparent px-0 focus-visible:ring-0 ${
                    username
                      ? usernameValidation.isValid
                        ? "border-green-500"
                        : "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                />
                {username && (
                  <div className="absolute top-2 right-0 flex h-5 w-5 items-center justify-center">
                    {usernameValidation.isChecking ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : usernameValidation.isValid ? (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Username can only contain letters, numbers, and underscores (3-20 characters). No
                spaces or hyphens allowed.
              </p>
              {username && usernameValidation.message && (
                <p
                  className={`text-sm ${
                    usernameValidation.isValid ? "text-green-600" : "text-red-600"
                  }`}>
                  {usernameValidation.message}
                </p>
              )}
            </div>

            {/* Location Selector */}
            <LocationSelector value={location} onChange={setLocation} showDetectButton={false} />

            {/* Auto-Detect Location Button */}
            <Button
              type="button"
              variant="outline"
              onClick={detectLocation}
              disabled={detectingLocation || isSaving}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50">
              {detectingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Detecting location...</span>
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  <span className="font-medium">Auto-Detect Location</span>
                </>
              )}
            </Button>

            {errorLocal && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-center text-sm text-red-600">{errorLocal}</p>
              </div>
            )}

            {/* Save Button */}
            <SubmitButton
              isValid={
                !usernameValidation.isValid || usernameValidation.isChecking || !location.countryId
              }
              isSaving={isSaving}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SubmitButton({ isValid, isSaving }: { isValid: boolean; isSaving: boolean }) {
  return (
    <Button
      type="submit"
      className="h-12 w-full rounded-xl bg-teal-500 font-semibold text-white shadow-md transition-all duration-300 hover:bg-teal-600 hover:shadow-lg"
      disabled={isSaving || isValid}>
      {isSaving ? "Saving..." : "Save"}
    </Button>
  );
}