"use client";

// ============================================================
// play/_components/FinishDialog.tsx
// Shadcn Admin style — konfirmasi submit tryout
// ============================================================

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface FinishDialogProps {
  open:           boolean;
  answeredCount:  number;
  totalQuestions: number;
  onClose:        () => void;
  onConfirm:      () => void;
}

export function FinishDialog({
  open, answeredCount, totalQuestions, onClose, onConfirm,
}: FinishDialogProps) {
  const unanswered = totalQuestions - answeredCount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            </div>
            Complete the Tryout?
          </DialogTitle>
          <DialogDescription className="text-xs">
            {unanswered > 0
              ? `You still have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. You can go back and answer them before submitting.`
              : `You have answered all ${totalQuestions} questions. Ready to submit?`}
          </DialogDescription>
        </DialogHeader>

        {/* Summary row */}
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 text-sm">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Answered</span>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {answeredCount} / {totalQuestions}
          </span>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Continue Reviewing
          </Button>
          <Button
            size="sm"
            onClick={() => { onClose(); onConfirm(); }}
            className="gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 text-white"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
