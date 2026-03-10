"use client";

// ============================================================
// _components/steps/QuestionsStep.tsx  (Shadcn Admin style)
// Question editor + sidebar navigator
// ============================================================

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, FileText,
  Zap, Image as ImageIcon, Loader2, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { uploadImage } from "@/lib/upload-image";
import { ANSWER_COLORS, QUESTIONS_PER_PAGE } from "../../utils/constants";
import type { Question, CreationMethod, AiOptions } from "../../types";
import CompactImageUpload from "@/components/ui/compact-image-upload";

// Answer label letters
const ANSWER_LABELS = ["A", "B", "C", "D"];

// ---- Single answer card ----
interface AnswerCardProps {
  answerId: string;
  answerIndex: number;
  answerText: string;
  answerImage: string | null;
  isCorrect: boolean;
  questionId: string;
  onUpdate: (questionId: string, answerId: string, field: string, value: unknown) => void;
}

function AnswerCard({ answerId, answerIndex, answerText, answerImage, isCorrect, questionId, onUpdate }: AnswerCardProps) {
  const color = ANSWER_COLORS[answerIndex];
  const label = ANSWER_LABELS[answerIndex];

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const url = await uploadImage(file);
          onUpdate(questionId, answerId, "image", url);
        } catch (err) {
          console.error(err);
        }
      }
    };
    input.click();
  };

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        isCorrect
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
      )}
    >
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        {/* Color dot + radio */}
        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: color }}
          >
            {label}
          </div>
          <input
            type="radio"
            name={`correct-${questionId}`}
            checked={isCorrect}
            onChange={() => onUpdate(questionId, answerId, "correct-radio", answerId)}
            className="w-3 h-3 accent-emerald-500"
            aria-label={`Jawaban ${label} benar`}
          />
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Benar</span>
        </label>

        {/* Image upload button */}
        <button
          type="button"
          onClick={handleImageUpload}
          className="ml-auto flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ImageIcon className="w-3 h-3" />
          <span>Gambar</span>
        </button>
      </div>

      <div className="px-3 pb-3">
        <Input
          value={answerText}
          onChange={(e) => onUpdate(questionId, answerId, "answer", e.target.value)}
          placeholder={`Jawaban ${label}`}
          className="h-8 text-xs border-zinc-200 dark:border-zinc-700 focus-visible:ring-emerald-400"
        />
      </div>

      {answerImage && (
        <div className="px-3 pb-3">
          <div className="relative w-full h-16 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <Image src={answerImage} alt={`Answer ${label}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => onUpdate(questionId, answerId, "image", null)}
              className="absolute top-1 right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center"
            >×</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Question editor panel ----
interface QuestionEditorProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onUpdateAnswer: (questionId: string, answerId: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

function QuestionEditor({ question, questionIndex, totalQuestions, onUpdate, onUpdateAnswer, onDelete, onPrev, onNext }: QuestionEditorProps) {
  const { t } = useI18n();

  // Proxy updateAnswer to handle correct radio special case
  const handleUpdateAnswer = (questionId: string, answerId: string, field: string, value: unknown) => {
    if (field === "correct-radio") {
      onUpdate(questionId, "correct", value);
    } else {
      onUpdateAnswer(questionId, answerId, field, value);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Question header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Soal
          </span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 tabular-nums">
            {questionIndex + 1} / {totalQuestions}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(question.id)}
          className="h-7 w-7 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="p-5 space-y-5">
        {/* Question text + image */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Pertanyaan</Label>
          <div className="flex gap-3">
            <Textarea
              value={question.question}
              onChange={(e) => onUpdate(question.id, "question", e.target.value)}
              placeholder="Tulis pertanyaan di sini..."
              rows={2}
              className="flex-1 text-sm border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500 resize-none"
            />
            <div className="w-28 flex-shrink-0">
              <CompactImageUpload
                imageUrl={question.image}
                onImageChange={(url: any) => onUpdate(question.id, "image", url)}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Pilihan Jawaban</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {question.answers.map((answer, aIndex) => (
              <AnswerCard
                key={answer.id}
                answerId={answer.id}
                answerIndex={aIndex}
                answerText={answer.answer}
                answerImage={answer.image}
                isCorrect={question.correct === answer.id}
                questionId={question.id}
                onUpdate={handleUpdateAnswer}
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
          className="gap-1.5 h-8 text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Sebelumnya
        </Button>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
          {questionIndex + 1} dari {totalQuestions}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={questionIndex === totalQuestions - 1}
          className="gap-1.5 h-8 text-xs"
        >
          Berikutnya
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ---- Question navigator sidebar ----
interface QuestionNavigatorProps {
  questions: Question[];
  currentQuestionIndex: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  currentPageQuestions: Question[];
  onNavigate: (index: number) => void;
  onPageChange: (page: number) => void;
}

function QuestionNavigator({ questions, currentQuestionIndex, currentPage, totalPages, startIndex, endIndex, currentPageQuestions, onNavigate, onPageChange }: QuestionNavigatorProps) {
  const completedCount = questions.filter(q =>
    q.question.trim() && q.answers.some((a) => a.id === q.correct) && q.answers.every(a => a.answer.trim())
  ).length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden sticky top-4">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Navigator</p>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">
            {completedCount}/{questions.length} selesai
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${questions.length > 0 ? (completedCount / questions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Page controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { const p = Math.max(0, currentPage - 1); onPageChange(p); onNavigate(p * QUESTIONS_PER_PAGE); }} disabled={currentPage === 0}>
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">{startIndex + 1}–{endIndex}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { const p = Math.min(totalPages - 1, currentPage + 1); onPageChange(p); onNavigate(p * QUESTIONS_PER_PAGE); }} disabled={currentPage >= totalPages - 1}>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Question dots */}
        <div className="flex flex-wrap gap-1.5">
          {currentPageQuestions.map((question, pageIndex) => {
            const globalIndex = startIndex + pageIndex;
            const isAnswered = question.question.trim() && question.answers.some((a) => a.id === question.correct) && question.answers.every(a => a.answer.trim());
            const isCurrent = currentQuestionIndex === globalIndex;

            return (
              <button
                key={question.id}
                onClick={() => onNavigate(globalIndex)}
                className={cn(
                  "w-7 h-7 rounded-md text-xs font-semibold transition-all",
                  isCurrent
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : isAnswered
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {globalIndex + 1}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          {[
            { color: "bg-zinc-900 dark:bg-white", label: "Sedang diedit" },
            { color: "bg-emerald-100 dark:bg-emerald-900/30", label: "Sudah diisi" },
            { color: "bg-zinc-100 dark:bg-zinc-800", label: "Belum diisi" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-sm", item.color)} />
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- AI Helper panel ----
interface AIHelperProps {
  aiPrompt: string;
  aiGenerating: boolean;
  onPromptChange: (v: string) => void;
  onGenerate: () => void;
  onClose: () => void;
}

function AIHelperPanel({ aiPrompt, aiGenerating, onPromptChange, onGenerate, onClose }: AIHelperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-500" />
            <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">AI Question Helper</p>
          </div>
          <button type="button" onClick={onClose} className="text-violet-400 hover:text-violet-600 text-lg leading-none">×</button>
        </div>
        <div className="space-y-3">
          <Textarea
            placeholder="Deskripsikan soal yang ingin dibuat dengan AI..."
            value={aiPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={2}
            className="text-sm border-violet-200 dark:border-violet-700 bg-white dark:bg-zinc-900 resize-none"
          />
          <Button
            onClick={onGenerate}
            disabled={!aiPrompt.trim() || aiGenerating}
            size="sm"
            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {aiGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ---- Main QuestionsStep ----
interface QuestionsStepProps {
  questions: Question[];
  currentQuestionIndex: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  currentPageQuestions: Question[];
  selectedMethod: CreationMethod | null;
  showAIHelper: boolean;
  aiPrompt: string;
  aiGenerating: boolean;
  aiOptions: AiOptions;
  onSetShowAIHelper: (v: boolean) => void;
  onAiPromptChange: (v: string) => void;
  onGenerateWithAI: () => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (id: string, field: string, value: unknown) => void;
  onUpdateAnswer: (questionId: string, answerId: string, field: string, value: unknown) => void;
  onDeleteQuestion: (id: string) => void;
  onNavigateToQuestion: (index: number) => void;
  onPageChange: (page: number) => void;
}

export function QuestionsStep({
  questions, currentQuestionIndex, currentPage, totalPages, startIndex, endIndex,
  currentPageQuestions, selectedMethod, showAIHelper, aiPrompt, aiGenerating, aiOptions,
  onSetShowAIHelper, onAiPromptChange, onGenerateWithAI, onAddQuestion,
  onUpdateQuestion, onUpdateAnswer, onDeleteQuestion, onNavigateToQuestion, onPageChange,
}: QuestionsStepProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedMethod === "manual" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetShowAIHelper(!showAIHelper)}
              className={cn("gap-1.5 h-8 text-xs", showAIHelper && "border-violet-400 text-violet-600 bg-violet-50 dark:bg-violet-900/20")}
            >
              <Zap className="w-3 h-3" />
              AI Helper
            </Button>
          )}
        </div>
        <Button
          size="sm"
          onClick={onAddQuestion}
          className="gap-1.5 h-8 text-xs bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Soal
        </Button>
      </div>

      {/* AI Helper */}
      <AnimatePresence>
        {selectedMethod === "manual" && showAIHelper && (
          <AIHelperPanel
            aiPrompt={aiPrompt}
            aiGenerating={aiGenerating}
            onPromptChange={onAiPromptChange}
            onGenerate={onGenerateWithAI}
            onClose={() => onSetShowAIHelper(false)}
          />
        )}
      </AnimatePresence>

      {/* Empty state */}
      {questions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Belum ada soal</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
            {selectedMethod === "manual" ? "Tambah soal pertama Anda" : "Kembali ke tab sebelumnya untuk generate/import soal"}
          </p>
          {selectedMethod === "manual" && (
            <Button size="sm" onClick={onAddQuestion} className="gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 text-white">
              <Plus className="w-3.5 h-3.5" />
              Tambah Soal Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_180px] gap-4 items-start">
          {/* Editor */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {questions[currentQuestionIndex] && (
                  <QuestionEditor
                    question={questions[currentQuestionIndex]}
                    questionIndex={currentQuestionIndex}
                    totalQuestions={questions.length}
                    onUpdate={onUpdateQuestion}
                    onUpdateAnswer={onUpdateAnswer}
                    onDelete={onDeleteQuestion}
                    onPrev={() => onNavigateToQuestion(Math.max(0, currentQuestionIndex - 1))}
                    onNext={() => onNavigateToQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigator */}
          <div>
            <QuestionNavigator
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              currentPageQuestions={currentPageQuestions}
              onNavigate={onNavigateToQuestion}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
