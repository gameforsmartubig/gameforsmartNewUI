"use client";

// ============================================================
// _components/steps/MethodStep.tsx  (Shadcn Admin style)
// ============================================================

import { Wand2, Upload, PenLine, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { CreationMethod } from "../../types";

interface MethodCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  badges: { label: string; variant?: "default" | "secondary" | "outline" }[];
  selected: boolean;
  accentColor: string;
  onClick: () => void;
}

function MethodCard({ icon: Icon, title, description, badges, selected, accentColor, onClick }: MethodCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full text-left rounded-xl border-2 p-6 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
        selected
          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/50 shadow-sm"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
      )}
    >
      {selected && (
        <span className="absolute top-4 right-4">
          <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
        </span>
      )}

      <div
        className={cn(
          "mb-4 inline-flex w-10 h-10 items-center justify-center rounded-lg transition-colors",
          selected ? accentColor : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {badges.map((b) => (
          <Badge key={b.label} variant={b.variant ?? "secondary"} className="text-[10px] px-2 py-0 h-5 font-medium">
            {b.label}
          </Badge>
        ))}
      </div>
    </button>
  );
}

interface MethodStepProps {
  selectedMethod: CreationMethod | null;
  onSelect: (method: CreationMethod) => void;
}

export function MethodStep({ selectedMethod, onSelect }: MethodStepProps) {
  const methods: Array<{
    method: CreationMethod;
    icon: React.ElementType;
    title: string;
    description: string;
    badges: { label: string; variant?: "default" | "secondary" | "outline" }[];
    accentColor: string;
  }> = [
    {
      method: "ai",
      icon: Sparkles,
      title: "Generate dengan AI",
      description: "Deskripsikan topik quiz dan biarkan AI membuat soal secara otomatis. Cepat, cerdas, dan bisa diedit.",
      badges: [{ label: "Direkomendasikan", variant: "default" }, { label: "Cepat" }, { label: "Otomatis" }],
      accentColor: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    },
    {
      method: "excel",
      icon: Upload,
      title: "Import dari Excel",
      description: "Upload file Excel yang sudah berisi soal-soal. Cocok untuk memindahkan bank soal yang sudah ada.",
      badges: [{ label: "Bulk Import" }, { label: "Terstruktur" }],
      accentColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      method: "manual",
      icon: PenLine,
      title: "Buat Manual",
      description: "Ketik setiap pertanyaan dan jawaban satu per satu. Kontrol penuh atas setiap detail soal.",
      badges: [{ label: "Fleksibel" }, { label: "Kustomisasi penuh" }],
      accentColor: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
  ];

  return (
    <div className="space-y-6">

      <div className="grid gap-4 sm:grid-cols-3">
        {methods.map((m) => (
          <MethodCard key={m.method} {...m} selected={selectedMethod === m.method} onClick={() => onSelect(m.method)} />
        ))}
      </div>

      {/* {selectedMethod && (
        <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <span>Menyiapkan form...</span>
        </div>
      )} */}
    </div>
  );
}
