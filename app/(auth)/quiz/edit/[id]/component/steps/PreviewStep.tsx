"use client";

// ============================================================
// _components/steps/PreviewStep.tsx  (Shadcn Admin style)
// Tab 3 – quiz summary + questions list read-only preview
// ============================================================

import { Upload, Eye, CheckCircle2, Globe, Lock, BookOpen, Hash, Languages, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import type { Quiz } from "../../types";

interface Category { value: string; label: string }
interface Language { value: string; label: string }

interface PreviewStepProps {
  quiz: Quiz;
  categories: Category[];
  languages: Language[];
}

export function PreviewStep({ quiz, categories, languages }: PreviewStepProps) {
  const { t } = useI18n();
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const { exportQuestionsToExcel } = await import("@/lib/excel-utils");
      await exportQuestionsToExcel({
        title: quiz.title || t("editQuiz.messages.exportedQuiz"),
        description: quiz.description || "",
        category: quiz.category || "general",
        language: quiz.language || "id",
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question_text: q.text,
          time_limit: q.timeLimit,
          image_url: q.image_url || null,
          answers: q.answers.map((a, index) => ({
            id: a.id,
            answer_text: a.text,
            is_correct: q.correct === a.id,
            color: a.color,
            order_index: index,
            image_url: a.image_url || null,
          })),
        })),
      });
      toast({
        title: t("common.success"),
        description: t("editQuiz.messages.questionsExported", { count: quiz.questions.length }),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("editQuiz.messages.failedExportQuestions"),
        variant: "destructive",
      });
    }
  };

  const completedCount = quiz.questions.filter(
    (q) => q.text.trim().length > 0 && q.answers.some((a) => a.id === q.correct)
  ).length;
  const isFullyComplete = completedCount === quiz.questions.length && quiz.questions.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Summary card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Cover */}
          <div className="w-full sm:w-48 p-4 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 border-b sm:border-b-0 sm:border-r border-zinc-200 dark:border-zinc-800 shrink-0">
            {quiz.image_url ? (
              <div className="aspect-video sm:aspect-square w-full rounded-lg overflow-hidden relative border border-zinc-200 dark:border-zinc-700">
                <Image src={quiz.image_url} alt="Cover" fill className="object-cover" />
              </div>
            ) : (
              <div className="aspect-video sm:aspect-square w-full rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center gap-2">
                <BookOpen className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                <p className="text-[10px] text-zinc-400 font-medium">No Cover</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-5 flex-1 min-w-0 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className={cn(
                "text-[10px] font-bold rounded",
                isFullyComplete ? "border-green-400 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400" : "border-orange-400 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400"
              )}>
                {isFullyComplete ? "Ready to Save" : "Progress: " + Math.round((completedCount/quiz.questions.length)*100) + "%"}
              </Badge>
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded",
                quiz.is_public
                  ? "bg-green-500 text-white"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              )}>
                {quiz.is_public ? <><Globe className="w-3 h-3" /> Public</> : <><Lock className="w-3 h-3" /> Private</>}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-1 truncate">
                {quiz.title || <span className="text-zinc-300 italic">Untitled Quiz</span>}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {quiz.description || "No description provided."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { icon: Hash, text: `${quiz.questions.length} Questions` },
                { icon: Sparkles, text: categories.find(c => c.value === quiz.category)?.label || quiz.category },
                { icon: Languages, text: languages.find(l => l.value === quiz.language)?.label || quiz.language },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-100 dark:border-zinc-700">
                  <item.icon className="w-3 h-3 text-orange-500" />
                  <span className="capitalize">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-zinc-400">Question Completion</span>
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 tabular-nums">{completedCount}/{quiz.questions.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", isFullyComplete ? "bg-green-500" : "bg-orange-500")}
                  style={{ width: `${quiz.questions.length > 0 ? (completedCount / quiz.questions.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={quiz.questions.length === 0}
          className="gap-1.5 text-xs font-semibold rounded-lg h-9"
        >
          <Upload className="w-3.5 h-3.5" />
          Export to Excel
        </Button>
      </div>

      <Separator className="bg-zinc-100 dark:bg-zinc-800" />

      {/* Questions list preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-zinc-400" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Preview Soal</h4>
          </div>
          <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0 min-h-5">{quiz.questions.length} Questions</Badge>
        </div>

        {quiz.questions.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 py-12 text-center">
            <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Belum ada soal</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {quiz.questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950"
              >
                {/* Question body */}
                <div className="flex items-start gap-4 p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-relaxed">
                      {question.text || <span className="text-zinc-300 italic">Pertanyaan kosong</span>}
                    </p>
                    {question.image_url && (
                      <div className="mt-3 w-40 aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                        <img src={question.image_url} alt={`Q ${index + 1}`} className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Answer choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 bg-white dark:bg-zinc-950">
                  {question.answers.map((answer, aIndex) => {
                    const isCorrect = question.correct === answer.id;
                    return (
                      <div
                        key={answer.id}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-colors",
                          isCorrect
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/10 dark:border-emerald-800 dark:text-emerald-300"
                            : "border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                        )}
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: answer.color }}
                        >
                          {String.fromCharCode(65 + aIndex)}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                           {answer.image_url && (
                            <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                              <Image src={answer.image_url} alt="A" width={24} height={24} className="object-cover" />
                            </div>
                           )}
                           <span className="truncate text-xs font-medium">{answer.text || "—"}</span>
                        </div>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
