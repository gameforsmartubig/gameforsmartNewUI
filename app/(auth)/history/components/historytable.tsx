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
import { formatTimeAgo } from "@/lib/utils";

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
              <TableHead>Date</TableHead>
              <TableHead>Application</TableHead>
              <TableHead className="text-right">Role</TableHead>
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
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.quiztitle}</TableCell>

                  <TableCell
                    title={`${item.ended_at}${
                      item.role === "player" && item.hostName ? ` (Host: ${item.hostName})` : ""
                    }`}>
                    {formatTimeAgo(item.ended_at)}
                  </TableCell>

                  <TableCell>{item.application}</TableCell>

                  <TableCell className="text-right">
                    <Badge variant={item.role === "host" ? "default" : "secondary"}>
                      {item.role === "host" ? "HOST" : "PLAYER"}
                    </Badge>
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
