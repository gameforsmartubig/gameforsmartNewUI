"use client";

// ============================================================
// play/page.tsx — Shadcn Admin style
// Layout vertikal: TopBar → QuestionCard → QuestionNavigator
// Tanpa sticky header, tanpa sidebar.
// ============================================================

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useLearnPlay } from "./hooks/useLearnPlay";
import { PlayTopBar } from "./components/PlayTopBar";
import { QuestionCard } from "./components/QuestionCard";
import { QuestionNavigator } from "./components/QuestionNavigator";
import { FinishDialog } from "./components/FinishDialog";

function LearnPlayContent({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  const {
    loading, authLoading,
    learnSession, questions, responses,
    currentQuestionIndex, selectedAnswer,
    isSubmitting, timeLeft, progress,
    answeredCount, allQuestionsAnswered,
    showFinishConfirmation, setShowFinishConfirmation,
    selectAnswer,
    handleNextQuestion, handlePreviousQuestion,
    handleQuestionNavigation, handleFinishLearn,
    formatTime,
  } = useLearnPlay(sessionId);

  // ── Loading ─────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────
  if (!learnSession || !questions.length) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-sm mx-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-zinc-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Learning session not found
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
            The session you're looking for doesn't exist or has expired.
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

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">

        {/* ── Top bar: back + title + timer + progress ─── */}
        <PlayTopBar
          quizTitle={learnSession.quizzes?.title ?? "Quiz"}
          timeLeft={timeLeft}
          answeredCount={answeredCount}
          totalQuestions={questions.length}
          formatTime={formatTime}
        />

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_230px] gap-4">
        {/* ── Question card ─────────────────────────────── */}
        {currentQuestion ? (
          <QuestionCard
            question={currentQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            selectedAnswer={selectedAnswer}
            isSubmitting={isSubmitting}
            allQuestionsAnswered={allQuestionsAnswered}
            onSelectAnswer={selectAnswer}
            onPrevious={handlePreviousQuestion}
            onNext={handleNextQuestion}
            onFinish={() => setShowFinishConfirmation(true)}
          />
        ) : (
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardContent className="p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-zinc-400" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                No Questions Found
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
                This quiz has no questions or they could not be loaded.
              </p>
              <Button
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="gap-1.5 bg-zinc-900 hover:bg-zinc-700 text-white text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Question navigator grid ───────────────────── */}
        <QuestionNavigator
          questions={questions}
          responses={responses}
          currentQuestionIndex={currentQuestionIndex}
          onNavigate={handleQuestionNavigation}
        />
        </div>

      </div>

      {/* ── Finish confirmation dialog ────────────────── */}
      <FinishDialog
        open={showFinishConfirmation}
        answeredCount={answeredCount}
        totalQuestions={questions.length}
        onClose={() => setShowFinishConfirmation(false)}
        onConfirm={handleFinishLearn}
      />
    </div>
  );
}

export default function LearnPlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <LearnPlayContent sessionId={id} />;
}
