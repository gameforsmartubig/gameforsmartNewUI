"use client";

// ============================================================
// _components/QuizDialogs.tsx  (Shadcn Admin style)
// ============================================================

import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationIssue } from "../types";

// ---- Validation Dialog ----

interface ValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationIssues: ValidationIssue[];
  onFix: () => void;
}

export function ValidationDialog({ open, onOpenChange, validationIssues, onFix }: ValidationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="w-7 h-7 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            </div>
            Validasi Soal Gagal
          </DialogTitle>
          <DialogDescription className="text-xs">
            {validationIssues.length} soal belum memenuhi ketentuan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {validationIssues.map((issue) => (
            <div
              key={issue.questionIndex}
              className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-red-800 dark:text-red-300">
                  Soal Nomor {issue.questionNumber}
                </p>
              </div>
              <ul className="space-y-1 ml-5.5">
                {issue.issues.map((text, idx) => (
                  <li key={idx} className="text-xs text-red-700 dark:text-red-400 list-disc list-inside">
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Tutup
          </Button>
          <Button
            size="sm"
            onClick={onFix}
            className="gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 text-white"
          >
            Perbaiki Soal
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Quota Exceeded Dialog ----

interface QuotaExceededDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuotaExceededDialog({ open, onOpenChange }: QuotaExceededDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            Token Habis
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Anda telah menggunakan{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">2 token AI</span>{" "}
            hari ini. Kembali lagi besok untuk mendapatkan token baru 🤗
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 text-white"
          >
            Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
