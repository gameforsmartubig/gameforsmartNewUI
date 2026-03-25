"use client";

// ============================================================
// components/QuizGrid.tsx
// Grid kartu quiz untuk satu tab: empty state + pagination
// ============================================================

import { QuizCard } from "./QuizCard";
import { PaginationControl } from "./PaginationControl";
import { ITEMS_PER_PAGE } from "../hooks/useDashboard";
import type { Quiz, Category } from "./types";

interface QuizGridProps {
  /** List quiz SUDAH difilter (untuk hitung total pagination) */
  quizzes:          Quiz[];
  /** Slice halaman aktif */
  paginatedQuizzes: Quiz[];
  tabKey:           string;
  categoryMap:      Record<string, Category>;
  currentPage:      number;
  onPageChange:     (page: number) => void;
  onHost:           (quizId: string) => void;
  onTryout:         (quizId: string) => void;
  onEdit:           (quizId: string) => void;
  onAnalytic:       (quizId: string) => void;
  onToggleFavorite: (quiz: Quiz) => void;
  onDelete:         (quiz: Quiz) => void;
}

export function QuizGrid({
  quizzes,
  paginatedQuizzes,
  tabKey,
  categoryMap,
  currentPage,
  onPageChange,
  onHost,
  onTryout,
  onEdit,
  onAnalytic,
  onToggleFavorite,
  onDelete
}: QuizGridProps) {
  if (quizzes.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 w-full flex-col items-center justify-center">
        <p>Tidak ada kuis yang ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedQuizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            tabKey={tabKey}
            category={categoryMap[quiz.categoryId]}
            onHost={onHost}
            onTryout={onTryout}
            onEdit={onEdit}
            onAnalytic={onAnalytic}
            onToggleFavorite={onToggleFavorite}
            onDelete={onDelete}
          />
        ))}
      </div>

      <PaginationControl
        totalItems={quizzes.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    </div>
  );
}
