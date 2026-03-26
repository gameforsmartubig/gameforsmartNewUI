// components/quiz-history-card.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gamepad2 } from "lucide-react";
import { QuizHistory } from "@/app/(auth)/history/page";
import { PaginationControl } from "@/components/pagination-control";
import { formatTimeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  quiz: QuizHistory[];
}

export default function QuizHistoryCard({ quiz }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const router = useRouter();
  console.log(quiz);

  useEffect(() => {
    setCurrentPage(1);
  }, [quiz]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = quiz.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {quiz.length === 0 && (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">You still haven't played any quiz.</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentItems.map((quiz) => (
          <Card
            key={quiz.id}
            onClick={() => router.push(`/result/${quiz.id.split("-")[0]}`)}
            className="border-card py-0 transition-all hover:shadow-md cursor-pointer group relative overflow-hidden"
          >
            <div className={cn(
              "vertical-line",
              quiz.role === "host" ? "bg-green-500" : "bg-yellow-500"
            )} />
            <CardContent className="flex flex-1 flex-col gap-3 px-5 py-4">
              {/* Top Badge */}
              <div className="flex items-center justify-between">
                <span className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  quiz.role === "host"
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                )}>
                  {quiz.role}
                </span>
                <span className="text-[10px] font-medium text-zinc-400">
                  {formatTimeAgo(quiz.ended_at)}
                </span>
              </div>

              {/* Title */}
              <h3 className="line-clamp-2 text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-orange-600 transition-colors" title={quiz.quiztitle}>
                {quiz.quiztitle}
              </h3>

              {/* Meta */}
              <div className="mt-auto flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  <Gamepad2 size={13} className="text-orange-500" />
                  <span className="truncate max-w-[120px]">{quiz.application}</span>
                </div>
                {quiz.role === "player" && quiz.hostName && (
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="h-1 w-1 rounded-full bg-zinc-300" />
                    <span className="truncate max-w-[80px]">Host: {quiz.hostName}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {quiz.length > 0 && (
        <PaginationControl
          totalItems={quiz.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
