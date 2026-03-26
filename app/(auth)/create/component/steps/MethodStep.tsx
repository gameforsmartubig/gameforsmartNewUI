"use client";

import { Sparkles, Upload, PenLine, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CreationMethod } from "../../types";

interface MethodCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  tags: string[];
  selected: boolean;
  accentColor: string;
  onClick: () => void;
}

function MethodCard({ icon: Icon, title, description, tags, selected, accentColor, onClick }: MethodCardProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full text-left rounded-xl border p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
        selected
          ? "border-orange-500 bg-orange-50/50 dark:bg-orange-900/10 shadow-sm"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-orange-300 dark:hover:border-zinc-700 hover:shadow-sm"
      )}
    >
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        </motion.div>
      )}

      <div className={cn(
        "mb-4 inline-flex w-10 h-10 items-center justify-center rounded-lg transition-colors",
        selected ? "bg-orange-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:text-orange-500"
      )}>
        <Icon className="w-5 h-5" />
      </div>

      <h3 className={cn(
        "text-base font-bold mb-1 transition-colors",
        selected ? "text-orange-600 dark:text-orange-400" : "text-zinc-900 dark:text-zinc-100"
      )}>
        {title}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
        {description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {tags.map((tag) => (
          <span key={tag} className={cn(
            "text-[10px] px-2 py-0.5 rounded-md font-bold",
            selected
              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          )}>
            {tag}
          </span>
        ))}
      </div>

      <div className={cn(
        "flex items-center gap-1 text-xs font-semibold transition-opacity",
        selected ? "text-orange-600 dark:text-orange-400 opacity-100" : "text-zinc-400 opacity-0 group-hover:opacity-100"
      )}>
        Pilih Metode <ArrowRight className="w-3 h-3" />
      </div>
    </motion.button>
  );
}

interface MethodStepProps {
  selectedMethod: CreationMethod | null;
  onSelect: (method: CreationMethod) => void;
}

export function MethodStep({ selectedMethod, onSelect }: MethodStepProps) {
  const methods = [
    {
      method: "ai" as CreationMethod,
      icon: Sparkles,
      title: "Generate AI",
      description: "Deskripsikan topik quiz dan biarkan AI merancang soal secara otomatis.",
      tags: ["Smart", "Auto"],
      accentColor: "orange",
    },
    {
      method: "excel" as CreationMethod,
      icon: Upload,
      title: "Import Excel",
      description: "Punya bank soal di Excel? Upload langsung dan hemat waktu.",
      tags: ["Bulk", "Fast"],
      accentColor: "green",
    },
    {
      method: "manual" as CreationMethod,
      icon: PenLine,
      title: "Manual",
      description: "Tambahkan pertanyaan satu per satu dengan kontrol penuh.",
      tags: ["Custom", "Full Control"],
      accentColor: "blue",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {methods.map((m) => (
        <MethodCard
          key={m.method}
          icon={m.icon}
          title={m.title}
          description={m.description}
          tags={m.tags}
          accentColor={m.accentColor}
          selected={selectedMethod === m.method}
          onClick={() => onSelect(m.method)}
        />
      ))}
    </div>
  );
}
