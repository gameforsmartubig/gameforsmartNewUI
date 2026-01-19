"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    emailOrUsername: "", // Changed to accept either email or username
    password: ""
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Check if input is an email or username
      const isEmail = formData.emailOrUsername.includes("@");
      let emailToUse = formData.emailOrUsername;

      // If it's not an email, treat it as username and fetch the associated email
      if (!isEmail) {
        console.log("Login with username:", formData.emailOrUsername);

        // Query the profiles table to get email from username (case-insensitive)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .ilike("username", formData.emailOrUsername)
          .single();

        if (profileError || !profileData) {
          console.log("Username lookup error:", profileError);
          throw new Error("Username tidak ditemukan");
        }

        emailToUse = profileData.email;
        console.log("Found email for username:", emailToUse);
      }

      // Now sign in with the email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: formData.password
      });

      if (error) throw error;

      if (data.user) {
        // Check if profile needs completion
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, country_id")
          .eq("auth_user_id", data.user.id)
          .single();

        const hasValidUsername =
          profile?.username &&
          !profile.username.includes("@") &&
          !profile.username.startsWith("user_") &&
          profile.username.length >= 3;
        const hasLocation = profile?.country_id !== null && profile?.country_id !== undefined;

        const redirectPath = searchParams.get("redirect");
        const gamePin = searchParams.get("pin");

        if (!hasValidUsername || !hasLocation) {
          // Redirect to required page to complete profile
          if (redirectPath && gamePin) {
            router.push(`/required?redirect=${redirectPath}&pin=${gamePin}`);
          } else {
            router.push("/required");
          }
        } else if (redirectPath && gamePin) {
          router.push(`${redirectPath}?pin=${gamePin}`);
        } else {
          router.push("/dashboard/");
        }
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      if (error.message === "Username tidak ditemukan") {
        setError("Username tidak ditemukan. Periksa kembali username Anda.");
      } else if (error.message?.includes("Invalid login credentials")) {
        setError("Password salah. Periksa kembali password Anda.");
      } else {
        setError(error.message || "Gagal masuk. Periksa email/username dan password Anda.");
      }
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

      console.log("🔥 Login - redirectPath:", redirectPath);
      console.log("🔥 Login - gamePin:", gamePin);

      // Store redirect info in localStorage before OAuth redirect
      if (redirectPath && gamePin) {
        localStorage.setItem("oauth_redirect_path", redirectPath);
        localStorage.setItem("oauth_game_pin", gamePin);
      }

      const callbackUrl = `${window.location.origin}/callback`;

      console.log("🔥 Login - callbackUrl:", callbackUrl);

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
    <div className="flex items-center justify-center py-4 lg:h-screen">
      <Card className="mx-auto w-96">
        <CardHeader>
          <div className="flex items-center justify-center">
            <img src="/gameforsmartlogo.png" alt="" className="h-full w-11/12 px-8" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-3">
              <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">
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
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="signin-emailOrUsername">Email or Username</Label>
                <Input
                  id="signin-emailOrUsername"
                  name="emailOrUsername"
                  type="text"
                  placeholder="john_doe@bundui.com/johndoe"
                  value={formData.emailOrUsername}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="signin-password">Password</Label>
                  <Link
                    href="/dashboard/forgot-password"
                    className="ml-auto inline-block text-sm underline">
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : "Login"}
              </Button>
            </form>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
