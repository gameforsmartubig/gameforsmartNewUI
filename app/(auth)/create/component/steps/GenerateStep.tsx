"use client";

// ============================================================
// _components/steps/GenerateStep.tsx  (Shadcn Admin style)
// AI generation form + quiz metadata
// ============================================================

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Wand2, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { QuizFormFields } from "../QuizFormFields";
import type { QuizFormData, AiOptions, UserQuota } from "../../types";

interface GenerateStepProps {
  formData: QuizFormData;
  onFormChange: (updates: Partial<QuizFormData>) => void;
  aiPrompt: string;
  onPromptChange: (value: string) => void;
  aiOptions: AiOptions;
  onAiOptionsChange: (updates: Partial<AiOptions>) => void;
  aiGenerating: boolean;
  isProfileLoading: boolean;
  profileId: string | null;
  userQuota: UserQuota;
  questionsCount: number;
  onGenerate: () => void;
}

export function GenerateStep({
  formData, onFormChange, aiPrompt, onPromptChange,
  aiOptions, onAiOptionsChange, aiGenerating, isProfileLoading,
  profileId, userQuota, questionsCount, onGenerate,
}: GenerateStepProps) {
  const { t } = useI18n();

  const isDisabled = !aiPrompt.trim() || aiGenerating || isProfileLoading;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* AI Prompt card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-7 h-7 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Question Generator</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Deskripsikan topik, AI akan membuat soal otomatis</p>
          </div>
          {/* Token quota */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <span className={cn(
              "font-semibold tabular-nums",
              userQuota.remainingTokens === 0 ? "text-red-500" : "text-zinc-700 dark:text-zinc-300"
            )}>
              {userQuota.remainingTokens}
            </span>
            <span>/ 2 token hari ini</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Existing questions status */}
          {questionsCount > 0 && (
            <div className="flex items-center gap-2.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {questionsCount} soal sudah ada.{" "}
                <span className="font-medium">
                  {aiOptions.appendToExisting ? "Soal baru akan ditambahkan." : "Semua soal akan diganti."}
                </span>
              </p>
            </div>
          )}

          {/* Prompt */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Prompt / Deskripsi Topik
            </Label>
            <Textarea
              id="ai-prompt"
              placeholder="Contoh: Buatkan quiz tentang sejarah kemerdekaan Indonesia untuk siswa SMA, mencakup tokoh pahlawan, tanggal penting, dan peristiwa bersejarah."
              value={aiPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              rows={4}
              className="text-sm border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500 resize-none"
            />
          </div>

          {/* Question count slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Jumlah Soal
              </Label>
              <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {aiOptions.questionCount} soal
              </span>
            </div>
            <Slider
              min={5} max={50} step={5}
              value={[aiOptions.questionCount]}
              onValueChange={(v) => onAiOptionsChange({ questionCount: v[0] })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
              <span>5 soal</span>
              <span>50 soal</span>
            </div>
          </div>

          {/* Options row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              {
                label: "Tambah ke soal yang ada",
                key: "appendToExisting" as const,
                value: aiOptions.appendToExisting,
              },
              {
                label: "Update judul & deskripsi",
                key: "updateMetadata" as const,
                value: aiOptions.updateMetadata,
              },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onAiOptionsChange({ [opt.key]: !opt.value })}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors text-left",
                  opt.value
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                )}
              >
                <span className={cn(
                  "w-3.5 h-3.5 rounded-sm border-2 flex-shrink-0 flex items-center justify-center",
                  opt.value ? "border-white bg-white" : "border-current"
                )}>
                  {opt.value && <span className="w-1.5 h-1.5 rounded-sm bg-zinc-900 dark:bg-zinc-900 block" />}
                </span>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <Button
            onClick={onGenerate}
            disabled={isDisabled}
            className={cn(
              "w-full gap-2 h-10 font-medium",
              isDisabled
                ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
                : "bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white"
            )}
          >
            {aiGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sedang membuat soal...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Soal dengan AI
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Separator + metadata section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
            Detail Quiz
          </p>
          <Separator className="flex-1" />
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <QuizFormFields formData={formData} onChange={onFormChange} idPrefix="ai" />
        </div>
      </div>
    </div>
  );
}
