"use client";

// ============================================================
// result/page.tsx — Shadcn Admin style, tanpa header terpisah
// ============================================================

import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Repeat, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLearnResult } from "./hooks/useLearnResult";
import { ScoreSummary } from "./components/ScoreSummary";
import { AnswerReview } from "./components/AnswerReview";

function LearnResultContent({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const {
    loading, authLoading, error,
    learnSession, learnStats, questionDetails,
    handleRetakeQuiz, handleShareResults, formatTime,
  } = useLearnResult(sessionId);

  // ── Loading ─────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading results...</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-sm mx-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Error</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">{error}</p>
          <Button
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-1.5 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 text-white text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────
  if (!learnSession || !learnStats) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-sm mx-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-zinc-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Results not found</h2>
          <Button
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-1.5 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 text-white text-xs mt-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-5">

        {/* ── Page header ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left: back + title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tryout Results</h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs">
                    {learnSession.quizzes?.title ?? "Quiz"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareResults}
                className="gap-1.5 text-xs h-8"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetakeQuiz}
                className="gap-1.5 text-xs h-8"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Retry</span>
              </Button>
            </div>
          </div>

          <Separator />
        </motion.div>

        {/* ── Score summary ────────────────────────────── */}
        <ScoreSummary stats={learnStats} formatTime={formatTime} />

        {/* ── Answer review ────────────────────────────── */}
        <AnswerReview questionDetails={questionDetails} />

      </div>
    </div>
  );
}

export default function LearnResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <LearnResultContent sessionId={id} />;
}
