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
      <Field label={t("createQuiz.info.quizTitle")} className="sm:col-span-2">
        <Input
          id={`${idPrefix}-title`}
          placeholder={t("createQuiz.info.quizTitlePlaceholder")}
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-9 text-sm border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500"
        />
      </Field>

      {/* Description */}
      <Field label={t("createQuiz.info.description")} className="sm:col-span-2">
        <Textarea
          id={`${idPrefix}-description`}
          placeholder={t("createQuiz.info.descriptionPlaceholder")}
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="text-sm border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-500 resize-none"
        />
      </Field>

      {/* Category */}
      <Field label={t("createQuiz.info.category")}>
        <Select value={formData.category} onValueChange={(v) => onChange({ category: v })}>
          <SelectTrigger className="h-9 text-sm border-zinc-200 dark:border-zinc-700">
            <SelectValue placeholder={t("createQuiz.info.categoryPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {[
              { value: "general", emoji: "🌍", label: t("dashboard.categories.general") },
              { value: "science", emoji: "🔬", label: t("dashboard.categories.science") },
              { value: "math", emoji: "📊", label: t("dashboard.categories.math") },
              { value: "history", emoji: "📚", label: t("dashboard.categories.history") },
              { value: "geography", emoji: "🗺️", label: t("dashboard.categories.geography") },
              { value: "language", emoji: "💬", label: t("dashboard.categories.language") },
              { value: "technology", emoji: "💻", label: t("dashboard.categories.technology") },
              { value: "sports", emoji: "⚽", label: t("dashboard.categories.sports") },
              { value: "entertainment", emoji: "🎬", label: t("dashboard.categories.entertainment") },
              { value: "business", emoji: "💼", label: t("dashboard.categories.business") },
            ].map((c) => (
              <SelectItem key={c.value} value={c.value} className="text-sm">
                {c.emoji} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Language */}
      <Field label={t("createQuiz.info.language")}>
        <Select value={formData.language} onValueChange={(v) => onChange({ language: v })}>
          <SelectTrigger className="h-9 text-sm border-zinc-200 dark:border-zinc-700">
            <SelectValue placeholder={t("createQuiz.info.languagePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id" className="text-sm">🇮🇩 {t("dashboard.languages.indonesia")}</SelectItem>
            <SelectItem value="en" className="text-sm">🇺🇸 {t("dashboard.languages.english")}</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {/* Visibility */}
      <Field label={t("createQuiz.generate.labels.visibility")} className="sm:col-span-2">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            {formData.is_public
              ? <Globe className="w-4 h-4 text-emerald-500" />
              : <Lock className="w-4 h-4 text-zinc-400" />}
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {formData.is_public ? t("createQuiz.info.visibility.public") : t("createQuiz.info.visibility.private")}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formData.is_public
                  ? "Quiz dapat ditemukan dan dimainkan oleh siapa saja"
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
