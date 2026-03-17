"use client";

// ============================================================
// result/_components/AnswerReview.tsx — Shadcn Admin style
// ============================================================

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ListChecks, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionDetail } from "../../../types";

interface AnswerReviewProps {
  questionDetails: QuestionDetail[];
}

export function AnswerReview({ questionDetails }: AnswerReviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}>
      <Card className="gap-0 border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
              <ListChecks className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
            </div>
            Your Answer Summary
          </CardTitle>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Review your answers for each question
          </p>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-3 pt-4">
          {questionDetails.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: index * 0.04 }}
              className={cn(
                "space-y-3 rounded-lg border-2 px-4 py-3",
                question.is_correct
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20"
                  : "border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20"
              )}>
              {/* Question row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Question {index + 1}
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {question.question_text}
                  </p>
                  {question.image_url && (
                    <img
                      src={question.image_url}
                      alt="Question"
                      className="mt-2 max-h-28 w-auto rounded-md border border-zinc-200 object-contain dark:border-zinc-700"
                    />
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 shrink-0 gap-1 px-2 text-[11px]",
                    question.is_correct
                      ? "border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400"
                      : "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
                  )}>
                  {question.is_correct ? (
                    <CheckCircle2 className="h-2.5 w-2.5" />
                  ) : (
                    <XCircle className="h-2.5 w-2.5" />
                  )}
                  {question.is_correct ? "Correct" : "Wrong"}
                </Badge>
              </div>

              {/* Answer comparison */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {/* Your answer */}
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Your Answer:
                  </p>
                  <div
                    className={cn(
                      "rounded-md border px-3 py-2 text-xs",
                      question.is_correct
                        ? "border-emerald-200 bg-white dark:border-emerald-800/50 dark:bg-zinc-800"
                        : "border-red-200 bg-white dark:border-red-800/50 dark:bg-zinc-800"
                    )}>
                    {question.selected_answer ? (
                      <>
                        {question.selected_answer.answer_text && (
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">
                            {question.selected_answer.answer_text}
                          </p>
                        )}
                        {question.selected_answer.image_url && (
                          <img
                            src={question.selected_answer.image_url}
                            alt="Your answer"
                            className=" max-h-14 w-auto rounded border border-zinc-200 object-contain dark:border-zinc-700"
                          />
                        )}
                      </>
                    ) : (
                      <p className="text-zinc-400 italic">Not answered</p>
                    )}
                  </div>
                </div>

                {/* Correct answer */}
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Correct Answer:
                  </p>
                  <div className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs dark:border-emerald-800/50 dark:bg-zinc-800">
                    {question.correct_answer.answer_text && (
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">
                        {question.correct_answer.answer_text}
                      </p>
                    )}
                    {question.correct_answer.image_url && (
                      <img
                        src={question.correct_answer.image_url}
                        alt="Correct answer"
                        className=" max-h-14 w-auto rounded border border-zinc-200 object-contain dark:border-zinc-700"
                      />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
