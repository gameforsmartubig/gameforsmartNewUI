"use client";

// ============================================================
// _components/steps/QuestionsStep.tsx  (Shadcn Admin style)
// Tab 2 – question navigator + editor
// ============================================================

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, ChevronLeft, ChevronRight,
  FileText, Image as ImageIcon, CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import CompactImageUpload from "@/components/ui/compact-image-upload";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import type { Quiz } from "../../types";

// ── Answer card ──────────────────────────────────────────────
function AnswerCard({
  answer,
  answerIndex,
  questionId,
  isCorrect,
  onUpdateAnswer,
  onSetCorrect,
}: {
  answer: Quiz["questions"][0]["answers"][0];
  answerIndex: number;
  questionId: string;
  isCorrect: boolean;
  onUpdateAnswer: (qId: string, aId: string, field: string, value: any) => void;
  onSetCorrect: (qId: string, aId: string) => void;
}) {
  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        // Store as data URL preview — actual upload happens on Save
        const reader = new FileReader();
        reader.onloadend = () => {
          onUpdateAnswer(questionId, answer.id, "image_url", reader.result as string);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Image read failed:", err);
      }
    };
    input.click();
  };

  const label = String.fromCharCode(65 + answerIndex);

  return (
    <div
      className={cn(
        "rounded-lg border-2 transition-colors",
        isCorrect
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        {/* Color dot */}
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
          style={{ backgroundColor: answer.color }}
        >
          {label}
        </div>

        {/* Correct radio */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <div className="relative flex items-center">
            <input
              type="radio"
              name={`correct-${questionId}`}
              checked={isCorrect}
              onChange={() => onSetCorrect(questionId, answer.id)}
              className="peer appearance-none w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 checked:border-emerald-500 checked:bg-emerald-500 transition-all cursor-pointer"
              aria-label={`Jawaban ${label} benar`}
            />
            <CheckCircle2 className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-[3px]" />
          </div>
          <span className={cn(
            "text-[10px] font-semibold",
            isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
          )}>
            Benar
          </span>
        </label>

        {/* Image upload */}
        <button
          type="button"
          onClick={handleImageUpload}
          className="ml-auto flex items-center gap-1 text-[10px] text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ImageIcon className="w-3 h-3" />
          <span className="sr-only sm:not-sr-only">Gambar</span>
        </button>
      </div>

      {/* Text input */}
      <div className="px-3 pb-3">
        <Input
          value={answer.text}
          onChange={(e) => onUpdateAnswer(questionId, answer.id, "text", e.target.value)}
          placeholder={`Jawaban ${label}`}
          className="h-9 text-xs input"
        />
      </div>

      {/* Answer image */}
      {answer.image_url && (
        <div className="px-3 pb-3">
          <div className="relative w-full h-16 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <img src={answer.image_url} alt={`Answer ${label}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onUpdateAnswer(questionId, answer.id, "image_url", null)}
              className="absolute top-1 right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center"
            >×</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Question navigator sidebar ───────────────────────────────
function QuestionNavigator({
  questions,
  selectedIndex,
  onSelect,
}: {
  questions: Quiz["questions"];
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  const { t } = useI18n();

  const completedCount = questions.filter(
    (q) => q.text.trim().length > 0 && (q.answers.some((_, i) => q.correct === i.toString()) || q.image_url)
  ).length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden sticky top-4">
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Navigator</p>
          <span className="text-[10px] text-zinc-400 tabular-nums">
            {completedCount}/{questions.length} selesai
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                completedCount === questions.length && questions.length > 0
                  ? "bg-emerald-500"
                  : "bg-emerald-400/50"
              )}
              style={{ width: `${questions.length > 0 ? (completedCount / questions.length) * 100 : 0}%` }}
            />
          </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Dots */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((question, index) => {
            const isAnswered =
              question.text.trim().length > 0 &&
              (question.answers.some((a) => question.correct === a.id) || question.image_url);
            const isCurrent = selectedIndex === index;

            return (
              <button
                key={question.id}
                onClick={() => onSelect(index)}
                className={cn(
                  "w-7 h-7 rounded-md text-xs font-bold transition-all",
                  isCurrent
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                    : isAnswered
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          {[
            { color: "bg-orange-500", label: "Aktif" },
            { color: "bg-emerald-500", label: "Lengkap" },
            { color: "bg-zinc-100 dark:bg-zinc-800", label: "Kosong" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", item.color)} />
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Question editor ──────────────────────────────────────────
function QuestionEditor({
  quiz,
  question,
  questionIndex,
  onRemove,
  onUpdateQuestion,
  onUpdateAnswer,
  onSetCorrect,
  onPrev,
  onNext,
}: {
  quiz: Quiz;
  question: Quiz["questions"][0];
  questionIndex: number;
  onRemove: (id: string) => void;
  onUpdateQuestion: (id: string, field: string, value: any) => void;
  onUpdateAnswer: (qId: string, aId: string, field: string, value: any) => void;
  onSetCorrect: (qId: string, aId: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Question header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
            {questionIndex + 1}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Pertanyaan {questionIndex + 1}</h3>
            <p className="text-[10px] text-zinc-500 font-medium tracking-tight">Total {quiz.questions.length} Soal</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(question.id)}
          disabled={quiz.questions.length <= 1}
          className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-5 space-y-5">
        {/* Question text + image */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Question Text
          </Label>
          <div className="flex gap-3">
            <Textarea
              value={question.text}
              onChange={(e) => onUpdateQuestion(question.id, "text", e.target.value)}
              placeholder="Tuliskan pertanyaan Anda di sini..."
              rows={3}
              className="flex-1 input min-h-[100px] text-sm resize-none"
            />
            <div className="w-28 flex-shrink-0">
              <CompactImageUpload
                imageUrl={question.image_url || null}
                onImageChange={(url) => onUpdateQuestion(question.id, "image_url", url)}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Answer Choices ({question.answers.length})
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {question.answers.map((answer, aIndex) => (
              <AnswerCard
                key={answer.id}
                answer={answer}
                answerIndex={aIndex}
                questionId={question.id}
                isCorrect={question.correct === answer.id}
                onUpdateAnswer={onUpdateAnswer}
                onSetCorrect={onSetCorrect}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={questionIndex === 0}
          className="gap-1.5 h-8 text-xs rounded-lg"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </Button>
        <span className="text-xs text-zinc-400 tabular-nums">
            {questionIndex + 1} / {quiz.questions.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={questionIndex === quiz.questions.length - 1}
          className="gap-1.5 h-8 text-xs rounded-lg"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main QuestionsStep ───────────────────────────────────────
interface QuestionsStepProps {
  quiz: Quiz;
  selectedQuestionIndex: number;
  onSelectQuestion: (i: number) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (id: string) => void;
  onUpdateQuestion: (id: string, field: string, value: any) => void;
  onUpdateAnswer: (qId: string, aId: string, field: string, value: any) => void;
  onSetCorrectAnswer: (qId: string, aId: string) => void;
}

export function QuestionsStep({
  quiz,
  selectedQuestionIndex,
  onSelectQuestion,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  onUpdateAnswer,
  onSetCorrectAnswer,
}: QuestionsStepProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          onClick={onAddQuestion}
          className="button-orange gap-1.5 h-9 text-xs font-bold rounded-lg"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Pertanyaan
        </Button>
      </div>

      {/* Empty state */}
      {quiz.questions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            No Questions Yet
          </p>
          <p className="text-xs text-zinc-400 mb-4">Start editing your quiz by adding questions</p>
          <Button
            size="sm"
            onClick={onAddQuestion}
            className="gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Question
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_180px] gap-4 items-start">
          {/* Editor */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedQuestionIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {quiz.questions[selectedQuestionIndex] && (
                <QuestionEditor
                  quiz={quiz}
                  question={quiz.questions[selectedQuestionIndex]}
                  questionIndex={selectedQuestionIndex}
                  onRemove={onRemoveQuestion}
                  onUpdateQuestion={onUpdateQuestion}
                  onUpdateAnswer={onUpdateAnswer}
                  onSetCorrect={onSetCorrectAnswer}
                  onPrev={() => onSelectQuestion(Math.max(0, selectedQuestionIndex - 1))}
                  onNext={() => onSelectQuestion(Math.min(quiz.questions.length - 1, selectedQuestionIndex + 1))}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigator */}
          <QuestionNavigator
            questions={quiz.questions}
            selectedIndex={selectedQuestionIndex}
            onSelect={onSelectQuestion}
          />
        </div>
      )}
    </div>
  );
}
