"use client";

// ============================================================
// _components/EditQuizLayout.tsx
// Shadcn Admin Dashboard style – Tabs-based layout.
// Receives the full useEditQuiz() return value as `editQuiz`
// prop so the hook is only called once (in EditQuizContent).
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  PenLine, BookOpen, Info, Eye,
  Save, ChevronRight, AlertCircle, Globe, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

import { InfoStep } from "./steps/InfoStep";
import { QuestionsStep } from "./steps/QuestionsStep";
import { PreviewStep } from "./steps/PreviewStep";
import {
  SaveConfirmDialog,
  DeleteQuestionDialog,
  DeleteAnswerDialog,
  SavingOverlay,
  PublicRequestDialog,
} from "./EditQuizDialogs";
import { useEditQuiz } from "../hooks/useEditQuiz";

type EditQuizState = ReturnType<typeof useEditQuiz>;

// ── Tab definition ──────────────────────────────────────────
type TabId = "info" | "questions" | "preview";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: Tab[] = [
  { id: "info",      label: "Informasi",  icon: BookOpen,  description: "Informasi & pengaturan quiz" },
  { id: "questions", label: "Pertanyaan", icon: PenLine, description: "Buat & edit pertanyaan" },
  { id: "preview",   label: "Preview",    icon: Eye,   description: "Tinjau & simpan" },
];

interface EditQuizLayoutProps {
  editQuiz: EditQuizState;
}

export function EditQuizLayout({ editQuiz: q }: EditQuizLayoutProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("info");

  // quiz is guaranteed non-null by the parent guard
  const quiz = q.quiz!;

  // ── Tab helpers ─────────────────────────────────────────
  const isTabComplete = (tabId: TabId): boolean => {
    if (tabId === "info") {
      return quiz.title.trim().length > 0 && (quiz.description?.trim().length || 0) > 0;
    }
    if (tabId === "questions") {
      return (
        quiz.questions.length > 0 &&
        quiz.questions.some(
          (qn: any) => qn.text.trim().length > 0 && qn.answers.some((a: any) => qn.correct === a.id)
        )
      );
    }
    return false;
  };

  const getTabBadge = (tabId: TabId): string | null => null;

  const renderContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <InfoStep
            quiz={quiz}
            categories={q.categories}
            languages={q.languages}
            onUpdate={q.updateQuiz}
          />
        );
      case "questions":
        return (
          <QuestionsStep
            quiz={quiz}
            selectedQuestionIndex={q.selectedQuestionIndex}
            onSelectQuestion={q.setSelectedQuestionIndex}
            onAddQuestion={q.addQuestion}
            onRemoveQuestion={q.removeQuestion}
            onUpdateQuestion={q.updateQuestion}
            onUpdateAnswer={q.updateAnswer}
            onSetCorrectAnswer={q.setCorrectAnswer}
          />
        );
      case "preview":
        return (
          <PreviewStep
            quiz={quiz}
            categories={q.categories}
            languages={q.languages}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">

      {/* ── Top Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Edit Quiz</h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Step {TABS.findIndex(t => t.id === activeTab) + 1} of 3
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Visibility badge */}
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 text-xs font-bold hidden sm:flex",
              quiz.is_public
                ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700"
                : "border-zinc-200 text-zinc-500"
            )}
          >
            {quiz.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {quiz.is_public ? "Terpublikasi" : "Privat"}
          </Badge>
        </div>
      </header>

      {/* ── Tab Navigation ──────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-14 z-30">
        <div className="px-4 sm:px-6 max-w-[1400px] mx-auto flex items-center justify-between">
          <nav className="flex gap-0 overflow-hidden" role="tablist">
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const isComplete = isTabComplete(tab.id);
              const badge = getTabBadge(tab.id);

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px hover:cursor-pointer whitespace-nowrap",
                    isActive
                      ? "border-orange-500 text-orange-600 dark:text-orange-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  {/* Step number */}
                  <span
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0 transition-colors",
                      (isActive || isComplete)
                        ? "bg-orange-500 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {index + 1}
                  </span>

                  <span className="hidden sm:inline">{tab.label}</span>

                  {badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shrink-0">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="ml-4 shrink-0 py-2 hidden sm:block">
            <Button
              size="sm"
              onClick={q.handleSaveClick}
              disabled={q.saving || !quiz.title?.trim()}
              className="button-orange gap-1.5 h-8 px-4 text-xs font-bold rounded-lg"
            >
              {q.saving ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Simpan Perubahan</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex max-w-[1400px] mx-auto">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 w-full">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Tab heading row */}
                {(() => {
                  const tab = TABS.find((tb) => tb.id === activeTab)!;
                  const Icon = tab.icon;
                  return (
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {tab.label}
                          </h2>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {tab.description}
                          </p>
                        </div>
                      </div>

                      {activeTab !== "preview" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!isTabComplete(activeTab)}
                          onClick={() => {
                            const order: TabId[] = ["info", "questions", "preview"];
                            const next = order[order.indexOf(activeTab) + 1];
                            if (next) setActiveTab(next);
                          }}
                          className="gap-1.5 text-xs font-bold rounded-lg"
                        >
                          Lanjutkan
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })()}

              {/* Content */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6">
                {renderContent()}
              </div>
            </motion.div>
          </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────── */}
      <SaveConfirmDialog
        open={q.showSaveConfirm}
        quiz={quiz}
        categories={q.categories}
        languages={q.languages}
        onOpenChange={q.setShowSaveConfirm}
        onConfirm={q.saveQuiz}
      />
      <DeleteQuestionDialog
        open={q.showDeleteQuestionConfirm}
        skipConfirmation={q.skipQuestionDeleteConfirmation}
        onOpenChange={q.setShowDeleteQuestionConfirm}
        onSkipChange={q.setSkipQuestionDeleteConfirmation}
        onConfirm={q.confirmDeleteQuestion}
      />
      <DeleteAnswerDialog
        open={q.showDeleteAnswerConfirm}
        skipConfirmation={q.skipAnswerDeleteConfirmation}
        onOpenChange={q.setShowDeleteAnswerConfirm}
        onSkipChange={q.setSkipAnswerDeleteConfirmation}
        onConfirm={q.confirmDeleteAnswer}
      />
      <SavingOverlay saving={q.saving} savingProgress={q.savingProgress} />
      <PublicRequestDialog
        open={q.showPublicRequestDialog}
        onOpenChange={q.setShowPublicRequestDialog}
        onConfirm={q.confirmSaveAsPublicRequest}
      />
    </div>
  );
}


