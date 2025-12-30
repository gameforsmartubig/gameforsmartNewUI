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
import { supabase } from "@/lib/supabase";
import { Loader2, Navigation } from "lucide-react";

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

  // Redirect if already logged in (but not immediately after registration)
  useEffect(() => {
    if (!authLoading && user && !justRegistered) {
      // Only redirect existing users, not newly registered ones
      const redirectPath = searchParams.get("redirect");
      const gamePin = searchParams.get("pin");

      if (redirectPath && gamePin) {
        router.push(`${redirectPath}?pin=${gamePin}`);
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

  // Real-time username validation function
  const validateUsernameRealtime = useCallback(async (username: string) => {
    if (!username) {
      setUsernameValidation({ isValid: true, isChecking: false, message: "" });
      return;
    }

    // Basic format validation
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
          // If table doesn't exist or there's a database error, assume username is available
          // This handles the case when database is empty or table is not yet created
          setUsernameValidation({
            isValid: true,
            isChecking: false,
            message: "Username is available"
          });
          return;
        }

        const usernameExists = existingUsers?.some(
          (profile) => profile.username.toLowerCase() === username.toLowerCase()
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
        // On any error, assume username is available
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

  // Debounced username for validation
  const debouncedUsername = useDebounce(formData.username, 500);

  // Effect to trigger username validation when debounced username changes
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
      // Validate username before proceeding
      if (!usernameValidation.isValid || usernameValidation.isChecking) {
        setError("Please enter a valid and available username");
        setLoading(false);
        return;
      }

      // Check username format and availability one more time
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

      // Final check for username availability
      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", formData.username);

      if (checkError) {
        console.error("Username validation on submit error:", checkError);
        // If there's an error (e.g., table doesn't exist), proceed with registration
        // The error might be because this is the first user and table is empty
      } else {
        // Only check if query was successful
        const usernameExists = existingUsers?.some(
          (profile) => profile.username.toLowerCase() === formData.username.toLowerCase()
        );

        if (usernameExists) {
          setError("Username is already taken");
          setLoading(false);
          return;
        }
      }

      // Set flag to prevent immediate redirect
      setJustRegistered(true);

      // Tambahkan phone dan location ke parameter signUp
      try {
        await signUp(
          formData.email,
          formData.password,
          formData.username,
          formData.fullname,
          location.countryId,
          location.stateId,
          location.cityId,
          formData.phone || null
        );

        // Registration successful
        setRegistrationSuccess(true);

        // Check if we need to redirect to join with game PIN
        const redirectPath = searchParams.get("redirect");
        const gamePin = searchParams.get("pin");

        // Show success message for a moment, then redirect
        setTimeout(() => {
          setJustRegistered(false); // Allow redirect

          // Check if location was provided
          const hasLocation = location.countryId !== null;

          if (!hasLocation) {
            // Redirect to required page to complete profile
            if (redirectPath && gamePin) {
              router.push(`/required?redirect=${redirectPath}&pin=${gamePin}`);
            } else {
              router.push("/required");
            }
          } else if (redirectPath && gamePin) {
            router.push(`${redirectPath}?pin=${gamePin}`);
          } else {
            router.push("/dashboard");
          }
        }, 2000); // 2 seconds delay
      } catch (signUpError: any) {
        console.error("SignUp error:", signUpError);
        // If profile creation fails, show specific error
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
      setJustRegistered(false); // Reset on error
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      // Prepare redirect URL with game PIN parameters if available
      const redirectPath = searchParams.get("redirect");
      const gamePin = searchParams.get("pin");

      // Store redirect info in localStorage before OAuth redirect
      if (redirectPath && gamePin) {
        localStorage.setItem("oauth_redirect_path", redirectPath);
        localStorage.setItem("oauth_game_pin", gamePin);
      }

      // Gunakan window.location.origin untuk semua environment, ini lebih reliable
      // karena akan otomatis menggunakan URL yang benar (localhost untuk dev, domain production untuk production)
      const callbackUrl = `${window.location.origin}/auth/callback`;

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
    <div className="flex items-center justify-center lg:h-screen my-32">
      <Card className="mx-auto w-96">
        <CardHeader>
          <div className="flex items-center justify-center">
            <img src="/gameforsmartlogo.png" alt="" className="h-full w-11/12 px-8" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                <svg viewBox="0 0 24 24">
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

            <div className="my-4">
              <div className="flex items-center gap-3">
                <div className="w-full border-t" />
                <span className="text-muted-foreground shrink-0 text-sm">or continue with</span>
                <div className="w-full border-t" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">Full Name</Label>
                <Input
                  id="fullname"
                  name="fullname"
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className={`w-full ${
                      formData.username
                        ? usernameValidation.isValid
                          ? "border-green-500 focus:border-green-600"
                          : "border-red-500 focus:border-red-600"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                  {/* Validation indicator */}
                  {formData.username && (
                    <div className="absolute top-2 right-4 flex h-5 w-5 items-center justify-center">
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
                {/* Validation message */}
                {formData.username && usernameValidation.message && (
                  <p
                    className={`mt-1 text-sm ${
                      usernameValidation.isValid ? "text-green-600" : "text-red-600"
                    }`}>
                    {usernameValidation.message}
                  </p>
                )}
              </div>

              <LocationSelector value={location} onChange={setLocation} showDetectButton={false} />

              <Button
                  type="button"
                  variant="outline"
                  onClick={detectLocation}
                  disabled={detectingLocation || loading}
                  className="w-full h-10 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="font-medium">Mendeteksi lokasi...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4" />
                      <span className="font-medium">
                        Deteksi Lokasi Otomatis
                      </span>
                    </>
                  )}
                </Button>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="johndoe@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                minLength={6}
              />
              <Button type="submit" className="w-full">
                {loading ? "Loading..." : "Register"}
              </Button>
            </form>
          </div>
          <div className="mt-4 text-center text-sm">
            already have an account?{" "}
            <Link href="/dashboard/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
