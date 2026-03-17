"use client";

// ============================================================
// settings/_components/SettingsForm.tsx — Shadcn Admin style
// ============================================================

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Clock, Hash, Info, Play } from "lucide-react";
import type { QuizForSettings } from "../../../types";

interface SettingsFormProps {
  quiz:             QuizForSettings;
  totalTimeMinutes: number;
  questionLimit:    string;
  isSaving:         boolean;
  profileId:        string | null;
  onTimeChange:     (v: number) => void;
  onLimitChange:    (v: string) => void;
  onBack:           () => void;
  onStart:          () => void;
}

export function SettingsForm({
  quiz, totalTimeMinutes, questionLimit, isSaving, profileId,
  onTimeChange, onLimitChange, onBack, onStart,
}: SettingsFormProps) {
  const isDisabled =
    isSaving || !profileId || !totalTimeMinutes ||
    totalTimeMinutes < 1 || totalTimeMinutes > 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-6xl"
    >
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm gap-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Learning Mode Settings
          </CardTitle>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Practice taking quizzes independently before the real exam.
          </p>
        </CardHeader>

        <Separator />

        <CardContent className="pt-5 space-y-6">

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Time */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Time Limit
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={totalTimeMinutes}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 0;
                    if (v >= 1 && v <= 60)             onTimeChange(v);
                    else if (v > 60)                    onTimeChange(60);
                    else if (v < 1 && e.target.value !== "") onTimeChange(1);
                  }}
                  min="1" max="60"
                  className="h-9 text-sm pr-16 border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500"
                  placeholder="10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">
                  minutes
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">1 – 60 minutes</p>
            </div>

            {/* Questions */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-zinc-400" />
                Number of Questions
              </Label>
              <Select value={questionLimit} onValueChange={onLimitChange}>
                <SelectTrigger className="h-9 text-sm border-zinc-200 dark:border-zinc-700 focus:ring-zinc-500 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quiz.questions.length > 0 &&
                    (quiz.questions.length <= 5 ? (
                      <SelectItem value="all" className="text-sm">
                        All ({quiz.questions.length} questions)
                      </SelectItem>
                    ) : (
                      <>
                        {Array.from(
                          { length: Math.floor(quiz.questions.length / 5) },
                          (_, i) => (i + 1) * 5
                        )
                          .filter((n) => n < quiz.questions.length)
                          .map((n) => (
                            <SelectItem key={n} value={n.toString()} className="text-sm">
                              {n} questions
                            </SelectItem>
                          ))}
                        <SelectItem value="all" className="text-sm">
                          All ({quiz.questions.length} questions)
                        </SelectItem>
                      </>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-zinc-400">Questions will be shuffled</p>
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">About Tryout Mode</p>
            </div>
            <ul className="space-y-1 ml-5 list-disc">
              {[
                "Practice independently at your own pace.",
                "Results do not affect the public leaderboard.",
                "Correct answers are shown after completion.",
                "Great for exam preparation.",
              ].map((f) => (
                <li key={f} className="text-xs text-zinc-500 dark:text-zinc-400">{f}</li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={onBack} className="flex-1 h-9 text-xs">
              Back
            </Button>
            <Button
              size="sm"
              onClick={onStart}
              disabled={isDisabled}
              className="flex-1 h-9 text-xs gap-2 bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900 rounded-full animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Start 
                </>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
