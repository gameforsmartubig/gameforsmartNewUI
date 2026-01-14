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
import { addParticipantRT, isRealtimeDbConfigured } from "@/lib/supabase-realtime";
import { generateXID } from "@/lib/id-generator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

function JoinGameContent() {
  const router = useRouter();
  const { user, profileId, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [gamePin, setGamePin] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    const pin = searchParams.get("pin");
    const pinFromLocalStorage = localStorage.getItem("pin");
    if (pin) {
      setGamePin(pin);
      // Optional: Auto join logic here if desired
    }
    if (pinFromLocalStorage) {
      setGamePin(pinFromLocalStorage);
      localStorage.removeItem("pin");
    }
  }, []);

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
      toast.error("Tidak dapat mengakses kamera");
    }
  };

  const handleQRCodeDetected = (data: string) => {
    stopScanning();

    // Try to extract PIN
    let pin = "";
    try {
      const url = new URL(data);
      const urlPin = url.searchParams.get("pin");
      if (urlPin) {
        pin = urlPin;
      } else {
        // Fallback or full url
      }
    } catch {
      const match = data.match(/^\d{6}$/);
      if (match) pin = match[0];
    }

    if (pin) {
      setGamePin(pin);
      // Auto click join
      // setTimeout requires joinGame to be callable with event or decoupled
      // We can just call logic directly but let's just set PIN for now to be safe
      toast.success("QR Code detected: " + pin);
    } else {
      toast.error("QR code tidak valid");
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
        router.push(`/login?redirect=/join&pin=${gamePin}`);
        return;
      }

      // Check Profile - Use profileId from context, fallback to fetch if missing
      let profile_id = profileId;
      let username_val = "";

      if (!profile_id) {
        // Fallback fetch if profileId not in context for some reason
        let { data: profile } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("auth_user_id", user.id)
          .single();
        if (!profile) {
          toast.error("Profile not found.");
          setLoading(false);
          return;
        }
        profile_id = profile.id;
        username_val = profile.username;
      } else {
        // Fetch username
        const { data: p } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", profile_id)
          .single();
        username_val = p?.username || "Player";
      }

      // Check Session
      const { data: session, error: sessionError } = await supabase
        .from("game_sessions")
        .select("id, status, participants, allow_join_after_start")
        .eq("game_pin", gamePin)
        .single();

      if (sessionError || !session) {
        toast.error("Game PIN tidak valid");
        setLoading(false);
        return;
      }

      if (session.status === "finished") {
        toast.error("Game sudah selesai");
        setLoading(false);
        return;
      }

      // Check existing
      const currentParticipants = session.participants || [];
      const existing = currentParticipants.find((p: any) => p.user_id === profile_id);

      if (existing) {
        router.push(`/player/${session.id}/room/?participant=${existing.id}`);
        return;
      }

      // Join
      const newParticipant = {
        id: generateXID(),
        user_id: profile_id,
        nickname: username_val || "Player",
        score: 0,
        started: new Date().toISOString(),
        ended: null
      };

      const updatedParticipants = [...currentParticipants, newParticipant];

      // 1. Update Main DB (Single source of truth first)
      const { error: updateError } = await supabase
        .from("game_sessions")
        .update({ participants: updatedParticipants })
        .eq("id", session.id);

      if (updateError) {
        throw new Error("Failed to join session in Main DB: " + updateError.message);
      }

      // 2. Update Realtime DB (Best effort, non-blocking for critical path if Main DB succeeded, but wait for it to ensure consistency)
      if (isRealtimeDbConfigured) {
        try {
          await addParticipantRT({
            id: newParticipant.id,
            session_id: session.id,
            user_id: profile_id,
            nickname: newParticipant.nickname
          });
        } catch (rtError) {
          console.error("Realtime DB join error (ignoring as Main DB succeeded):", rtError);
        }
      }

      router.push(`/player/${session.id}/room/?participant=${newParticipant.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal join game");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen flex-col items-center justify-center bg-gray-50/50 dark:bg-zinc-950">
      <Card className="mx-auto w-96 border-0 border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
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
              placeholder="Please Enter The Room Code"
              maxLength={6}
              required
              className="h-14 bg-gray-50 text-center text-sm font-black tracking-[0.2em] transition-colors sm:text-3xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />

            <div className="flex w-full flex-col items-center gap-3">
              <Button
                type="submit"
                className="h-12 w-full bg-purple-600 text-lg font-bold shadow-lg shadow-purple-600/20 hover:bg-purple-700 dark:bg-purple-600 dark:text-white dark:hover:bg-purple-700"
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
                  className="h-12 w-full border-2 font-semibold hover:bg-gray-50 dark:border-zinc-800 dark:bg-transparent dark:text-white dark:hover:bg-zinc-800"
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
            className="text-muted-foreground rounded-full hover:bg-white/50 dark:text-zinc-400 dark:hover:bg-zinc-800/50">
            Back to Dashboard <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Join() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinGameContent />
    </Suspense>
  );
}
