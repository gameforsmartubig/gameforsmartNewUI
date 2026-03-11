"use client";

// ============================================================
// _components/QuizFormFields.tsx  (Shadcn Admin style)
// Shared quiz metadata form – title, desc, category, language,
// visibility, image. Used across InfoStep, GenerateStep, ImportStep.
// ============================================================

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Globe, Lock } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import type { QuizFormData } from "../types";
import ImageUpload from "@/components/ui/image-upload";

interface QuizFormFieldsProps {
  formData: QuizFormData;
  onChange: (updates: Partial<QuizFormData>) => void;
  idPrefix?: string;
}

// Reusable field wrapper
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</Label>
      {children}
    </div>
  );
}

export function QuizFormFields({ formData, onChange, idPrefix = "quiz" }: QuizFormFieldsProps) {
  const { t } = useI18n();

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Title */}
      <Field label="Title" className="sm:col-span-2">
        <Input
          id={`${idPrefix}-title`}
          placeholder="Title"
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-9 text-sm border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500"
        />
      </Field>

      {/* Description */}
      <Field label="Description" className="sm:col-span-2">
        <Textarea
          id={`${idPrefix}-description`}
          placeholder="Description"
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="text-sm border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500 resize-none"
        />
      </Field>

      {/* Category */}
      <Field label="Category">
        <Select value={formData.category} onValueChange={(v) => onChange({ category: v })}>
          <SelectTrigger className="h-9 text-sm border-zinc-200 dark:border-zinc-700">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {[
              { value: "general", emoji: "🌍", label: "General" },
              { value: "science", emoji: "🔬", label: "Science" },
              { value: "math", emoji: "📊", label: "Math" },
              { value: "history", emoji: "📚", label: "History" },
              { value: "geography", emoji: "🗺️", label: "Geography" },
              { value: "language", emoji: "💬", label: "Language" },
              { value: "technology", emoji: "💻", label: "Technology" },
              { value: "sports", emoji: "⚽", label: "Sports" },
              { value: "entertainment", emoji: "🎬", label: "Entertainment" },
              { value: "business", emoji: "💼", label: "Business" },
            ].map((c) => (
              <SelectItem key={c.value} value={c.value} className="text-sm">
                {c.emoji} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Language */}
      <Field label="Language">
        <Select value={formData.language} onValueChange={(v) => onChange({ language: v })}>
          <SelectTrigger className="h-9 text-sm border-zinc-200 dark:border-zinc-700">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id" className="text-sm">🇮🇩 Indonesia</SelectItem>
            <SelectItem value="en" className="text-sm">🇺🇸 English</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {/* Visibility */}
      <Field label="Visibility" className="sm:col-span-2">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            {formData.is_public
              ? <Globe className="w-4 h-4 text-emerald-500" />
              : <Lock className="w-4 h-4 text-zinc-400" />}
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {formData.is_public ? "Public" : "Private"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formData.is_public
                  ? "Quiz akan diajukan untuk review dan menjadi publik setelah disetujui"
                  : "Hanya Anda yang bisa melihat quiz ini"}
              </p>
            </div>
          </div>
          <Switch
            checked={formData.is_public}
            onCheckedChange={(checked) => onChange({ is_public: checked })}
          />
        </div>
      </Field>

      {/* Cover Image */}
      <Field label="Gambar Cover" className="sm:col-span-2">
        <ImageUpload
          imageUrl={formData.image_url}
          onImageChange={(url: any) => onChange({ image_url: url })}
          label=""
          className="w-full max-w-sm"
        />
      </Field>
    </div>
  );
}
