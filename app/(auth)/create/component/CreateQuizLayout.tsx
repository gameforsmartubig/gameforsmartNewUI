"use client";

// ============================================================
// _components/CreateQuizLayout.tsx
// Shadcn Admin Dashboard style – Tabs-based layout
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Wand2, Upload, PenLine, Eye, ArrowLeft,
  BookOpen, Settings2, ChevronRight, Sparkles,
  FileSpreadsheet, Save, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/hooks/use-i18n";

import { MethodStep } from "./steps/MethodStep";
import { InfoStep } from "./steps/InfoStep";
import { GenerateStep } from "./steps/GenerateStep";
import { ImportStep } from "./steps/ImportStep";
import { QuestionsStep } from "./steps/QuestionsStep";
import { PreviewStep } from "./steps/PreviewStep";
import { ValidationDialog, QuotaExceededDialog } from "./QuizDialogs";
import { useCreateQuiz } from "../hooks/useCreateQuiz";
import type { CreationMethod } from "../types";

// ---- Tab definition ----
type TabId = "method" | "details" | "questions" | "preview";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

export function CreateQuizLayout() {
  const router = useRouter();
  const { t } = useI18n();
  const quiz = useCreateQuiz();

  const [activeTab, setActiveTab] = useState<TabId>("method");

  const tabs: Tab[] = [
    {
      id: "method",
      label: "Metode",
      icon: Settings2,
      description: "Pilih cara membuat quiz",
    },
    {
      id: "details",
      label: "Detail Quiz",
      icon: BookOpen,
      description: "Informasi & pengaturan quiz",
    },
    {
      id: "questions",
      label: "Soal",
      icon: PenLine,
      description: "Buat & edit pertanyaan",
    },
    {
      id: "preview",
      label: "Preview",
      icon: Eye,
      description: "Tinjau & simpan",
    },
  ];

  const isTabEnabled = (tabId: TabId) => {
    if (tabId === "method") return true;
    if (tabId === "details") return quiz.selectedMethod !== null;
    if (tabId === "questions") return quiz.selectedMethod !== null;
    if (tabId === "preview") return quiz.questions.length > 0;
    return false;
  };

  const getTabBadge = (tabId: TabId): string | null => {
    if (tabId === "questions" && quiz.questions.length > 0) {
      return String(quiz.questions.length);
    }
    return null;
  };

  const isTabComplete = (tabId: TabId): boolean => {
    if (tabId === "method") return quiz.selectedMethod !== null;
    if (tabId === "details")
      return quiz.formData.title.trim().length > 0 && quiz.formData.description.trim().length > 0;
    if (tabId === "questions")
      return (
        quiz.questions.length > 0 &&
        quiz.questions.every(
          (q) =>
            q.question.trim() &&
            q.answers.some((a) => a.id === q.correct)
        )
      );
    return false;
  };

  const renderContent = () => {
    switch (activeTab) {
      case "method":
        return (
          <MethodStep
            selectedMethod={quiz.selectedMethod}
            onSelect={(method: CreationMethod) => {
              quiz.handleMethodSelection(method);
              // Auto navigate to details after selection delay
              setTimeout(() => setActiveTab("details"), 900);
            }}
          />
        );
      case "details":
        if (quiz.selectedMethod === "ai") {
          return (
            <GenerateStep
              formData={quiz.formData}
              onFormChange={(updates) =>
                quiz.setFormData((prev) => ({ ...prev, ...updates }))
              }
              aiPrompt={quiz.aiPrompt}
              onPromptChange={quiz.setAiPrompt}
              aiOptions={quiz.aiOptions}
              onAiOptionsChange={(updates) =>
                quiz.setAiOptions((prev) => ({ ...prev, ...updates }))
              }
              aiGenerating={quiz.aiGenerating}
              isProfileLoading={quiz.isProfileLoading}
              profileId={quiz.profileId}
              userQuota={quiz.userQuota}
              questionsCount={quiz.questions.length}
              onGenerate={async () => {
                await quiz.generateQuestionsWithAI();
                if (quiz.questions.length > 0) setActiveTab("questions");
              }}
            />
          );
        }
        if (quiz.selectedMethod === "excel") {
          return (
            <ImportStep
              formData={quiz.formData}
              onChange={(updates) =>
                quiz.setFormData((prev) => ({ ...prev, ...updates }))
              }
              questionsCount={quiz.questions.length}
              onImport={async (file) => {
                await quiz.handleExcelImport(file);
                setTimeout(() => setActiveTab("questions"), 600);
              }}
            />
          );
        }
        // manual
        return (
          <InfoStep
            formData={quiz.formData}
            onChange={(updates) =>
              quiz.setFormData((prev) => ({ ...prev, ...updates }))
            }
          />
        );
      case "questions":
        return (
          <QuestionsStep
            questions={quiz.questions}
            currentQuestionIndex={quiz.currentQuestionIndex}
            currentPage={quiz.currentPage}
            totalPages={quiz.totalPages}
            startIndex={quiz.startIndex}
            endIndex={quiz.endIndex}
            currentPageQuestions={quiz.currentPageQuestions}
            selectedMethod={quiz.selectedMethod}
            showAIHelper={quiz.showAIHelper}
            aiPrompt={quiz.aiPrompt}
            aiGenerating={quiz.aiGenerating}
            aiOptions={quiz.aiOptions}
            onSetShowAIHelper={quiz.setShowAIHelper}
            onAiPromptChange={quiz.setAiPrompt}
            onGenerateWithAI={quiz.generateQuestionsWithAI}
            onAddQuestion={quiz.addQuestion}
            onUpdateQuestion={quiz.updateQuestion}
            onUpdateAnswer={quiz.updateAnswer}
            onDeleteQuestion={quiz.deleteQuestion}
            onNavigateToQuestion={quiz.navigateToQuestion}
            onPageChange={quiz.setCurrentPage}
          />
        );
      case "preview":
        return (
          <PreviewStep
            formData={quiz.formData}
            questions={quiz.questions}
            onDownloadTemplate={quiz.downloadExcelTemplate}
          />
        );
    }
  };

  const methodLabel: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    ai: { label: "AI Generate", color: "bg-violet-100 text-violet-700 border-violet-200", icon: Sparkles },
    excel: { label: "Excel Import", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: FileSpreadsheet },
    manual: { label: "Manual", color: "bg-blue-100 text-blue-700 border-blue-200", icon: PenLine },
  };

  const selectedMethodInfo = quiz.selectedMethod ? methodLabel[quiz.selectedMethod] : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ─── Top Header bar ─── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex h-14 items-center gap-4 px-6">
          {/* Back */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 -ml-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Kembali</span>
          </Button>

          <Separator orientation="vertical" className="h-5" />

          {/* Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-white flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
            </div>
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Buat Quiz Baru
            </h1>
          </div>

          {/* Method badge */}
          {selectedMethodInfo && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <Badge
                variant="outline"
                className={cn("gap-1.5 text-xs font-medium", selectedMethodInfo.color)}
              >
                <selectedMethodInfo.icon className="w-3 h-3" />
                {selectedMethodInfo.label}
              </Badge>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Save button */}
          <Button
            size="sm"
            onClick={quiz.handleSubmit}
            disabled={quiz.loading || quiz.isSubmitting || quiz.questions.length === 0}
            className="gap-1.5 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white text-sm"
          >
            {quiz.loading || quiz.isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Simpan Quiz
              </>
            )}
          </Button>
        </div>
      </header>

      {/* ─── Tab Navigation ─── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-6">
          <nav className="flex gap-0" role="tablist">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isEnabled = isTabEnabled(tab.id);
              const isComplete = isTabComplete(tab.id);
              const badge = getTabBadge(tab.id);

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  disabled={!isEnabled}
                  onClick={() => isEnabled && setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-150 border-b-2 -mb-px focus-visible:outline-none",
                    isActive
                      ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                      : isEnabled
                      ? "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200"
                      : "border-transparent text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                  )}
                >
                  {/* Step number / complete indicator */}
                  <span
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold transition-colors",
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : isComplete
                        ? "bg-emerald-500 text-white"
                        : isEnabled
                        ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        : "bg-zinc-50 text-zinc-300 dark:bg-zinc-900 dark:text-zinc-700"
                    )}
                  >
                    {isComplete && !isActive ? "✓" : index + 1}
                  </span>

                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>

                  {badge && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-xs rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold leading-none">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ─── Main content ─── */}
      <div className="flex">
        {/* Content area */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {/* Tab heading */}
                <div className="mb-6">
                  {(() => {
                    const tab = tabs.find((t) => t.id === activeTab);
                    if (!tab) return null;
                    const Icon = tab.icon;
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                          </div>
                          <div>
                            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                              {tab.label}
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {tab.description}
                            </p>
                          </div>
                        </div>

                        {/* Next tab CTA */}
                        {activeTab !== "preview" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const tabOrder: TabId[] = ["method", "details", "questions", "preview"];
                              const nextIdx = tabOrder.indexOf(activeTab) + 1;
                              const nextTab = tabOrder[nextIdx];
                              if (nextTab && isTabEnabled(nextTab)) setActiveTab(nextTab);
                            }}
                            disabled={!isTabComplete(activeTab)}
                            className="gap-1.5 text-xs"
                          >
                            Lanjutkan
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Divider */}
                <Separator className="mb-6" />

                {/* Step content */}
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* ─── Right sidebar: progress summary ─── */}
        <aside className="hidden xl:block w-64 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 min-h-[calc(100vh-7rem)] sticky top-[7rem] self-start">
          <div className="p-5 space-y-5">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Progress
            </p>

            {/* Steps checklist */}
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isComplete = isTabComplete(tab.id);
                const isEnabled = isTabEnabled(tab.id);
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => isEnabled && setActiveTab(tab.id)}
                    disabled={!isEnabled}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors text-sm",
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        : isEnabled
                        ? "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        : "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cn(
                        "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                        isComplete
                          ? "bg-emerald-500 text-white"
                          : isActive
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                      )}
                    >
                      {isComplete ? "✓" : ""}
                    </span>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className={cn("font-medium", isActive && "font-semibold")}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Separator />

            {/* Quiz summary */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Ringkasan
              </p>
              <SummaryRow
                label="Metode"
                value={quiz.selectedMethod ? methodLabel[quiz.selectedMethod]?.label : "—"}
              />
              <SummaryRow
                label="Judul"
                value={quiz.formData.title || "—"}
                truncate
              />
              <SummaryRow
                label="Kategori"
                value={quiz.formData.category || "—"}
              />
              <SummaryRow
                label="Bahasa"
                value={quiz.formData.language === "id" ? "Indonesia" : "English"}
              />
              <SummaryRow
                label="Jumlah Soal"
                value={
                  quiz.questions.length > 0
                    ? `${quiz.questions.length} soal`
                    : "—"
                }
                highlight={quiz.questions.length > 0}
              />
              <SummaryRow
                label="Visibilitas"
                value={quiz.formData.is_public ? "Publik" : "Privat"}
              />
            </div>

            {/* Validation warning */}
            {quiz.validationIssues.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">
                  {quiz.validationIssues.length} soal perlu diperbaiki
                </p>
              </div>
            )}

            {/* Save CTA */}
            <Button
              className="w-full gap-1.5 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white text-sm"
              size="sm"
              onClick={quiz.handleSubmit}
              disabled={quiz.loading || quiz.isSubmitting || quiz.questions.length === 0}
            >
              {quiz.loading || quiz.isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Simpan Quiz
                </>
              )}
            </Button>
          </div>
        </aside>
      </div>

      {/* Dialogs */}
      <ValidationDialog
        open={quiz.showValidationDialog}
        onOpenChange={quiz.setShowValidationDialog}
        validationIssues={quiz.validationIssues}
        onFix={() => {
          quiz.handleFixValidation();
          setActiveTab("questions");
        }}
      />
      <QuotaExceededDialog
        open={quiz.showQuotaExceededDialog}
        onOpenChange={quiz.setShowQuotaExceededDialog}
      />
    </div>
  );
}

// ---- Small helper component ----
function SummaryRow({
  label,
  value,
  truncate = false,
  highlight = false,
}: {
  label: string;
  value: string;
  truncate?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">{label}</span>
      <span
        className={cn(
          "text-xs font-medium text-right",
          truncate && "truncate max-w-[120px]",
          highlight
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-700 dark:text-zinc-300"
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}
