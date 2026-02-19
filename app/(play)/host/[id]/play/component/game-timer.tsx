"use client";

import { useEffect, useState, useRef } from "react";
import { getServerNow } from "@/lib/server-time";
import { Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface GameTimerBaseProps {
  startedAt: string | null;
  totalTimeMinutes: number;
  onTimeUp?: () => void;
  status: string;
}

// Custom hook to share timer logic
export function useGameTimer({
  startedAt,
  totalTimeMinutes,
  onTimeUp,
  status
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
          if (onTimeUp) onTimeUp();
        }
      } else {
        const secondsLeft = Math.ceil(diff / 1000);
        setTimeLeft(secondsLeft);
        const newProgress = Math.min(100, Math.max(0, (diff / totalTimeMs) * 100));
        setProgress(newProgress);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startedAt, totalTimeMinutes, status, onTimeUp]);

  return { timeLeft, progress };
}

export function GameTimer({ startedAt, totalTimeMinutes, onTimeUp, status }: GameTimerBaseProps) {
  const { timeLeft } = useGameTimer({ startedAt, totalTimeMinutes, onTimeUp, status });

  // Show loading state if game hasn't fully started yet
  const isWaitingForStart = !startedAt && status !== "finished";

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Card Menit */}
      <Card className="border-none bg-white/90 shadow-lg backdrop-blur dark:bg-zinc-900/90 dark:shadow-orange-950/20">
        <CardContent className="w-32 rounded-t-xl border-t-4 border-orange-500 px-8 text-center sm:w-48 sm:px-16 sm:py-4 dark:border-orange-600">
          <p className="text-3xl font-bold text-orange-600 sm:text-5xl dark:text-orange-400">
            {isWaitingForStart
              ? "--"
              : Math.floor(timeLeft / 60)
                  .toString()
                  .padStart(2, "0")}
          </p>
        </CardContent>
      </Card>

      {/* Pemisah (Titik Dua) - Warna Kuning */}
      <span className="animate-pulse text-3xl font-bold text-yellow-500 sm:text-5xl dark:text-yellow-400">
        :
      </span>

      {/* Card Detik */}
      <Card className="border-none bg-white/90 shadow-lg backdrop-blur dark:bg-zinc-900/90 dark:shadow-orange-950/20">
        <CardContent className="w-32 rounded-t-xl border-t-4 border-green-500 px-8 text-center sm:w-48 sm:px-16 sm:py-4 dark:border-green-600">
          <p className="text-3xl font-bold text-orange-600 sm:text-5xl dark:text-orange-400">
            {isWaitingForStart ? "--" : (timeLeft % 60).toString().padStart(2, "0")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function GameTimerProgress({
  startedAt,
  totalTimeMinutes,
  onTimeUp,
  status
}: GameTimerBaseProps) {
  const { progress } = useGameTimer({ startedAt, totalTimeMinutes, onTimeUp, status });
  return (
    <Progress indicatorColor="bg-blue-500" value={progress} className="w-full bg-transparent" />
  );
}
