"use client";

// ============================================================
// _components/steps/PreviewStep.tsx  (Shadcn Admin style)
// Quiz preview before saving
// ============================================================

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  Download, Upload, Eye, CheckCircle2, Globe, Lock,
  BookOpen, Hash, Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { ANSWER_COLORS } from "../../utils/constants";
import type { QuizFormData, Question } from "../../types";

interface PreviewStepProps {
  formData: QuizFormData;
  questions: Question[];
  onDownloadTemplate: () => void;
}

const ANSWER_LABELS = ["A", "B", "C", "D"];

export function PreviewStep({ formData, questions, onDownloadTemplate }: PreviewStepProps) {
  const { t } = useI18n();
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const { exportQuestionsToExcel } = await import("@/lib/excel-utils");
      await exportQuestionsToExcel({
        title: formData.title || "Quiz",
        description: formData.description || "",
        category: formData.category,
        language: formData.language,
        questions: questions.map((q) => ({
          id: q.id,
          question_text: q.question,
          image_url: q.image,
          answers: q.answers.map((a, index) => ({
            id: a.id,
            answer_text: a.answer,
            is_correct: q.correct === a.id,
            color: ANSWER_COLORS[index],
            image_url: a.image,
          })),
        })),
      });
      toast({ title: "Berhasil", description: `${questions.length} soal berhasil diekspor` });
    } catch (error) {
      toast({ title: "Gagal", description: "Gagal mengekspor soal", variant: "destructive" });
    }
  };

  const completedCount = questions.filter(q =>
    q.question.trim() && q.answers.some((a) => a.id === q.correct)
  ).length;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Quiz summary card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-start gap-4 p-5">
          {/* Cover image */}
          {formData.image_url ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
              <Image src={formData.image_url} alt="Cover" width={64} height={64} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {formData.title || <span className="text-zinc-400">Judul belum diisi</span>}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
              {formData.description || "Deskripsi belum diisi"}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary" className="gap-1 text-[11px] h-5">
                <Hash className="w-3 h-3" />
                {questions.length} soal
              </Badge>
              <Badge variant="outline" className="gap-1 text-[11px] h-5 capitalize">
                {formData.category}
              </Badge>
              <Badge variant="outline" className="gap-1 text-[11px] h-5">
                <Languages className="w-3 h-3" />
                {formData.language === "id" ? "Indonesia" : "English"}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 text-[11px] h-5",
                  formData.is_public
                    ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                    : "border-zinc-200 text-zinc-500"
                )}
              >
                {formData.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {formData.is_public ? "Publik" : "Privat"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Completion status */}
        <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Kelengkapan soal</span>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">
              {completedCount}/{questions.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                completedCount === questions.length && questions.length > 0 ? "bg-emerald-500" : "bg-zinc-400"
              )}
              style={{ width: `${questions.length > 0 ? (completedCount / questions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onDownloadTemplate} className="gap-1.5 text-xs h-8">
          <Download className="w-3.5 h-3.5" />
          Download Template
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={questions.length === 0}
          className="gap-1.5 text-xs h-8"
        >
          <Upload className="w-3.5 h-3.5" />
          Export ke Excel
        </Button>
      </div>

      <Separator />

      {/* Questions list */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-zinc-500" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Preview Soal</p>
          </div>
          <Badge variant="secondary" className="text-xs">{questions.length} soal</Badge>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-12 text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Belum ada soal untuk dipreview</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
              >
                {/* Question */}
                <div className="flex items-start gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                      {question.question || <span className="text-zinc-400 italic">Pertanyaan kosong</span>}
                    </p>
                    {question.image && (
                      <div className="mt-2 w-16 h-12 rounded overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        <Image src={question.image} alt="Question" width={64} height={48} className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Answers */}
                <div className="grid grid-cols-2 gap-1.5 p-3">
                  {question.answers.map((answer, answerIndex) => {
                    const isCorrect = question.correct === answer.id;
                    return (
                      <div
                        key={answer.id}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs",
                          isCorrect
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
                            : "bg-zinc-50 text-zinc-600 border border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-400"
                        )}
                      >
                        <div
                          className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ backgroundColor: ANSWER_COLORS[answerIndex] }}
                        >
                          {ANSWER_LABELS[answerIndex]}
                        </div>
                        {answer.image && (
                          <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0">
                            <Image src={answer.image} alt="Answer" width={20} height={20} className="object-cover" />
                          </div>
                        )}
                        <span className="flex-1 truncate">{answer.answer}</span>
                        {isCorrect && <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
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
