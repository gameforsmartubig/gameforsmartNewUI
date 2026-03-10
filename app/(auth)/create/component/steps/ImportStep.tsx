"use client";

// ============================================================
// _components/steps/ImportStep.tsx  (Shadcn Admin style)
// Excel file import + quiz metadata
// ============================================================

import { useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { FileSpreadsheet, Upload, CheckCircle2, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizFormFields } from "../QuizFormFields";
import type { QuizFormData } from "../../types";

interface ImportStepProps {
  formData: QuizFormData;
  onChange: (updates: Partial<QuizFormData>) => void;
  questionsCount: number;
  onImport: (file: File) => void;
}

export function ImportStep({ formData, onChange, questionsCount, onImport }: ImportStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Upload card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Import dari Excel</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Upload file .xlsx atau .xls</p>
          </div>
        </div>

        <div className="p-5">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
            }}
            className="hidden"
            id="excel-upload"
          />

          {questionsCount > 0 ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                {questionsCount} soal berhasil diimpor
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Anda bisa mengedit soal di tab <span className="font-medium text-zinc-700 dark:text-zinc-300">Soal</span>
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Upload file berbeda
              </button>
            </div>
          ) : (
            /* Drop zone */
            <label
              htmlFor="excel-upload"
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12",
                "border-zinc-200 dark:border-zinc-700 cursor-pointer",
                "hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <FileUp className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Klik untuk upload, atau drag & drop
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Format yang didukung: .xlsx, .xls
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <Upload className="w-3 h-3" />
                Pilih File
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Metadata section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
            Detail Quiz
          </p>
          <Separator className="flex-1" />
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <QuizFormFields formData={formData} onChange={onChange} idPrefix="excel" />
        </div>
      </div>
    </div>
  );
}
