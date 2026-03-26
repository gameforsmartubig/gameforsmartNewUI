"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  PenLine, Eye, BookOpen, Settings2, ChevronRight,
  Sparkles, FileSpreadsheet, Save, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-i18n";

import { MethodStep } from "./steps/MethodStep";
import { InfoStep } from "./steps/InfoStep";
import { GenerateStep } from "./steps/GenerateStep";
import { ImportStep } from "./steps/ImportStep";
import { QuestionsStep } from "./steps/QuestionsStep";
import { PreviewStep } from "./steps/PreviewStep";
import { ValidationDialog, QuotaExceededDialog, PublicRequestDialog } from "./QuizDialogs";
import { useCreateQuiz } from "../hooks/useCreateQuiz";
import type { CreationMethod } from "../types";

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
    { id: "method", label: "Metode", icon: Settings2, description: "Pilih cara membuat quiz" },
    { id: "details", label: "Detail Quiz", icon: BookOpen, description: "Informasi & pengaturan quiz" },
    { id: "questions", label: "Soal", icon: PenLine, description: "Buat & edit pertanyaan" },
    { id: "preview", label: "Preview", icon: Eye, description: "Tinjau & simpan" },
  ];

  const isTabEnabled = (tabId: TabId) => {
    if (tabId === "method") return true;
    if (tabId === "details") return quiz.selectedMethod !== null;
    if (tabId === "questions") return quiz.selectedMethod !== null;
    if (tabId === "preview") return quiz.questions.length > 0;
    return false;
  };

  const getTabBadge = (tabId: TabId): string | null => {
    if (tabId === "questions" && quiz.questions.length > 0) return String(quiz.questions.length);
    return null;
  };

  const isTabComplete = (tabId: TabId): boolean => {
    if (tabId === "method") return quiz.selectedMethod !== null;
    if (tabId === "details")
      return quiz.formData.title.trim().length > 0 && quiz.formData.description.trim().length > 0;
    if (tabId === "questions")
      return quiz.questions.length > 0 && quiz.questions.every(
        (q) => q.question.trim() && q.answers.some((a) => a.id === q.correct)
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
              setTimeout(() => setActiveTab("details"), 900);
            }}
          />
        );
      case "details":
        if (quiz.selectedMethod === "ai") {
          return (
            <GenerateStep
              formData={quiz.formData}
              onFormChange={(updates) => quiz.setFormData((prev) => ({ ...prev, ...updates }))}
              aiPrompt={quiz.aiPrompt}
              onPromptChange={quiz.setAiPrompt}
              aiOptions={quiz.aiOptions}
              onAiOptionsChange={(updates) => quiz.setAiOptions((prev) => ({ ...prev, ...updates }))}
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
              onChange={(updates) => quiz.setFormData((prev) => ({ ...prev, ...updates }))}
              questionsCount={quiz.questions.length}
              onImport={async (file) => {
                await quiz.handleExcelImport(file);
                setTimeout(() => setActiveTab("questions"), 600);
              }}
            />
          );
        }
        return (
          <InfoStep
            formData={quiz.formData}
            onChange={(updates) => quiz.setFormData((prev) => ({ ...prev, ...updates }))}
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
    ai: { label: "AI Generate", color: "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700", icon: Sparkles },
    excel: { label: "Excel Import", color: "border-green-400 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700", icon: FileSpreadsheet },
    manual: { label: "Manual", color: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700", icon: PenLine },
  };

  const selectedMethodInfo = quiz.selectedMethod ? methodLabel[quiz.selectedMethod] : null;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Buat Quiz Baru</h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Step {tabs.findIndex(t => t.id === activeTab) + 1} of 4
              </p>
            </div>
          </div>

          {selectedMethodInfo && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
              <span className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-bold", selectedMethodInfo.color)}>
                <selectedMethodInfo.icon className="w-3 h-3" />
                {selectedMethodInfo.label}
              </span>
            </motion.div>
          )}

          <div className="flex-1" />

          <Button
            size="sm"
            onClick={quiz.handleSubmit}
            disabled={quiz.loading || quiz.isSubmitting || quiz.questions.length === 0}
            className="button-orange gap-1.5 h-8 px-4 text-xs font-bold rounded-lg"
          >
            {quiz.loading || quiz.isSubmitting ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Simpan Quiz</>
            )}
          </Button>
        </div>
      </header>

      {/* ─── Tab Navigation ─── */}
      <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-14 z-30">
        <div className="px-4 sm:px-6 max-w-[1400px] mx-auto">
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
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px",
                    isActive
                      ? "border-orange-500 text-orange-600 dark:text-orange-400"
                      : isEnabled
                      ? "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                      : "border-transparent text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center",
                    isActive ? "bg-orange-500 text-white"
                      : isComplete ? "bg-green-500 text-white"
                      : isEnabled ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      : "bg-zinc-50 text-zinc-300 dark:bg-zinc-900 dark:text-zinc-700"
                  )}>
                    {isComplete && !isActive ? "✓" : index + 1}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
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
      <div className="flex max-w-[1400px] mx-auto">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tab heading */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {(() => {
                    const tab = tabs.find((t) => t.id === activeTab);
                    if (!tab) return null;
                    const Icon = tab.icon;
                    return (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{tab.label}</h2>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tab.description}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

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
                    className="gap-1.5 text-xs font-bold rounded-lg"
                  >
                    Lanjutkan <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Content */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6">
                {renderContent()}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ─── Right sidebar ─── */}
        <aside className="hidden xl:block w-64 shrink-0 py-6 pr-6">
          <div className="sticky top-32 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Workflow Progress</p>
              <div className="flex gap-1 mt-2">
                {[0,1,2,3].map(i => (
                  <div key={i} className={cn(
                    "h-1 flex-1 rounded-full",
                    tabs.findIndex(t => t.id === activeTab) >= i ? "bg-orange-500" : "bg-zinc-200 dark:bg-zinc-800"
                  )} />
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="p-3 space-y-1">
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
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left",
                      isActive
                        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                        : isEnabled
                        ? "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        : "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center",
                      isComplete ? "bg-green-500 text-white"
                        : isActive ? "bg-orange-500 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
                    )}>
                      {isComplete ? "✓" : ""}
                    </span>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Summary */}
            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Quick Summary</p>
              <SummaryRow label="Metode" value={quiz.selectedMethod ? methodLabel[quiz.selectedMethod]?.label : "—"} highlight={!!quiz.selectedMethod} />
              <SummaryRow label="Judul" value={quiz.formData.title || "—"} truncate />
              <SummaryRow label="Soal" value={quiz.questions.length > 0 ? `${quiz.questions.length} Soal` : "—"} highlight={quiz.questions.length > 0} />
              <SummaryRow label="Status" value={quiz.formData.is_public ? "Public" : "Private"} />
            </div>

            {/* Validation */}
            {quiz.validationIssues.length > 0 && (
              <div className="mx-3 mb-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-red-700 dark:text-red-400">Perhatian</p>
                  <p className="text-red-600/80 dark:text-red-400/80">{quiz.validationIssues.length} soal perlu koreksi.</p>
                </div>
              </div>
            )}

            {/* Save CTA */}
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                className="w-full button-orange gap-1.5 h-9 text-xs font-bold rounded-lg"
                onClick={quiz.handleSubmit}
                disabled={quiz.loading || quiz.isSubmitting || quiz.questions.length === 0}
              >
                {quiz.loading || quiz.isSubmitting ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading...</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Simpan Quiz</>
                )}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Dialogs */}
      <ValidationDialog
        open={quiz.showValidationDialog}
        onOpenChange={quiz.setShowValidationDialog}
        validationIssues={quiz.validationIssues}
        onFix={() => { quiz.handleFixValidation(); setActiveTab("questions"); }}
      />
      <QuotaExceededDialog open={quiz.showQuotaExceededDialog} onOpenChange={quiz.setShowQuotaExceededDialog} />
      <PublicRequestDialog open={quiz.showPublicRequestDialog} onOpenChange={quiz.setShowPublicRequestDialog} onConfirm={quiz.confirmSubmitAsPublicRequest} />
    </div>
  );
}

function SummaryRow({ label, value, truncate = false, highlight = false }: { label: string; value: string; truncate?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-zinc-400 dark:text-zinc-500">{label}</span>
      <span className={cn(
        "text-xs font-semibold text-right",
        truncate && "truncate max-w-[100px]",
        highlight ? "text-orange-600 dark:text-orange-400" : "text-zinc-700 dark:text-zinc-300"
      )} title={truncate ? value : undefined}>
        {value}
      </span>
    </div>
  );
}
