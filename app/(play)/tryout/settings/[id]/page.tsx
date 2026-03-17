"use client";

// ============================================================
// settings/page.tsx — Shadcn Admin style
// ============================================================

import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLearnSettings } from "./hooks/useLearnSettings";
import { SettingsForm } from "./components/SettingsForm";

function LearnSettingsContent({ quizId }: { quizId: string }) {
  const router = useRouter();
  const {
    quiz, profileId,
    totalTimeMinutes, setTotalTimeMinutes,
    questionLimit, setQuestionLimit,
    isLoading, isSaving, authLoading,
    saveSettingsAndProceed,
  } = useLearnSettings(quizId);

  // ── Loading ─────────────────────────────────────────────────
  if (isLoading || authLoading) {
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
  if (!quiz) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-sm mx-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-zinc-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Quiz not found</h2>
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* ── Settings form ────────────────────────────── */}
        <SettingsForm
          quiz={quiz}
          totalTimeMinutes={totalTimeMinutes}
          questionLimit={questionLimit}
          isSaving={isSaving}
          profileId={profileId}
          onTimeChange={setTotalTimeMinutes}
          onLimitChange={setQuestionLimit}
          onBack={() => router.push("/dashboard")}
          onStart={saveSettingsAndProceed}
        />

      </div>
    </div>
  );
}

export default function LearnSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <LearnSettingsContent quizId={id} />;
}
