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
function useGameTimer({ startedAt, totalTimeMinutes, onTimeUp, status }: GameTimerBaseProps) {
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

  return (
    <div className="flex items-center justify-center gap-4">
      <Card className="border-none bg-white/80 shadow-sm backdrop-blur">
        <CardContent className="px-8 sm:py-4 text-center sm:px-16 w-32 sm:w-48">
          <p className="text-3xl font-bold sm:text-5xl">
            {Math.floor(timeLeft / 60)
              .toString()
              .padStart(2, "0")}
          </p>
        </CardContent>
      </Card>
      <span className="text-3xl font-bold sm:text-5xl">:</span>
      <Card className="border-none bg-white/80 shadow-sm backdrop-blur">
        <CardContent className="px-8 sm:py-4 text-center sm:px-16 w-32 sm:w-48">
          <p className="text-3xl font-bold sm:text-5xl">
            {(timeLeft % 60).toString().padStart(2, "0")}
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
