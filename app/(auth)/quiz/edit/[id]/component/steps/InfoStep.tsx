"use client";

// ============================================================
// _components/steps/InfoStep.tsx  (Shadcn Admin style)
// Tab 1 – quiz title, description, category, language,
//          visibility toggle, cover image
// ============================================================

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Globe, Lock } from "lucide-react";
import ImageUpload from "@/components/ui/image-upload";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import type { Quiz } from "../../types";

interface Category { value: string; label: string }
interface Language { value: string; label: string }

interface InfoStepProps {
  quiz: Quiz;
  categories: Category[];
  languages: Language[];
  onUpdate: (field: string, value: any) => void;
}

export function InfoStep({ quiz, categories, languages, onUpdate }: InfoStepProps) {
  const { t } = useI18n();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">

        {/* Title */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Judul Quiz</Label>
          <Input
            id="edit-title"
            placeholder="Masukkan judul quiz"
            value={quiz.title}
            onChange={(e) => onUpdate("title", e.target.value)}
            className="input h-10 text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Deskripsi</Label>
          <Textarea
            id="edit-description"
            placeholder="Masukkan deskripsi quiz"
            value={quiz.description || ""}
            onChange={(e) => onUpdate("description", e.target.value)}
            rows={3}
            className="input text-sm resize-none h-auto"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Kategori</Label>
          <Select value={quiz.category || "general"} onValueChange={(v) => onUpdate("category", v)}>
            <SelectTrigger className="input h-10 text-sm">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-sm">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Bahasa</Label>
          <Select value={quiz.language || "id"} onValueChange={(v) => onUpdate("language", v)}>
            <SelectTrigger className="input h-10 text-sm">
              <SelectValue placeholder="Pilih bahasa" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((l) => (
                <SelectItem key={l.value} value={l.value} className="text-sm">
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Visibility */}
        <div className={cn(
          "flex items-center justify-between rounded-lg border p-4 transition-colors sm:col-span-2",
          quiz.is_public
            ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10"
            : "border-zinc-200 dark:border-zinc-800"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              quiz.is_public
                ? "bg-green-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            )}>
              {quiz.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <p className={cn(
                "text-sm font-bold",
                quiz.is_public ? "text-green-700 dark:text-green-400" : "text-zinc-800 dark:text-zinc-200"
              )}>
                {quiz.is_public ? "Buka untuk Publik" : "Quiz Privat"}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {quiz.is_public
                  ? "Bisa dimainkan semua orang setelah disetujui."
                  : "Hanya Anda yang bisa mengakses quiz ini."}
              </p>
            </div>
          </div>
          <Switch
            checked={quiz.is_public}
            onCheckedChange={(checked) => onUpdate("is_public", checked)}
            className="data-[state=checked]:bg-green-500"
          />
        </div>

      </div>
    </div>
  );
}
