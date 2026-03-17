"use client";

// ============================================================
// _components/QuizInfoCard.tsx
// Card utama: cover image, title, meta, stats, creator, actions
// Shadcn Admin style — zinc palette, no gradient background
// ============================================================

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen, Check, Copy, Edit, Globe,
  Heart, Lock, Play, Share2, Users,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { QuizDetail } from "../types";

// Category fallback images

interface QuizInfoCardProps {
  quiz:                QuizDetail;
  isFavorited:         boolean;
  favoriteCount:       number;
  isTogglingFavorite:  boolean;
  copied:              boolean;
  isCreator:           boolean;
  questionCount:       number;
  onHost:              () => void;
  onTryout:            () => void;
  onEdit:              () => void;
  onToggleFavorite:    () => void;
  onShare:             () => void;
}

export function QuizInfoCard({
  quiz, isFavorited, favoriteCount, isTogglingFavorite,
  copied, isCreator, questionCount,
  onHost, onTryout, onEdit, onToggleFavorite, onShare,
}: QuizInfoCardProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden py-0">


        <CardContent className="px-5 py-5 space-y-4">

          {/* ── Title + description ──────────────────────── */}
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-1">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {quiz.description}
              </p>
            )}
          </div>

          {/* ── Meta badges ─────────────────────────────── */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs capitalize gap-1" title="Category">
              {quiz.category}
            </Badge>
            <Badge variant="secondary" className="text-xs uppercase gap-1" title="Language">
              {quiz.language}
            </Badge>
            <Badge variant="secondary" className="text-xs uppercase gap-1" title="Visibility">
              {quiz.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            </Badge>
            <Badge variant="outline" className="text-xs text-zinc-500" title="Created At">
              {formatTimeAgo(quiz.created_at)}
            </Badge>
          </div>

          {/* ── Stats ───────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: BookOpen, value: questionCount, label: "Questions",  color: "text-blue-500" },
              { icon: Users,    value: quiz.played ?? 0, label: "Played",  color: "text-violet-500" },
              { icon: Heart,    value: favoriteCount, label: "Favorites", color: "text-rose-500" },
            ].map(({ icon: Icon, value, label, color }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 py-2.5 px-2 text-center"
              >
                <Icon className={cn("w-4 h-4 mb-1", color)} />
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {value}
                </span>
                <span className="text-[10px] text-zinc-400">{label}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* ── Creator ─────────────────────────────────── */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push(`/profile/${quiz.creator.username}`)}
          >
            <Avatar className="w-8 h-8 border border-zinc-200 dark:border-zinc-700">
              <AvatarImage src={quiz.creator.avatar_url || ""} />
              <AvatarFallback className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {quiz.creator.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[11px] text-zinc-400">Created by</p>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                {quiz.creator.username}
              </p>
            </div>
          </div>          
        </CardContent>
      </Card>
    </motion.div>
  );
}