"use client";

import { useRef } from "react";
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
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Import Excel</p>
            <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">XLSX, XLS Supported</p>
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
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-16 h-16 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">{questionsCount} Soal Berhasil Diimpor!</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-xs">
                Data berhasil diproses. Anda bisa mengedit di tab <span className="font-bold text-green-600 dark:text-green-400">Soal</span>.
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-semibold text-zinc-400 hover:text-green-600 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload file berbeda
              </button>
            </div>
          ) : (
            <label
              htmlFor="excel-upload"
              className={cn(
                "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed px-6 py-14 cursor-pointer transition-colors",
                "border-zinc-200 dark:border-zinc-700",
                "hover:border-green-400 hover:bg-green-50/50 dark:hover:border-green-700 dark:hover:bg-green-900/10"
              )}
            >
              <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <FileUp className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Tarik & Lepas File ke Sini</p>
                <p className="text-xs text-zinc-400 mt-1">Atau klik untuk memilih file Excel dari perangkat Anda</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Pilih File Excel
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Quiz metadata */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Pengaturan Quiz</h3>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <QuizFormFields formData={formData} onChange={onChange} idPrefix="excel" />
        </div>
      </div>
    </div>
  );
}
