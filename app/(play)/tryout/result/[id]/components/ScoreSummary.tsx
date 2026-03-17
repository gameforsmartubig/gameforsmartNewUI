"use client";

// ============================================================
// result/_components/ScoreSummary.tsx — Shadcn Admin style
// ============================================================

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Trophy } from "lucide-react";
import type { LearnStats } from "../../../types";

interface ScoreSummaryProps {
  stats:      LearnStats;
  formatTime: (v: number) => string;
}

export function ScoreSummary({ stats, formatTime }: ScoreSummaryProps) {
  const tiles = [
    { value: stats.total_points.toLocaleString("id-ID"), label: "Total Points",  color: "text-zinc-900 dark:text-zinc-100" },
    { value: `${stats.accuracy_percentage}%`,            label: "Accuracy",       color: "text-emerald-600 dark:text-emerald-400" },
    { value: `${stats.correct_answers}/${stats.total_questions}`, label: "Correct", color: "text-zinc-900 dark:text-zinc-100" },
    { value: formatTime(stats.total_time_spent),          label: "Time Spent",    color: "text-zinc-900 dark:text-zinc-100" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm gap-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            </div>
            Tryout Complete!
          </CardTitle>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Here are your learning results</p>
        </CardHeader>

        <Separator />

        <CardContent className="pt-5 space-y-5">
          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tiles.map((tile) => (
              <div
                key={tile.label}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 text-center"
              >
                <p className={`text-xl font-bold tabular-nums ${tile.color}`}>{tile.value}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{tile.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Success Rate</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{stats.accuracy_percentage}%</span>
            </div>
            <Progress value={stats.accuracy_percentage} className="h-2 bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
