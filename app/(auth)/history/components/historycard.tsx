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
            className="py-0 transition hover:shadow-md">
            <CardContent className="space-y-4 p-6">
              {/* Top Badge */}
              <div className="flex items-start justify-between">
                <Badge variant={quiz.role === "host" ? "default" : "secondary"}>
                  {quiz.role.toUpperCase()}
                </Badge>
              </div>
              {/* Title */}
              <div>
                <h3 className="truncate font-semibold" title={quiz.quiztitle}>
                  {quiz.quiztitle}
                </h3>
              </div>

              {/* Meta */}
              <div className="text-muted-foreground space-y-1 text-sm">
                <div
                  className="flex items-center gap-2"
                  title={`${quiz.ended_at}${
                    quiz.role === "player" && quiz.hostName ? ` (Host: ${quiz.hostName})` : ""
                  }`}>
                  <Calendar className="size-4" />
                  {formatTimeAgo(quiz.ended_at)}
                </div>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="size-4" />
                  {quiz.application}
                </div>
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
