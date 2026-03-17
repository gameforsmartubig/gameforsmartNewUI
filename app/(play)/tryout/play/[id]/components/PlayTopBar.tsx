"use client";

// ============================================================
// play/_components/PlayTopBar.tsx
// Bar tipis di atas QuestionCard: judul quiz, timer, progress.
// Bukan sticky header — cukup satu baris ringkas.
// ============================================================

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlayTopBarProps {
  quizTitle:     string;
  timeLeft:      number;
  answeredCount: number;
  totalQuestions: number;
  formatTime:    (s: number) => string;
}

export function PlayTopBar({
  quizTitle, timeLeft, answeredCount, totalQuestions, formatTime,
}: PlayTopBarProps) {
  const router   = useRouter();
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const timerCritical = timeLeft <= 60;
  const timerWarning  = timeLeft > 60 && timeLeft <= 300;

  return (
    <div className="space-y-3 mb-5">
      {/* ── Row 1: back + title + timer ──────────────────── */}
      <div className="flex items-center gap-3">
        {/* Quiz title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
          </div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {quizTitle}
          </h1>
        </div>

        {/* Timer */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold shrink-0",
          timerCritical
            ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
            : timerWarning
            ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
            : "bg-zinc-50 border-zinc-200 text-zinc-700 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-300"
        )}>
          <Clock className={cn("w-3.5 h-3.5", timerCritical && "animate-pulse")} />
          <span className="tabular-nums">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* ── Row 2: progress bar + counter ────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>Progress</span>
          <span className="tabular-nums font-medium text-zinc-600 dark:text-zinc-400">
            {answeredCount}/{totalQuestions} answered
          </span>
        </div>
        <Progress
          value={progress}
          className="h-1.5 bg-zinc-100 dark:bg-zinc-800"
        />
      </div>
    </div>
  );
}
