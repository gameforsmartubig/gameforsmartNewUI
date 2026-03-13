"use client";

// ============================================================
// components/DeleteQuizDialog.tsx
// Dialog konfirmasi hapus quiz — user harus menulis ulang
// nama quiz untuk bisa menghapus.
// ============================================================

import { useState, useEffect } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteQuizDialogProps {
  open: boolean;
  quizTitle: string;
  deleting: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}

export function DeleteQuizDialog({
  open,
  quizTitle,
  deleting,
  onOpenChange,
  onConfirm,
}: DeleteQuizDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (!open) setConfirmText("");
  }, [open]);

  const isMatch = confirmText.trim() === quizTitle.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="w-7 h-7 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            </div>
            Delete Quiz
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed mt-2">
            This action will delete your quiz. Deleted quizzes cannot be accessed or played again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
            <p className="text-xs text-red-700 dark:text-red-400">
              To confirm, retype the quiz name:
            </p>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300 mt-1 break-words">
              {quizTitle}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Quiz Name
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type quiz name here..."
              className="h-9 text-sm border-zinc-200 dark:border-zinc-700"
              autoFocus
              disabled={deleting}
            />
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={!isMatch || deleting}
            className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {deleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
