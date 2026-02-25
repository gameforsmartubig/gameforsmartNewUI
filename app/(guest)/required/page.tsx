"use client";

import type React from "react";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { User, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { LocationSelector, type LocationValue } from "@/components/ui/location-selector";

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
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RequiredPage />
    </Suspense>
  );
}

function RequiredPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [usernameValidation, setUsernameValidation] = useState({
    isValid: true,
    isChecking: false,
    message: "",
  });
  const [location, setLocation] = useState<LocationValue>({
    countryId: null,
    stateId: null,
    cityId: null,
    countryName: "",
    stateName: "",
    cityName: "",
    latitude: null,
    longitude: null,
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize username and location from existing profile
  useEffect(() => {
    if (profile) {
      // Only set username if it's a real username (not auto-generated from email)
      if (profile.username && !profile.username.includes("@") && !profile.username.startsWith("user_")) {
        setUsername(profile.username);
      }
      
      // Set existing location if available
      if (profile.country_id) {
        setLocation(prev => ({
          ...prev,
          countryId: profile.country_id,
          countryName: profile.countries?.name || "",
        }));
      }
    }
  }, [profile]);

  // Redirect if profile is already complete
  useEffect(() => {
    if (!authLoading && profile) {
      const hasValidUsername = profile.username && 
        !profile.username.includes("@") && 
        !profile.username.startsWith("user_") &&
        profile.username.length >= 3;
      
      const hasLocation = profile.country_id !== null;

      if (hasValidUsername && hasLocation) {
        // Profile is complete, redirect
        const redirectPath = searchParams.get("redirect");
        const gamePin = searchParams.get("pin");

        if (redirectPath && gamePin) {
          router.push(`${redirectPath}?pin=${gamePin}`);
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [authLoading, profile, router, searchParams]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

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
              latitude: data.city?.latitude || data.state?.latitude || data.country?.latitude || latitude,
              longitude: data.city?.longitude || data.state?.longitude || data.country?.longitude || longitude,
            });

            const locationParts = [data.city?.name, data.state?.name, data.country?.name].filter(Boolean);
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
        maximumAge: 0,
      }
    );
  }, []);

  // Real-time username validation
  const validateUsernameRealtime = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck) {
      setUsernameValidation({ isValid: true, isChecking: false, message: "" });
      return;
    }

    // Basic format validation
    if (usernameToCheck.length > 0 && usernameToCheck.length < 3) {
      setUsernameValidation({
        isValid: false,
        isChecking: false,
        message: "Username must be at least 3 characters long",
      });
      return;
    }

    if (usernameToCheck.length > 20) {
      setUsernameValidation({
        isValid: false,
        isChecking: false,
        message: "Username must be at most 20 characters long",
      });
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (usernameToCheck.length > 0 && !usernameRegex.test(usernameToCheck)) {
      setUsernameValidation({
        isValid: false,
        isChecking: false,
        message: "Username can only contain letters, numbers, and underscores",
      });
      return;
    }

    if (usernameToCheck.length >= 3) {
      setUsernameValidation({
        isValid: true,
        isChecking: true,
        message: "Checking availability...",
      });

      try {
        const { data: existingUsers, error } = await supabase
          .from("profiles")
          .select("id, username")
          .ilike("username", usernameToCheck);

        if (error) {
          console.error("Username check error:", error);
          setUsernameValidation({
            isValid: true,
            isChecking: false,
            message: "Username is available",
          });
          return;
        }

        // Check if username exists and is not the current user's username
        const usernameExists = existingUsers?.some(
          (p) => p.username.toLowerCase() === usernameToCheck.toLowerCase() && p.id !== profile?.id
        );

        if (usernameExists) {
          setUsernameValidation({
            isValid: false,
            isChecking: false,
            message: "Username is already taken",
          });
        } else {
          setUsernameValidation({
            isValid: true,
            isChecking: false,
            message: "Username is available",
          });
        }
      } catch (err) {
        console.error("Username validation catch error:", err);
        setUsernameValidation({
          isValid: true,
          isChecking: false,
          message: "Username is available",
        });
      }
    } else {
      setUsernameValidation({ isValid: true, isChecking: false, message: "" });
    }
  }, [profile?.id]);

  const debouncedUsername = useDebounce(username, 500);

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
      // Validate username
      if (!usernameValidation.isValid || usernameValidation.isChecking) {
        setError("Please enter a valid and available username");
        setLoading(false);
        return;
      }

      if (username.length < 3) {
        setError("Username must be at least 3 characters long");
        setLoading(false);
        return;
      }

      if (username.length > 20) {
        setError("Username must be at most 20 characters long");
        setLoading(false);
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        setError("Username can only contain letters, numbers, and underscores");
        setLoading(false);
        return;
      }

      // Validate location
      if (!location.countryId) {
        setError("Please select your country");
        setLoading(false);
        return;
      }

      // Final check for username availability
      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", username);

      if (!checkError) {
        const usernameExists = existingUsers?.some(
          (p) => p.username.toLowerCase() === username.toLowerCase() && p.id !== profile?.id
        );

        if (usernameExists) {
          setError("Username is already taken");
          setLoading(false);
          return;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: username,
          country_id: location.countryId,
          state_id: location.stateId,
          city_id: location.cityId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile?.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh profile data
      await refreshProfile();

      toast.success("Profile updated successfully!");

      // Redirect
      const redirectPath = searchParams.get("redirect");
      const gamePin = searchParams.get("pin");

      if (redirectPath && gamePin) {
        router.push(`${redirectPath}?pin=${gamePin}`);
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f0f5f4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f0f5f4] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 rounded-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome!
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-amber-600 font-medium">
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="@username (use _ not space or -)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`h-10 border-0 border-b-2 rounded-none bg-transparent px-0 focus-visible:ring-0 ${
                    username
                      ? usernameValidation.isValid
                        ? "border-green-500"
                        : "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                />
                {username && (
                  <div className="absolute right-0 top-2 h-5 w-5 flex items-center justify-center">
                    {usernameValidation.isChecking ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : usernameValidation.isValid ? (
                      <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
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
                Username can only contain letters, numbers, and underscores (3-20 characters). No spaces or hyphens allowed.
              </p>
              {username && usernameValidation.message && (
                <p
                  className={`text-sm ${
                    usernameValidation.isValid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {usernameValidation.message}
                </p>
              )}
            </div>

            {/* Location Selector */}
            <LocationSelector
              value={location}
              onChange={setLocation}
              showDetectButton={false}
            />

            {/* Auto-Detect Location Button */}
            <Button
              type="button"
              variant="outline"
              onClick={detectLocation}
              disabled={detectingLocation || loading}
              className="w-full h-10 border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Save Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              disabled={
                loading ||
                !usernameValidation.isValid ||
                usernameValidation.isChecking ||
                !location.countryId
              }
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
