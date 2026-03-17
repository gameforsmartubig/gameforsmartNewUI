"use client";

// ============================================================
// _components/QuestionsPreview.tsx
// Daftar preview semua soal + pilihan jawaban
// Shadcn Admin style
// ============================================================

import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ANSWER_COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f"];
const LABELS        = ["A", "B", "C", "D", "E", "F"];

interface QuestionsPreviewProps {
  questions:     any[];
  questionCount: number;
}

export function QuestionsPreview({ questions, questionCount }: QuestionsPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
    >
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm gap-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            </div>
            Questions Preview
          </CardTitle>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Preview of all {questionCount} questions in this quiz
          </p>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          {questions && Array.isArray(questions) && questions.length > 0 ? (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {questions.map((question: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.04 }}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-700/50">
                    <span className="shrink-0 w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-400 mt-0.5 tabular-nums">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                        {question.question_text || question.question || "[No question text]"}
                      </p>
                      {(question.image_url || question.image) && (
                        <div className="mt-2 relative w-28 h-28 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                          <Image
                            src={question.image_url || question.image}
                            alt="Question image"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Answers grid */}
                  <div className="px-4 py-3">
                    {question.answers && question.answers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {question.answers.map((answer: any, aIdx: number) => {
                          const isCorrect =
                            answer.is_correct ||
                            question.correct === answer.id ||
                            question.correct === aIdx.toString();

                          return (
                            <div
                              key={aIdx}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-md border text-xs transition-colors",
                                isCorrect
                                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/20"
                                  : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30"
                              )}
                            >
                              {/* Color dot + letter */}
                              <span
                                className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                                style={{ backgroundColor: answer.color || ANSWER_COLORS[aIdx % ANSWER_COLORS.length] }}
                              >
                                {LABELS[aIdx] ?? aIdx + 1}
                              </span>

                              {/* Answer image */}
                              {(answer.image_url || answer.image) && (
                                <div className="shrink-0 w-7 h-7 rounded overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                  <Image
                                    src={answer.image_url || answer.image}
                                    alt="Answer"
                                    width={28}
                                    height={28}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              )}

                              {/* Answer text */}
                              <span className={cn(
                                "flex-1 leading-relaxed",
                                isCorrect
                                  ? "font-medium text-emerald-800 dark:text-emerald-300"
                                  : "text-zinc-700 dark:text-zinc-300"
                              )}>
                                {answer.answer_text || answer.answer}
                              </span>

                              {/* Correct check */}
                              {isCorrect && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic py-2">No answers available</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No questions available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}