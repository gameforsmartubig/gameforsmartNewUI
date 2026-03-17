"use client";

// ============================================================
// page.tsx — Quiz Detail
// Shadcn Admin style. Tanpa sticky header, tanpa i18n.
// Layout vertikal: page header row → QuizInfoCard → QuestionsPreview
// ============================================================

import { use } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuizDetail } from "./hooks/useQuizDetail";
import { QuizDetailSkeleton } from "./components/Quizdetailskeleton";
import { QuestionsPreview } from "./components/Questionspreview";
import { QuizInfoCard } from "./components/Quizinfocard";

export default function QuizDetailPage() {
  const router  = useRouter();
  const params  = useParams();
  const quizId  = params.id as string;

  const {
    quiz, loading,
    isFavorited, favoriteCount, isTogglingFavorite,
    copied, isCreator, questionCount,
    handleToggleFavorite, handleHostQuiz, handleTryout,
    handleEdit, handleShare,
  } = useQuizDetail(quizId);

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="space-y-5">
          {/* Page header skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="h-5 w-48 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          </div>
          <Separator />
          <QuizDetailSkeleton />
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────
  if (!quiz) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-sm mx-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-zinc-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Quiz not found
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
            The quiz you're looking for doesn't exist or you don't have access.
          </p>
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

  return (
    <div className="min-h-screen">
      <div className="space-y-5">

        {/* ── Page header row ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="flex w-full items-center justify-between sm:w-auto">
            <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Quiz Details</h1>
          </div>
        </motion.div>

        {/* ── Quiz info card ───────────────────────────── */}
        <QuizInfoCard
          quiz={quiz}
          isFavorited={isFavorited}
          favoriteCount={favoriteCount}
          isTogglingFavorite={isTogglingFavorite}
          copied={copied}
          isCreator={isCreator}
          questionCount={questionCount}
          onHost={handleHostQuiz}
          onTryout={handleTryout}
          onEdit={handleEdit}
          onToggleFavorite={handleToggleFavorite}
          onShare={handleShare}
        />

        {/* ── Questions preview ────────────────────────── */}
        <QuestionsPreview
          questions={quiz.questions}
          questionCount={questionCount}
        />

      </div>
    </div>
  );
}