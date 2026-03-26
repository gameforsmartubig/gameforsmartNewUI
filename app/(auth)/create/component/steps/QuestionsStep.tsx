"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, FileText,
  Image as ImageIcon, Loader2, Wand2, CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { ANSWER_COLORS, QUESTIONS_PER_PAGE } from "../../utils/constants";
import type { Question, CreationMethod, AiOptions } from "../../types";
import CompactImageUpload from "@/components/ui/compact-image-upload";

const ANSWER_LABELS = ["A", "B", "C", "D"];

// ─── Answer Card ───
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
        const reader = new FileReader();
        reader.onloadend = () => onUpdate(questionId, answerId, "image", reader.result as string);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const isDataUrl = answerImage?.startsWith("data:");

  return (
    <div className={cn(
      "rounded-lg border p-3 transition-colors",
      isCorrect
        ? "border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-900/10"
        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
    )}>
      <div className="flex items-center gap-2.5 mb-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: color }}>
            {label}
          </div>
          <div className="relative flex items-center">
            <input
              type="radio"
              name={`correct-${questionId}`}
              checked={isCorrect}
              onChange={() => onUpdate(questionId, answerId, "correct-radio", answerId)}
              className="peer appearance-none w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 checked:border-green-500 checked:bg-green-500 transition-all cursor-pointer"
            />
            <CheckCircle2 className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-[3px]" />
          </div>
          <span className={cn(
            "text-[10px] font-semibold",
            isCorrect ? "text-green-600 dark:text-green-400" : "text-zinc-400"
          )}>
            Correct
          </span>
        </label>
        <button type="button" onClick={handleImageUpload} className="ml-auto text-zinc-400 hover:text-orange-500 transition-colors" title="Add image">
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <Input
        value={answerText}
        onChange={(e) => onUpdate(questionId, answerId, "answer", e.target.value)}
        placeholder={`Jawaban ${label}...`}
        className={cn("input h-9 text-sm", isCorrect ? "focus-visible:ring-green-500" : "")}
      />

      {answerImage && (
        <div className="mt-2 relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 group">
          {isDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={answerImage} alt={`Answer ${label}`} className="object-cover w-full h-full" />
          ) : (
            <Image src={answerImage} alt={`Answer ${label}`} fill className="object-cover" />
          )}
          <button
            type="button"
            onClick={() => onUpdate(questionId, answerId, "image", null)}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Question Editor ───
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
  const handleUpdateAnswer = (questionId: string, answerId: string, field: string, value: unknown) => {
    if (field === "correct-radio") {
      onUpdate(questionId, "correct", value);
    } else {
      onUpdateAnswer(questionId, answerId, field, value);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
            {questionIndex + 1}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Pertanyaan {questionIndex + 1}</h3>
            <p className="text-[10px] text-zinc-500">Total {totalQuestions} Soal</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(question.id)} className="h-8 w-8 text-zinc-400 hover:text-red-500 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-5 space-y-5">
        {/* Question text + media */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Teks Pertanyaan</Label>
            <Textarea
              value={question.question}
              onChange={(e) => onUpdate(question.id, "question", e.target.value)}
              placeholder="Tuliskan pertanyaan Anda di sini..."
              className="input min-h-[100px] resize-none"
            />
          </div>
          <div className="w-full md:w-48 shrink-0 space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Media</Label>
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
              <CompactImageUpload
                imageUrl={question.image}
                onImageChange={(url: any) => onUpdate(question.id, "image", url)}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Opsi Jawaban</Label>
            <p className="text-[10px] text-zinc-400">Pilih satu jawaban yang benar</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* Navigation */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={questionIndex === 0} className="gap-1 text-xs rounded-lg">
          <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
        </Button>
        <span className="text-[10px] text-zinc-400 font-semibold">{questionIndex + 1} / {totalQuestions}</span>
        <Button variant="outline" size="sm" onClick={onNext} disabled={questionIndex === totalQuestions - 1} className="gap-1 text-xs rounded-lg">
          Berikutnya <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Navigator Sidebar ───
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
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden sticky top-32">
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Navigator</p>
          <Badge variant="secondary" className="text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none px-1.5 py-0">
            {completedCount}/{questions.length}
          </Badge>
        </div>
        <div className="h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${questions.length > 0 ? (completedCount / questions.length) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="p-3 space-y-3">
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { const p = Math.max(0, currentPage - 1); onPageChange(p); onNavigate(p * QUESTIONS_PER_PAGE); }} disabled={currentPage === 0}>
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <span className="text-[10px] text-zinc-500 font-semibold">{startIndex + 1}–{endIndex}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { const p = Math.min(totalPages - 1, currentPage + 1); onPageChange(p); onNavigate(p * QUESTIONS_PER_PAGE); }} disabled={currentPage >= totalPages - 1}>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-1.5">
          {currentPageQuestions.map((question, pageIndex) => {
            const globalIndex = startIndex + pageIndex;
            const isAnswered = question.question.trim() && question.answers.some((a) => a.id === question.correct) && question.answers.every(a => a.answer.trim());
            const isCurrent = currentQuestionIndex === globalIndex;

            return (
              <button
                key={question.id}
                onClick={() => onNavigate(globalIndex)}
                className={cn(
                  "aspect-square rounded-lg text-[10px] font-bold flex items-center justify-center transition-colors",
                  isCurrent ? "bg-orange-500 text-white"
                    : isAnswered ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                )}
              >
                {globalIndex + 1}
              </button>
            );
          })}
        </div>

        <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px]">
          {[
            { color: "bg-orange-500", label: "Aktif" },
            { color: "bg-green-500", label: "Lengkap" },
            { color: "bg-zinc-200 dark:bg-zinc-800", label: "Kosong" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", item.color)} />
              <span className="text-zinc-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI Helper ───
interface AIHelperProps {
  aiPrompt: string;
  aiGenerating: boolean;
  onPromptChange: (v: string) => void;
  onGenerate: () => void;
  onClose: () => void;
}

function AIHelperPanel({ aiPrompt, aiGenerating, onPromptChange, onGenerate, onClose }: AIHelperProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4">
      <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">AI Helper</p>
              <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">Generate pertanyaan otomatis</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-lg font-bold">×</button>
        </div>
        <Textarea
          placeholder="Ketik topik soal..."
          value={aiPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={2}
          className="input resize-none mb-3"
        />
        <div className="flex justify-end">
          <Button onClick={onGenerate} disabled={!aiPrompt.trim() || aiGenerating} size="sm" className="button-orange gap-1.5 text-xs font-bold rounded-lg">
            {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {aiGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main QuestionsStep ───
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
              className={cn(
                "gap-1.5 text-xs font-semibold rounded-lg",
                showAIHelper ? "border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-900/10" : ""
              )}
            >
              <Sparkles className={cn("w-3.5 h-3.5", showAIHelper ? "text-orange-500" : "")} />
              AI Helper
            </Button>
          )}
        </div>
        <Button onClick={onAddQuestion} size="sm" className="button-orange gap-1.5 text-xs font-bold rounded-lg">
          <Plus className="w-3.5 h-3.5" /> Tambah Soal
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
        <div className="rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800 py-16 text-center">
          <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-1">Soal Masih Kosong</h3>
          <p className="text-sm text-zinc-500 mb-5 max-w-xs mx-auto">
            {selectedMethod === "manual"
              ? "Ayo mulai buat soal pertama Anda!"
              : "Generate atau import soal di tab sebelumnya."}
          </p>
          {selectedMethod === "manual" && (
            <Button onClick={onAddQuestion} className="button-orange gap-1.5 text-sm font-bold rounded-lg">
              <Plus className="w-4 h-4" /> Buat Soal Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-4 items-start">
          <div className="min-w-0">
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

          <div className="hidden lg:block">
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
