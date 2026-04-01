"use client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback } from "react";
import { LocationSelector, LocationValue } from "@/components/ui/location-selector";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-browser";
import { Loader2, Navigation } from "lucide-react";

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

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [usernameValidation, setUsernameValidation] = useState({
    isValid: true,
    isChecking: false,
    message: ""
  });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    fullname: "",
    phone: ""
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
  const { signUp, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect jika sudah login (tapi bukan setelah baru register)
  useEffect(() => {
    if (!authLoading && user && !justRegistered) {
      const redirectPath = searchParams.get("redirect");
      const gamePin = searchParams.get("pin");
      const isExternal = isExternalGameForSmart(redirectPath);

      if (isExternal) {
        // Ambil token lalu redirect ke website 1
        supabase.auth.getSession().then(({ data }) => {
          const token = data.session?.access_token;
          if (token) {
            window.location.href = `${redirectPath}?token=${encodeURIComponent(token)}`;
          } else {
            window.location.href = redirectPath!;
          }
        });
      } else if (redirectPath && gamePin) {
        router.push(`${redirectPath}?pin=${gamePin}`);
      } else if (redirectPath) {
        router.push(redirectPath);
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router, searchParams, justRegistered]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
  const validateUsernameRealtime = useCallback(async (username: string) => {
    if (!username) {
      setUsernameValidation({ isValid: true, isChecking: false, message: "" });
      return;
    }

    if (username.length > 0 && username.length < 3) {
      setUsernameValidation({
        isValid: false,
        isChecking: false,
        message: "Username must be at least 3 characters long"
      });
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (username.length > 0 && !usernameRegex.test(username)) {
      setUsernameValidation({
        isValid: false,
        isChecking: false,
        message: "Username can only contain letters, numbers, and underscores"
      });
      return;
    }

    if (username.length >= 3) {
      setUsernameValidation({
        isValid: true,
        isChecking: true,
        message: "Checking availability..."
      });

      try {
        const { data: existingUsers, error } = await supabase
          .from("profiles")
          .select("id, username")
          .ilike("username", username);

        if (error) {
          console.error("Username check error:", error);
          setUsernameValidation({
            isValid: true,
            isChecking: false,
            message: "Username is available"
          });
          return;
        }

        const usernameExists = existingUsers?.some(
          (profile) => (profile as any).username.toLowerCase() === username.toLowerCase()
        );

        if (usernameExists) {
          setUsernameValidation({
            isValid: false,
            isChecking: false,
            message: "Username is already taken"
          });
        } else {
          setUsernameValidation({
            isValid: true,
            isChecking: false,
            message: "Username is available"
          });
        }
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
  }, []);

  // Debounced username untuk validasi
  const debouncedUsername = useDebounce(formData.username, 500);

  useEffect(() => {
    if (debouncedUsername) {
      validateUsernameRealtime(debouncedUsername);
    }
  }, [debouncedUsername, validateUsernameRealtime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!usernameValidation.isValid || usernameValidation.isChecking) {
        setError("Please enter a valid and available username");
        setLoading(false);
        return;
      }

      if (formData.username.length < 3) {
        setError("Username must be at least 3 characters long");
        setLoading(false);
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(formData.username)) {
        setError("Username can only contain letters, numbers, and underscores");
        setLoading(false);
        return;
      }

      // Final check username availability
      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", formData.username);

      if (checkError) {
        console.error("Username validation on submit error:", checkError);
      } else {
        const usernameExists = existingUsers?.some(
          (profile) => (profile as any).username.toLowerCase() === formData.username.toLowerCase()
        );

        if (usernameExists) {
          setError("Username is already taken");
          setLoading(false);
          return;
        }
      }

      setJustRegistered(true);

      try {
        await signUp(
          formData.email,
          formData.password,
          formData.username,
          formData.fullname,
          formData.fullname,
          location.countryId,
          location.stateId,
          location.cityId,
          formData.phone || null
        );

        setRegistrationSuccess(true);

        const redirectPath = searchParams.get("redirect");
        const gamePin = searchParams.get("pin");
        const isExternal = isExternalGameForSmart(redirectPath);
        const hasLocation = location.countryId !== null;

        setTimeout(async () => {
          setJustRegistered(false);

          if (!hasLocation) {
            // Profil belum lengkap → ke /required
            // Encode redirectPath agar tidak hilang (termasuk external URL)
            if (redirectPath) {
              router.push(`/required?redirect=${encodeURIComponent(redirectPath)}${gamePin ? `&pin=${gamePin}` : ""}`);
            } else {
              router.push("/required");
            }
          } else if (isExternal) {
            // Register berhasil + lokasi lengkap + external redirect
            // Ambil token terbaru lalu kirim ke website 1
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (token) {
              console.log("🔥 Register - External redirect to:", redirectPath);
              window.location.href = `${redirectPath}?token=${encodeURIComponent(token)}`;
            } else {
              // Fallback jika token tidak ada
              window.location.href = redirectPath!;
            }
          } else if (redirectPath && gamePin) {
            router.push(`${redirectPath}?pin=${gamePin}`);
          } else if (redirectPath) {
            router.push(redirectPath);
          } else {
            router.push("/dashboard");
          }
        }, 2000);
      } catch (signUpError: any) {
        console.error("SignUp error:", signUpError);
        if (signUpError.message?.includes("profiles")) {
          setError("Gagal membuat profil. Silakan coba lagi atau hubungi admin.");
        } else {
          setError(signUpError.message || "Terjadi kesalahan saat mendaftar");
        }
        setJustRegistered(false);
        setLoading(false);
        return;
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Terjadi kesalahan saat mendaftar");
      setJustRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const redirectPath = searchParams.get("redirect");
      const gamePin = searchParams.get("pin");
      const isExternal = isExternalGameForSmart(redirectPath);

      console.log("🔥 Register Google - redirectPath:", redirectPath);
      console.log("🔥 Register Google - isExternal:", isExternal);

      if (isExternal) {
        // Simpan external URL ke cookie tersendiri, callback akan membacanya
        document.cookie = `external-redirect=${encodeURIComponent(redirectPath!)}; path=/; max-age=3600; SameSite=Lax`;
      } else if (redirectPath && gamePin) {
        // Simpan internal redirect ke localStorage
        localStorage.setItem("oauth_redirect_path", redirectPath);
        localStorage.setItem("oauth_game_pin", gamePin);
      } else if (redirectPath) {
        localStorage.setItem("oauth_redirect_path", redirectPath);
      }

      const callbackUrl = `${window.location.origin}/auth/callback`;

      console.log("🔥 Register Google - callbackUrl:", callbackUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setError(error.message || "Gagal masuk dengan Google. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="base-background flex min-h-screen items-center justify-center">
      <Card className="card mx-auto w-96" style={{ "--card-border-w": "4px" } as React.CSSProperties}>
        <CardHeader>
          <div className="flex items-center justify-center">
            <img
              src="/gameforsmartlogo.png"
              alt="Logo"
              className="h-full w-11/12 cursor-pointer px-8 dark:brightness-90"
              onClick={() => router.push("https://gameforsmartnewui.vercel.app")}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="button-orange-outline w-full"
                onClick={handleGoogleSignIn}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
            </div>

            <div className="my-2">
              <div className="flex items-center gap-3">
                <div className="w-full border-t border-orange-100 dark:border-zinc-800" />
                <span className="shrink-0 text-sm font-medium text-orange-400 dark:text-zinc-500">
                  or continue with
                </span>
                <div className="w-full border-t border-orange-100 dark:border-zinc-800" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-1.5">
                <Label htmlFor="fullname" className="text-orange-900 dark:text-zinc-300">
                  Full Name
                </Label>
                <Input
                  id="fullname"
                  name="fullname"
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="username" className="text-orange-900 dark:text-zinc-300">
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className={`input w-full ${
                      formData.username
                        ? usernameValidation.isValid
                          ? "input-succes"
                          : "input-error"
                        : ""
                    }`}
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                  {formData.username && (
                    <div className="absolute top-2.5 right-4 flex items-center justify-center">
                      {usernameValidation.isChecking ? (
                        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                      ) : usernameValidation.isValid ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 dark:bg-green-600">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 dark:bg-red-600">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.username && usernameValidation.message && (
                  <p
                    className={`text-xs font-medium ${usernameValidation.isValid ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                    {usernameValidation.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <LocationSelector
                  value={location}
                  onChange={setLocation}
                  showDetectButton={false}
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={detectLocation}
                  disabled={detectingLocation || loading}
                  className="button-yellow-outline flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2">
                  {detectingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                      <span className="font-medium">Mendeteksi...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                      <span className="font-medium">Deteksi Lokasi Otomatis</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-orange-900 dark:text-zinc-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user1@abc.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-orange-900 dark:text-zinc-300">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input"
                  minLength={6}
                />
              </div>

              <Button type="submit" className="button-green w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Register"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-600 dark:text-zinc-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-orange-600 underline underline-offset-4 transition-colors hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">
                Sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}