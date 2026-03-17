"use client";

// ============================================================
// play/_components/QuestionCard.tsx
// Shadcn Admin style — kartu soal full-width.
// Berisi: label soal, teks, gambar, pilihan jawaban, navigasi.
// ============================================================

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Question } from "../../../types";

interface QuestionCardProps {
  question:             Question;
  questionIndex:        number;
  totalQuestions:       number;
  selectedAnswer:       string | null;
  isSubmitting:         boolean;
  allQuestionsAnswered: boolean;
  onSelectAnswer:       (id: string) => void;
  onPrevious:           () => void;
  onNext:               () => void;
  onFinish:             () => void;
}

// ── Answer color palette ─────────────────────────────────────
type Scheme = { idle: string; selected: string; letter: string };
const SCHEMES: Record<string, Scheme> = {
  red:    { idle: "border-zinc-200 hover:border-red-300 hover:bg-red-50/60 dark:hover:bg-red-950/20 dark:border-zinc-700",    selected: "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-700",    letter: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  blue:   { idle: "border-zinc-200 hover:border-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 dark:border-zinc-700", selected: "border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700",  letter: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  yellow: { idle: "border-zinc-200 hover:border-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 dark:border-zinc-700", selected: "border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700", letter: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  green:  { idle: "border-zinc-200 hover:border-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 dark:border-zinc-700", selected: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700", letter: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  default:{ idle: "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50",    selected: "border-zinc-400 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-500",   letter: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
};

const LABELS = ["A", "B", "C", "D", "E", "F"];

export function QuestionCard({
  question, questionIndex, totalQuestions,
  selectedAnswer, isSubmitting, allQuestionsAnswered,
  onSelectAnswer, onPrevious, onNext, onFinish,
}: QuestionCardProps) {
  const isFirst = questionIndex === 0;
  const isLast  = questionIndex === totalQuestions - 1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionIndex}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm py-0 gap-0">

          {/* ── Question ────────────────────────────────── */}
          <CardHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="text-xs font-semibold px-2.5 h-6 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                Question {questionIndex + 1} / {totalQuestions}
              </Badge>
              {selectedAnswer && (
                <Badge
                  variant="outline"
                  className="text-xs gap-1 h-6 border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Answered
                </Badge>
              )}
            </div>

            <CardTitle className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
              {question.question_text}
            </CardTitle>

            {question.image_url && (
              <div className="mt-4 flex justify-center">
                <img
                  src={question.image_url}
                  alt="Question"
                  className="max-h-56 w-auto object-contain rounded-lg border border-zinc-200 dark:border-zinc-700"
                />
              </div>
            )}
          </CardHeader>

          <Separator />

          {/* ── Answers ─────────────────────────────────── */}
          <CardContent className="px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {question.answers
                .sort((a, b) => a.order_index - b.order_index)
                .map((answer, idx) => {
                  const isSelected = selectedAnswer === answer.id;
                  const scheme     = SCHEMES[answer.color] ?? SCHEMES.default;

                  return (
                    <button
                      key={answer.id}
                      onClick={() => !isSubmitting && onSelectAnswer(answer.id)}
                      disabled={isSubmitting}
                      className={cn(
                        "group relative flex items-start gap-3 w-full rounded-lg border-2 px-4 py-3",
                        "text-left transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                        isSelected ? scheme.selected : scheme.idle
                      )}
                    >
                      {/* Letter bubble */}
                      <span className={cn(
                        "shrink-0 w-7 h-7 rounded-md flex items-center justify-center",
                        "text-xs font-bold mt-0.5 transition-colors",
                        isSelected
                          ? "bg-white/70 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100"
                          : scheme.letter
                      )}>
                        {LABELS[idx] ?? idx + 1}
                      </span>

                      {/* Text */}
                      <div className="flex items-center w-full h-full flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed break-words">
                          {answer.answer_text}
                        </p>
                        {answer.image_url && (
                          <img
                            src={answer.image_url}
                            alt={`Answer ${LABELS[idx]}`}
                            className="mt-2 w-full max-h-20 object-contain rounded-md border border-zinc-200 dark:border-zinc-700"
                          />
                        )}
                      </div>

                      {/* Check icon */}
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-zinc-700 dark:text-zinc-300" />
                      )}

                      {/* Submitting overlay */}
                      {isSubmitting && isSelected && (
                        <div className="absolute inset-0 rounded-lg bg-zinc-900/5 dark:bg-white/5 animate-pulse" />
                      )}
                    </button>
                  );
                })}
            </div>
          </CardContent>

          <Separator />

          {/* ── Navigation ──────────────────────────────── */}
          <CardContent className="px-6 pt-4 pb-6">
            <div className="flex items-center justify-between gap-3">

              {/* Prev */}
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={isFirst}
                className="gap-1.5 text-xs h-8"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              {/* Center: submit button or dots indicator */}
              <div className="flex-1 flex justify-center">
                {allQuestionsAnswered ? (
                  <Button
                    onClick={onFinish}
                    size="sm"
                    className="gap-1.5 text-xs h-8 px-5 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Submit Tryout
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalQuestions, 9) }).map((_, i) => {
                      // Sliding window so current question is always shown
                      const offset = Math.max(
                        0, Math.min(questionIndex - 4, totalQuestions - 9)
                      );
                      const dotIdx = offset + i;
                      const isCur  = dotIdx === questionIndex;
                      return (
                        <div
                          key={dotIdx}
                          className={cn(
                            "rounded-full transition-all",
                            isCur
                              ? "w-4 h-2 bg-zinc-900 dark:bg-white"
                              : "w-2 h-2 bg-zinc-200 dark:bg-zinc-700"
                          )}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Next */}
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={isLast}
                className="gap-1.5 text-xs h-8"
              >
                <span className="hidden sm:inline">Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
