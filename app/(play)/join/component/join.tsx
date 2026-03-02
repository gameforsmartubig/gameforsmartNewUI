"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Camera, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  addParticipantRT,
  isRealtimeDbConfigured,
  getParticipantsRT
} from "@/lib/supabase-realtime";
import { generateXID } from "@/lib/id-generator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

interface JoinGameContentProps {
  initialPin?: string;
}

function JoinGameContent({ initialPin }: JoinGameContentProps) {
  const router = useRouter();
  const { user, profileId, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [gamePin, setGamePin] = useState(initialPin || "");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [shouldAutoJoin, setShouldAutoJoin] = useState(false);
  const scannerRef = useRef<any>(null);

  // 1. PIN Recovery Logic - Unified
  useEffect(() => {
    const pinFromUrl = searchParams.get("pin");
    const pinFromStorage = localStorage.getItem("pin");
    const oauthPin = localStorage.getItem("oauth_game_pin");

    console.log("🔍 Join Debug - Init Params:", {
      urlPin: pinFromUrl,
      initialPin,
      storagePin: pinFromStorage,
      oauthPin
    });

    let targetPin = "";

    if (pinFromUrl) {
      targetPin = pinFromUrl;
    } else if (initialPin) {
      targetPin = initialPin;
    } else if (oauthPin) {
      targetPin = oauthPin;
      localStorage.removeItem("oauth_game_pin");
    } else if (pinFromStorage) {
      targetPin = pinFromStorage;
    }

    if (targetPin) {
      console.log("✅ PIN Found & Set:", targetPin);
      localStorage.setItem("pin", targetPin);
      setGamePin(targetPin);
      setShouldAutoJoin(true);
    }
  }, [searchParams, initialPin]);

  // State for minimum delay to prevent flickering
  const [isReadyToJoin, setIsReadyToJoin] = useState(false);

  // 1. Min Delay Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (shouldAutoJoin) {
      setIsReadyToJoin(false); // Reset
      timer = setTimeout(() => {
        setIsReadyToJoin(true);
      }, 800); // 800ms Minimum Loading Screen
    }
    return () => clearTimeout(timer);
  }, [shouldAutoJoin]);

  // 2. Reactive Auto Join Execution
  useEffect(() => {
    if (shouldAutoJoin && isReadyToJoin && !authLoading && gamePin) {
      console.log("🚀 Auto Join Triggered!", { user: user?.email, gamePin });

      if (user) {
        joinGame();
      } else {
        // Redirect to login if not logged in (Force Hard Redirect)
        console.log("Redirecting to login... (DISABLED FOR DEBUGGING)");
        // window.location.href = `${window.location.origin}/login?redirect=/join&pin=${gamePin}`;
      }

      // We don't turn off shouldAutoJoin immediately if joining,
      // let joinGame or redirect handle navigation.
      // If user is guest, we redirect -> component unmounts.
      // If user is logged in, joinGame -> loading state -> redirect to room.
      if (user) {
        // Optional: setShouldAutoJoin(false) only if join fails?
        // For now let joinGame handle UI.
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoJoin, isReadyToJoin, authLoading, user, gamePin]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScanning(false);
  };

  const startScanning = async () => {
    try {
      setError("");
      setScanning(true);
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          handleQRCodeDetected(decodedText);
        },
        (errorMessage) => {
          // ignore scan errors
        }
      );
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setScanning(false);
      toast.error("Cannot access the camera");
    }
  };

  const handleQRCodeDetected = (data: string) => {
    stopScanning();

    // Try to extract PIN
    let pin = "";
    try {
      const url = new URL(data);

      // 1. Check query parameter: ?pin=123456
      const urlPin = url.searchParams.get("pin");
      if (urlPin) {
        pin = urlPin;
      } else {
        // 2. Check path: /join/123456
        const pathMatch = url.pathname.match(/\/join\/(\d{6})/);
        if (pathMatch) {
          pin = pathMatch[1];
        }
      }
    } catch {
      // 3. Fallback: Maybe it's just a 6-digit PIN directly
      const match = data.match(/^\d{6}$/);
      if (match) pin = match[0];
    }

    if (pin) {
      setGamePin(pin);
      // Trigger auto-join
      setShouldAutoJoin(true);
      localStorage.setItem("pin", pin);
      toast.success("QR Code detected: " + pin);
    } else {
      toast.error("QR code not valid");
    }
  };

  const joinGame = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gamePin) return;

    // Wait if auth is still loading to avoid false redirect
    if (authLoading) return;

    setLoading(true);
    setError("");

    try {
      if (!user) {
        // Redirect to login
        router.push(`/login?redirect=/join/${gamePin}`);
        return;
      }

      // Check Profile - Use profileId from context, fallback to fetch if missing
      let profile_id = profileId;
      let username_val = "";

      if (!profile_id) {
        // Fallback fetch if profileId not in context for some reason
        let { data: profile } = await supabase
          .from("profiles")
          .select("id, username, nickname, fullname")
          .eq("auth_user_id", user.id)
          .single();
        if (!profile) {
          toast.error("Profile not found.");
          setLoading(false);
          return;
        }
        profile_id = profile.id;
        const emailName = user.email?.split("@")[0] || "Player";
        username_val = profile.nickname || profile.fullname || profile.username || emailName;
      } else {
        // Fetch username
        const { data: p } = await supabase
          .from("profiles")
          .select("username, nickname, fullname")
          .eq("id", profile_id)
          .single();
        const emailName = user.email?.split("@")[0] || "Player";
        username_val = p?.nickname || p?.fullname || p?.username || emailName;
      }

      // Check Session
      const { data: session, error: sessionError } = await supabase
        .from("game_sessions")
        .select("id, status, participants, allow_join_after_start")
        .eq("game_pin", gamePin)
        .single();

      if (sessionError || !session) {
        toast.error("PIN not valid");
        setLoading(false);
        setShouldAutoJoin(false);
        return;
      }

      if (session.status === "finished") {
        toast.error("sessions finished");
        setLoading(false);
        setShouldAutoJoin(false);
        return;
      }

      // Check existing
      let existing = null;
      let currentParticipants = session.participants || [];

      if (isRealtimeDbConfigured) {
        // Check RT DB
        const partsRT = await getParticipantsRT(session.id);
        existing = partsRT.find((p) => p.user_id === profile_id);
        // If found in RT, we are good.
        // Note: We don't check Main DB if RT is active, assuming RT is source of truth for active session.
      } else {
        // Check Main DB
        existing = currentParticipants.find((p: any) => p.user_id === profile_id);
      }

      if (existing) {
        // Clear PIN from storage to prevent auto-join on next visit
        localStorage.removeItem("pin");
        localStorage.removeItem("oauth_game_pin");
        router.push(`/player/${session.id}/room`);
        return;
      }

      // Check if joining is allowed for new participants
      if (session.status === "active" && !session.allow_join_after_start) {
        toast.error("The session has started and is not accepting new participants");
        setLoading(false);
        setShouldAutoJoin(false);
        return;
      }

      // Join Logic
      const newParticipant = {
        id: generateXID(),
        user_id: profile_id,
        nickname: username_val || user.email?.split("@")[0] || "Player",
        score: 0,
        started: new Date().toISOString(),
        ended: null
      };

      if (isRealtimeDbConfigured) {
        // 1. Update Realtime DB ONLY
        await addParticipantRT({
          id: newParticipant.id,
          session_id: session.id,
          user_id: profile_id,
          nickname: newParticipant.nickname
        });
        // We explicitly DO NOT update main DB 'participants' column here as requested.
      } else {
        // 2. Fallback: Update Main DB if RT not configured
        const updatedParticipants = [...currentParticipants, newParticipant];
        const { error: updateError } = await supabase
          .from("game_sessions")
          .update({ participants: updatedParticipants })
          .eq("id", session.id);

        if (updateError) {
          throw new Error("Failed to join session in Main DB: " + updateError.message);
        }
      }

      // Save to localStorage for result page fallback (in case auth session is missing)
      if (profile_id) {
        localStorage.setItem(`game_participant_${session.id}`, profile_id);
        localStorage.setItem("current_game_session", session.id);
        localStorage.setItem("current_profile_id", profile_id);
      }

      // Clear PIN from storage to prevent auto-join on next visit
      localStorage.removeItem("pin");
      localStorage.removeItem("oauth_game_pin");

      router.push(`/player/${session.id}/room`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to join session");
    } finally {
      setLoading(false);
    }
  };

  // RENDER LOADING SCREEN IF AUTO JOINING
  if (shouldAutoJoin && !authLoading) {
    return (
      <div className="base-background flex min-h-screen flex-col items-center justify-center">
        <div className="mb-6 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-orange-200">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
        <h2 className="mb-2 text-center text-2xl font-bold text-orange-900">Joining Game...</h2>
        <p className="text-center text-orange-700">
          Please wait while we connect you to the session.
        </p>
      </div>
    );
  }

  return (
    <div className="base-background relative flex h-screen flex-col items-center justify-center">
      <Card className="card mx-auto w-96">
        <CardContent>
          <form onSubmit={joinGame} className="space-y-6">
            <div className="flex flex-col items-center justify-center gap-2">
              <Image
                src="/gameforsmartlogo.png"
                width={200}
                height={40}
                alt="gameforsmart"
                className="opacity-90 dark:opacity-100"
                unoptimized
              />
              <p className="text-muted-foreground text-sm dark:text-zinc-400">
                Enter the code to join the fun!
              </p>
            </div>

            <Input
              value={gamePin}
              onChange={(e) => setGamePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              className="input h-14 bg-gray-50 text-center text-sm font-bold tracking-[0.2em] text-orange-900 transition-colors sm:text-3xl"
            />

            <div className="flex w-full flex-col items-center gap-3">
              <Button
                type="submit"
                className="button-orange h-12 w-full"
                disabled={loading || !gamePin}>
                {loading ? "Joining..." : "Join Game"}
              </Button>

              <div className="relative flex w-full items-center justify-center py-2">
                <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
                <span className="text-muted-foreground px-4 text-xs font-semibold uppercase dark:text-zinc-500">
                  OR
                </span>
                <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
              </div>

              {!scanning ? (
                <Button
                  type="button"
                  variant="outline"
                  className="button-orange-outline h-12 w-full"
                  onClick={startScanning}>
                  <Camera className="mr-2 size-5" /> Scan QR Code
                </Button>
              ) : (
                <div className="w-full space-y-2">
                  <div
                    id="qr-reader-container"
                    className="border-primary/20 dark:border-primary/40 aspect-square w-full overflow-hidden rounded-lg border-2 bg-black"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={stopScanning}>
                    <X className="mr-2" /> Stop Scanning
                  </Button>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {!scanning && (
        <div className="absolute bottom-8">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="ghost"
            className="hover:bg-orange/50 rounded-full text-orange-800 hover:text-orange-900 dark:text-orange-400 dark:hover:bg-zinc-800/50">
            Back to Dashboard <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface JoinProps {
  initialPin?: string;
}

export default function Join({ initialPin }: JoinProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinGameContent initialPin={initialPin} />
    </Suspense>
  );
}
