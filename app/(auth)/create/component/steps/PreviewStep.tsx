"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Download, Upload, Eye, CheckCircle2, Globe, Lock,
  BookOpen, Hash, Languages, Sparkles, FileText,
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
  const isFullyComplete = completedCount === questions.length && questions.length > 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Summary card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Cover */}
          <div className="w-full sm:w-48 p-4 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 border-b sm:border-b-0 sm:border-r border-zinc-200 dark:border-zinc-800">
            {formData.image_url ? (
              <div className="aspect-video sm:aspect-square w-full rounded-lg overflow-hidden relative">
                <Image src={formData.image_url} alt="Cover" fill className="object-cover" />
              </div>
            ) : (
              <div className="aspect-video sm:aspect-square w-full rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-2">
                <BookOpen className="w-8 h-8 text-zinc-300" />
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
                {isFullyComplete ? "Ready to Publish" : "In Progress"}
              </Badge>
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded",
                formData.is_public
                  ? "bg-green-500 text-white"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              )}>
                {formData.is_public ? <><Globe className="w-3 h-3" /> Public</> : <><Lock className="w-3 h-3" /> Private</>}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-1">
                {formData.title || <span className="text-zinc-300">Untitled Quiz</span>}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {formData.description || "No description provided."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { icon: Hash, text: `${questions.length} Questions` },
                { icon: Sparkles, text: formData.category },
                { icon: Languages, text: formData.language === "id" ? "Indonesia" : "English" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-100 dark:border-zinc-700">
                  <item.icon className="w-3 h-3 text-orange-500" />
                  <span className="capitalize">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-zinc-400">Completion</span>
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">{completedCount}/{questions.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", isFullyComplete ? "bg-green-500" : "bg-orange-500")}
                  style={{ width: `${questions.length > 0 ? (completedCount / questions.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onDownloadTemplate} className="gap-1.5 text-xs font-semibold rounded-lg">
          <Download className="w-3.5 h-3.5" /> Download Template
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={questions.length === 0} className="gap-1.5 text-xs font-semibold rounded-lg">
          <Upload className="w-3.5 h-3.5" /> Export to Excel
        </Button>
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-zinc-400" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Preview Soal</h4>
          </div>
          <span className="text-xs font-semibold text-zinc-500">{questions.length} Questions</span>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800 py-12 text-center">
            <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Belum ada soal</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Question */}
                <div className="flex items-start gap-3 p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {question.question || <span className="text-zinc-300 italic">Pertanyaan kosong</span>}
                    </p>
                    {question.image && (
                      <div className="mt-2 w-32 aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        <Image src={question.image} alt="Q" width={128} height={72} className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Answers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
                  {question.answers.map((answer, ai) => {
                    const isCorrect = question.correct === answer.id;
                    return (
                      <div key={answer.id} className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm",
                        isCorrect
                          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          : "border-zinc-100 dark:border-zinc-800"
                      )}>
                        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: ANSWER_COLORS[ai] }}>
                          {ANSWER_LABELS[ai]}
                        </div>
                        <span className="flex-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{answer.answer}</span>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
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
