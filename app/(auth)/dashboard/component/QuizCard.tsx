"use client";

// ============================================================
// components/QuizCard.tsx
// Kartu individual quiz: badges, menu, info stats, tombol aksi
// ============================================================

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  CircleQuestionMark,
  MoreHorizontal,
  Play,
  Star,
  StarOff,
  Trash,
  CircleOff,
  User,
  Pencil,
  Globe,
  Lock
} from "lucide-react";
import type { Quiz, Category } from "./types";
import { categoryIconMap } from "./quiz-icons";

interface QuizCardProps {
  quiz: Quiz;
  tabKey: string;
  category?: Category;
  onHost: (quizId: string) => void;
  onEdit: (quizId: string) => void;
  onAnalytic: (quizId: string) => void;
  onToggleFavorite: (quiz: Quiz) => void;
  onDelete: (quiz: Quiz) => void;
}

export function QuizCard({
  quiz,
  tabKey,
  category,
  onHost,
  onEdit,
  onAnalytic,
  onToggleFavorite,
  onDelete
}: QuizCardProps) {
  const isFavorite = quiz._raw?.isFavorite;
  const isMyQuiz = tabKey === "myQuiz";

  return (
    <Card className="border-card py-0">
      <div className="vertical-line" />
      <CardContent className="flex flex-1 flex-col gap-2 px-5 py-4">
        {/* Badges + konteks menu */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <span title="Category" className="rounded-lg border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700 uppercase dark:border-green-700 dark:bg-green-900/30 dark:text-green-500">
              {category?.title ?? "Umum"}
            </span>
            <span title="Language" className="rounded-lg border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-bold text-yellow-700 uppercase dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">
              {quiz.language}
            </span>
            <span className="rounded-lg border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-bold text-yellow-700 uppercase dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">
              {quiz._raw?.isPublic ? <Globe size={16}/> : <Lock size={16}/>}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-orange-600 hover:bg-orange-50">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onToggleFavorite(quiz)}>
                {isFavorite ? (
                  <>
                    <StarOff className="mr-2 h-4 w-4 text-orange-500" />
                    <span>Unfavorite</span>
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4 text-orange-500" />
                    <span>Favorite</span>
                  </>
                )}
              </DropdownMenuItem>

              {isMyQuiz ? (
                <>
                  <DropdownMenuItem
                    className="text-red-600 dark:text-red-500"
                    onClick={() => onDelete(quiz)}
                  >
                    <Trash className="mr-2 h-4 w-4 text-red-600 dark:text-red-500" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 dark:text-red-500"
                    onClick={() => onEdit(quiz.id)}>
                    <Pencil className="mr-2 h-4 w-4 text-red-600 dark:text-red-500" />
                    Edit
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem className="text-red-600 dark:text-red-500">
                  <CircleOff className="mr-2 h-4 w-4 text-red-600 dark:text-red-500" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Judul */}
        {isMyQuiz ? (
          <h2
            className="line-clamp-1 text-lg font-bold text-zinc-800 dark:text-zinc-300 cursor-pointer"
            title={quiz.title}
            onClick={() => onAnalytic(quiz.id)}>
            {quiz.title}
          </h2>
        ) : (
          <h2
            className="line-clamp-1 text-lg font-bold text-zinc-800 dark:text-zinc-300"
            title={quiz.title}>
            {quiz.title}
          </h2>
        )}

        {/* Kreator */}
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-400">
          <User size={14} className="text-orange-500" />
          <span className="line-clamp-1">{quiz.creator}</span>
        </div>

        {/* Stats + tombol aksi */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
          <div className="flex items-center gap-4 text-xs font-medium text-zinc-700 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CircleQuestionMark size={14} className="text-green-500" />
              <span>{quiz.questions} Soal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Play size={14} className="text-yellow-500" />
              <span>{quiz.played} Main</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" className="button-orange" onClick={() => onHost(quiz.id)}>
              <Play className="mr-1 h-3 w-3 fill-current" /> Host
            </Button>
            <Button variant="outline" size="sm" className="button-yellow-outline">
              Tryout
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
