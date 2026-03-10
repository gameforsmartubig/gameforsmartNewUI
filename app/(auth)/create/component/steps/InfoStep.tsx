"use client";

// ============================================================
// _components/steps/InfoStep.tsx  (Shadcn Admin style)
// Step – Quiz basic information (used in Manual flow)
// ============================================================

import { QuizFormFields } from "../QuizFormFields";
import type { QuizFormData } from "../../types";

interface InfoStepProps {
  formData: QuizFormData;
  onChange: (updates: Partial<QuizFormData>) => void;
}

export function InfoStep({ formData, onChange }: InfoStepProps) {
  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <QuizFormFields formData={formData} onChange={onChange} idPrefix="manual" />
      </div>
    </div>
  );
}
