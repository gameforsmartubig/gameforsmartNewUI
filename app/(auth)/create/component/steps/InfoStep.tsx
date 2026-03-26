"use client";

import { QuizFormFields } from "../QuizFormFields";
import type { QuizFormData } from "../../types";

interface InfoStepProps {
  formData: QuizFormData;
  onChange: (updates: Partial<QuizFormData>) => void;
}

export function InfoStep({ formData, onChange }: InfoStepProps) {
  return (
    <div className="max-w-2xl">
      <QuizFormFields formData={formData} onChange={onChange} idPrefix="manual" />
    </div>
  );
}
