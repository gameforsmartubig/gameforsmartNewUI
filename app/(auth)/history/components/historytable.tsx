"use client";

import { useState, useEffect } from "react";
import { PaginationControl } from "@/components/pagination-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { QuizHistory } from "@/app/(auth)/history/page";
import { formatTimeAgo, cn } from "@/lib/utils";

interface Props {
  data: QuizHistory[];
}

export default function QuizHistoryTable({ data }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = data.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quiz</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Application</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  You still haven't played any quiz.
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <TableCell className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]" title={item.quiztitle}>
                    {item.quiztitle}
                  </TableCell>

                  <TableCell title="Category">{item.category || "-"}</TableCell>

                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      item.role === "host"
                        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    )}>
                      {item.role}
                    </span>
                  </TableCell>

                  <TableCell title="Language">{item.language ? item.language.toUpperCase() : "-"}</TableCell>

                  <TableCell>{item.application}</TableCell>

                  <TableCell
                    title={`${new Date(item.ended_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}${item.role === "player" && item.hostName ? ` (Host: ${item.hostName})` : ""}`}>
                    {formatTimeAgo(item.ended_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > 0 && (
        <PaginationControl
          totalItems={data.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
