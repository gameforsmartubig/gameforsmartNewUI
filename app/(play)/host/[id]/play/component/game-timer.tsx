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
          onTimeUp();
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
  const { timeLeft, progress } = useGameTimer({ startedAt, totalTimeMinutes, onTimeUp, status });

  const isWaitingForStart = !startedAt && status !== "finished";

  // Fungsi helper untuk menentukan warna teks berdasarkan progres
  const getColorClass = (prog: number) => {
    if (prog > 50) return "text-green-600 dark:text-green-400"; // Hijau saat masih banyak waktu
    if (prog > 20) return "text-yellow-500 dark:text-yellow-400"; // Kuning saat menengah
    return "text-orange-600 dark:text-orange-400"; // Orange saat sudah dekat 0
  };

  const currentColorClass = getColorClass(progress);

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Card Menit */}
      <Card className="card transition-colors duration-500">
        <CardContent className="w-32">
          <p
            className={`text-3xl font-bold transition-colors duration-500 sm:text-5xl ${currentColorClass}`}>
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
            className={`text-3xl font-bold transition-colors duration-500 sm:text-5xl ${currentColorClass}`}>
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

  // Fungsi helper untuk menentukan warna progress bar
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
