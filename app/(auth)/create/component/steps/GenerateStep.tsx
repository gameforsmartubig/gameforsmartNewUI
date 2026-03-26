"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Wand2, Loader2, Zap, CheckCircle2 } from "lucide-react";
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
      {/* AI Prompt section */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">AI Smart Generator</p>
              <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">Automated Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <Zap className="w-3 h-3 text-orange-500" />
            <span className={userQuota.remainingTokens === 0 ? "text-red-500" : ""}>{userQuota.remainingTokens}</span>
            <span className="text-zinc-400">/ 2 Token</span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Status */}
          {questionsCount > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800 dark:text-green-300">{questionsCount} Soal terdeteksi</p>
                <p className="text-xs text-green-600/80 dark:text-green-400/80">
                  {aiOptions.appendToExisting ? "Menambah variasi soal baru." : "Akan mengganti semua soal lama."}
                </p>
              </div>
            </div>
          )}

          {/* Prompt */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Prompt Instruksi</Label>
            <Textarea
              placeholder="Contoh: Buatkan quiz tentang sejarah kemerdekaan Indonesia untuk siswa SMA..."
              value={aiPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              rows={4}
              className="input resize-none"
            />
          </div>

          {/* Settings row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Question count */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Jumlah Pertanyaan</Label>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">
                  {aiOptions.questionCount}
                </span>
              </div>
              <Slider
                min={5} max={50} step={5}
                value={[aiOptions.questionCount]}
                onValueChange={(v) => onAiOptionsChange({ questionCount: v[0] })}
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Min 5</span><span>Max 50</span>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Opsi</Label>
              {[
                { label: "Update metadata", key: "updateMetadata" as const, value: aiOptions.updateMetadata },
                { label: "Tambah ke koleksi", key: "appendToExisting" as const, value: aiOptions.appendToExisting },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onAiOptionsChange({ [opt.key]: !opt.value })}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors",
                    opt.value
                      ? "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                  )}
                >
                  {opt.label}
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center",
                    opt.value ? "bg-orange-500 border-orange-500 text-white" : "border-zinc-300 dark:border-zinc-700"
                  )}>
                    {opt.value && <span className="text-[8px]">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={onGenerate}
            disabled={isDisabled}
            className={cn(
              "w-full gap-2 h-10 text-sm font-bold rounded-lg",
              isDisabled ? "" : "button-orange"
            )}
          >
            {aiGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Mengolah data...</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Generate Sekarang</>
            )}
          </Button>
        </div>
      </div>

      {/* Quiz metadata */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Pengaturan Quiz</h3>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <QuizFormFields formData={formData} onChange={onFormChange} idPrefix="ai" />
        </div>
      </div>
    </div>
  );
}
