"use client";

// ============================================================
// play/_components/QuestionNavigator.tsx
// Grid nomor soal + legend — ditempatkan di bawah QuestionCard.
// ============================================================

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import type { Question, LearnResponse } from "../../../types";

interface QuestionNavigatorProps {
  questions:            Question[];
  responses:            Map<string, LearnResponse>;
  currentQuestionIndex: number;
  onNavigate:           (index: number) => void;
}

export function QuestionNavigator({
  questions, responses, currentQuestionIndex, onNavigate,
}: QuestionNavigatorProps) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Question Navigator
        </p>
        <div className="sm:hidden flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
          {[
            { cls: "w-3 h-3 rounded-sm bg-zinc-900 dark:bg-white",                label: "Current" },
            { cls: "w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/40",    label: "Answered" },
            { cls: "w-3 h-3 rounded-sm bg-zinc-100 dark:bg-zinc-800",             label: "Unanswered" },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cls} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, index) => {
          const response   = responses.get(q.id);
          const isAnswered = !!(response?.answer_id?.trim());
          const isCurrent  = index === currentQuestionIndex;

          return (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              className={cn(
                "w-8 h-8 rounded-md text-xs font-semibold transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                isCurrent
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm scale-105"
                  : isAnswered
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <div className="hidden sm:flex flex-col items-start gap-3 text-[11px] text-zinc-400 dark:text-zinc-500 mt">
          {[
            { cls: "w-3 h-3 rounded-sm bg-zinc-900 dark:bg-white",                label: "Current" },
            { cls: "w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/40",    label: "Answered" },
            { cls: "w-3 h-3 rounded-sm bg-zinc-100 dark:bg-zinc-800",             label: "Unanswered" },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cls} />
              <span>{label}</span>
            </div>
          ))}
        </div>
    </div>
  );
}
