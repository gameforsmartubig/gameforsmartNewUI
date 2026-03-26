"use client";

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

export function QuizFormFields({ formData, onChange, idPrefix = "quiz" }: QuizFormFieldsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-title`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Judul Quiz</Label>
        <Input
          id={`${idPrefix}-title`}
          placeholder="Contoh: Pengetahuan Umum Dunia"
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="input"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-description`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Deskripsi</Label>
        <Textarea
          id={`${idPrefix}-description`}
          placeholder="Jelaskan tentang apa quiz ini..."
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="input resize-none"
        />
      </div>

      {/* Category + Language row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Kategori</Label>
          <Select value={formData.category} onValueChange={(v) => onChange({ category: v })}>
            <SelectTrigger className="input">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: "general", emoji: "🌍", label: "Umum" },
                { value: "science", emoji: "🔬", label: "Sains" },
                { value: "math", emoji: "📊", label: "Matematika" },
                { value: "history", emoji: "📚", label: "Sejarah" },
                { value: "geography", emoji: "🗺️", label: "Geografi" },
                { value: "language", emoji: "💬", label: "Bahasa" },
                { value: "technology", emoji: "💻", label: "Teknologi" },
                { value: "sports", emoji: "⚽", label: "Olahraga" },
                { value: "entertainment", emoji: "🎬", label: "Hiburan" },
                { value: "business", emoji: "💼", label: "Bisnis" },
              ].map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="mr-1.5">{c.emoji}</span> {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Bahasa</Label>
          <Select value={formData.language} onValueChange={(v) => onChange({ language: v })}>
            <SelectTrigger className="input">
              <SelectValue placeholder="Pilih Bahasa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">🇮🇩 Indonesia</SelectItem>
              <SelectItem value="en">🇺🇸 English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Visibility */}
      <div className={cn(
        "flex items-center justify-between rounded-lg border p-4 transition-colors",
        formData.is_public
          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10"
          : "border-zinc-200 dark:border-zinc-800"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            formData.is_public
              ? "bg-green-500 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          )}>
            {formData.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <p className={cn(
              "text-sm font-bold",
              formData.is_public ? "text-green-700 dark:text-green-400" : "text-zinc-800 dark:text-zinc-200"
            )}>
              {formData.is_public ? "Buka untuk Publik" : "Quiz Privat"}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {formData.is_public
                ? "Bisa dimainkan semua orang setelah disetujui."
                : "Hanya Anda yang bisa mengakses quiz ini."}
            </p>
          </div>
        </div>
        <Switch
          checked={formData.is_public}
          onCheckedChange={(checked) => onChange({ is_public: checked })}
          className="data-[state=checked]:bg-green-500"
        />
      </div>

      {/* Cover Image */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Gambar Cover</Label>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <ImageUpload
            imageUrl={formData.image_url}
            onImageChange={(url: any) => onChange({ image_url: url })}
            label=""
            className="w-full max-w-md mx-auto aspect-video rounded-lg overflow-hidden"
          />
          <p className="text-[10px] text-center text-zinc-400 mt-3 font-medium">
            Rekomendasi: 1200x630 pixel (JPG/PNG)
          </p>
        </div>
      </div>
    </div>
  );
}
