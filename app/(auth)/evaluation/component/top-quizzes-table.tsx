"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface Quiz {
  id: string;
  rank: number;
  name: string;
  plays: number;
  avgScore: number;
}

interface Props {
  quizzes: Quiz[];
  loading?: boolean;
  onQuizClick?: (quizId: string) => void;
}

export default function TopQuizzesTable({ quizzes, loading, onQuizClick }: Props) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">Most Played Quiz</h2>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Quiz</TableHead>
              <TableHead>Play</TableHead>
              <TableHead>Avg. Score</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Loading quizzes...
                </TableCell>
              </TableRow>
            ) : quizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                  Tidak ada kuis di rentang waktu ini.
                </TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz) => (
                <TableRow
                  key={quiz.rank}
                  className={
                    onQuizClick ? "hover:bg-muted/50 cursor-pointer transition-colors" : ""
                  }
                  onClick={() => onQuizClick && onQuizClick(quiz.id)}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                        quiz.rank === 1
                          ? "bg-yellow-500"
                          : quiz.rank === 2
                            ? "bg-gray-400"
                            : quiz.rank === 3
                              ? "bg-amber-600"
                              : "bg-blue-500"
                      }`}>
                      {quiz.rank}
                    </div>
                  </TableCell>

                  <TableCell>{quiz.name}</TableCell>

                  <TableCell>{quiz.plays.toLocaleString()}</TableCell>

                  <TableCell className="w-[200px]">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{quiz.avgScore}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
