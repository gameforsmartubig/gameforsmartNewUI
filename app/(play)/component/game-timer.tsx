"use client";

import { useEffect, useState, useRef } from "react";
import { getServerNow } from "@/lib/server-time";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================
// Game Timer Hook & Components (shared between host & player)
// ============================================================

interface GameTimerBaseProps {
  startedAt: string | null;
  totalTimeMinutes: number;
  onTimeUp?: () => void;
  status: string;
}

/**
 * Hook to calculate remaining time based on server-synced startedAt timestamp.
 * Used for the main game timer (after countdown finishes).
 */
export function useGameTimer({
  startedAt,
  totalTimeMinutes,
  onTimeUp,
  status,
}: GameTimerBaseProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);
  const onTimeUpCallable = useRef(true);

  useEffect(() => {
    if (status !== "active" || !startedAt) {
      if (status === "finished") {
        setTimeLeft(0);
        setProgress(0);
      }
      return;
    }

    onTimeUpCallable.current = true;

    const interval = setInterval(() => {
      const now = getServerNow();
      const start = new Date(startedAt).getTime();
      const totalTimeMs = totalTimeMinutes * 60 * 1000;
      const end = start + totalTimeMs;
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(0);
        setProgress(0);
        if (onTimeUp && onTimeUpCallable.current) {
          onTimeUpCallable.current = false;
          onTimeUp();
        }
      } else {
        const secondsLeft = Math.ceil(diff / 1000);
        setTimeLeft(secondsLeft);
        const newProgress = Math.min(
          100,
          Math.max(0, (diff / totalTimeMs) * 100)
        );
        setProgress(newProgress);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startedAt, totalTimeMinutes, status, onTimeUp]);

  return { timeLeft, progress };
}

/**
 * GameTimer - Visual timer display with MM:SS cards.
 */
export function GameTimer({
  startedAt,
  totalTimeMinutes,
  onTimeUp,
  status,
}: GameTimerBaseProps) {
  const { timeLeft, progress } = useGameTimer({
    startedAt,
    totalTimeMinutes,
    onTimeUp,
    status,
  });

  const isWaitingForStart = !startedAt && status !== "finished";

  const getColorClass = (prog: number) => {
    if (prog > 50) return "text-green-600 dark:text-green-400";
    if (prog > 20) return "text-yellow-500 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const currentColorClass = getColorClass(progress);

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Card Menit */}
      <Card className="card transition-colors duration-500">
        <CardContent className="w-32">
          <p
            className={`text-3xl font-bold transition-colors duration-500 sm:text-5xl text-center ${currentColorClass}`}>
            {isWaitingForStart
              ? "--"
              : Math.floor(timeLeft / 60)
                  .toString()
                  .padStart(2, "0")}
          </p>
        </CardContent>
      </Card>

      {/* Pemisah (Titik Dua) */}
      <span
        className={`animate-pulse text-3xl font-bold transition-colors duration-500 sm:text-5xl ${currentColorClass}`}>
        :
      </span>

      {/* Card Detik */}
      <Card className="card transition-colors duration-500">
        <CardContent className="w-32">
          <p
            className={`text-3xl font-bold transition-colors duration-500 sm:text-5xl text-center ${currentColorClass}`}>
            {isWaitingForStart
              ? "--"
              : (timeLeft % 60).toString().padStart(2, "0")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * GameTimerProgress - Progress bar that decreases as time runs out.
 */
export function GameTimerProgress({
  startedAt,
  totalTimeMinutes,
  onTimeUp,
  status,
}: GameTimerBaseProps) {
  const { progress } = useGameTimer({
    startedAt,
    totalTimeMinutes,
    onTimeUp,
    status,
  });

  const getProgressColor = (prog: number) => {
    if (prog > 50) return "bg-green-500";
    if (prog > 20) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <Progress
      indicatorColor={`${getProgressColor(progress)} transition-colors duration-500`}
      value={progress}
      className="w-full bg-transparent"
    />
  );
}

// ============================================================
// Game Countdown Hook & Component
// Reads countdown_started_at from game_sessions_rt via Supabase RT
// ============================================================

interface UseGameCountdownProps {
  /** The countdown_started_at timestamp from game_sessions_rt. 
   *  Pass this from your RT subscription or initial fetch. */
  countdownStartedAt: string | null;
  /** Duration of the countdown in seconds (default: 10) */
  countdownDuration?: number;
  /** Called when countdown finishes */
  onCountdownFinished?: () => void;
}

interface UseGameCountdownReturn {
  countdownLeft: number | null;
  showCountdown: boolean;
}

/**
 * Hook that computes a synchronized countdown from a given
 * `countdownStartedAt` timestamp (from `game_sessions_rt`).
 * 
 * IMPORTANT: This hook does NOT create its own Supabase RT subscription.
 * Pass the `countdownStartedAt` value from your parent component's
 * subscription to avoid channel name conflicts.
 */
export function useGameCountdown({
  countdownStartedAt,
  countdownDuration = 10,
  onCountdownFinished,
}: UseGameCountdownProps): UseGameCountdownReturn {
  const [countdownLeft, setCountdownLeft] = useState<number | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const onFinishedCalled = useRef(false);
  const lastProcessedTimestamp = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Store callback in ref to avoid re-running the effect when the
  // inline function reference changes on every render.
  const onFinishedRef = useRef(onCountdownFinished);
  onFinishedRef.current = onCountdownFinished;

  useEffect(() => {
    // Only process when timestamp changes
    if (!countdownStartedAt || countdownStartedAt === lastProcessedTimestamp.current) return;
    lastProcessedTimestamp.current = countdownStartedAt;
    onFinishedCalled.current = false;

    // Clear previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const startTime = new Date(countdownStartedAt).getTime();
    const targetEndTime = startTime + countdownDuration * 1000;

    const tick = () => {
      const now = getServerNow();
      const remainingMs = targetEndTime - now;

      if (remainingMs <= 0) {
        setShowCountdown(false);
        setCountdownLeft(null);
        if (!onFinishedCalled.current && onFinishedRef.current) {
          onFinishedCalled.current = true;
          onFinishedRef.current();
        }
        return false;
      }

      // Too late — countdown has already passed by more than 5s
      if (remainingMs < -5000) {
        setShowCountdown(false);
        setCountdownLeft(null);
        return false;
      }

      const seconds = Math.ceil(remainingMs / 1000);
      setCountdownLeft(seconds);
      setShowCountdown(true);
      return true;
    };

    if (tick()) {
      intervalRef.current = setInterval(() => {
        if (!tick()) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [countdownStartedAt, countdownDuration]);

  return { countdownLeft, showCountdown };
}

/**
 * GameCountdown - Full-screen animated countdown overlay.
 * Shows the countdown number with a glow effect.
 */
interface GameCountdownProps {
  countdownLeft: number | null;
  showCountdown: boolean;
  title?: string;
}

export function GameCountdown({
  countdownLeft,
  showCountdown,
  title = "Game Starting...",
}: GameCountdownProps) {
  return (
    <div
      className={`base-background fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md transition-opacity duration-300 ${
        showCountdown
          ? "visible opacity-100"
          : "pointer-events-none invisible opacity-0"
      }`}>
      <div className="flex flex-col items-center gap-8">
        <AnimatePresence mode="wait">
          {countdownLeft !== null && countdownLeft > 0 && (
            <motion.div
              key={countdownLeft}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-orange-600 to-yellow-500 opacity-40 blur-xl"></div>
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-4 border-orange-500 bg-orange-200 shadow-2xl dark:bg-zinc-900">
                <span className="bg-gradient-to-br from-orange-600 to-yellow-500 bg-clip-text text-8xl font-black text-transparent">
                  {countdownLeft}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <h2 className="animate-pulse text-4xl font-bold tracking-widest text-orange-500 uppercase dark:text-orange-400">
          {title}
        </h2>
      </div>
    </div>
  );
}
