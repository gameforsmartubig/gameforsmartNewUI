// components/quiz-history-card.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Grid } from "lucide-react";
import { QuizHistory } from "@/app/(auth)/history/page";

interface Props {
  quiz: QuizHistory[];
}

export default function QuizHistoryCard({ quiz }: Props) {
  return (
    <>
    {quiz.length === 0 && (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You still haven't played any quiz.</p>
      </div>
    )}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {quiz.map((quiz) => (
        <Card key={quiz.id} className="py-0 transition hover:shadow-md">
          <CardContent className="space-y-4 p-6">
            {/* Top Badge */}
            <div className="flex items-start justify-between">
              <Badge variant={quiz.role === "host" ? "default" : "secondary"}>
                {quiz.role.toUpperCase()}
              </Badge>
            </div>

            {/* Title */}
            <div>
              <h3 className="font-semibold">{quiz.quiztitle}</h3>
            </div>

            {/* Meta */}
            <div className="text-muted-foreground space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="size-4" />
                {quiz.ended_at}
              </div>
              <div className="flex items-center gap-2">
                <Grid className="size-4" />
                {quiz.application}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    </>
  );
}
