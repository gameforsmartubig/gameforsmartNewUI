"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { QuizHistory } from "@/app/(auth)/history/page"

interface Props {
  data: QuizHistory[]
}

export default function QuizHistoryTable({ data }: Props) {
  return (
    <div className="rounded-xl border bg-background">
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
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                You still haven't played any quiz.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.quiztitle}
                </TableCell>

                <TableCell>{item.ended_at}</TableCell>

                <TableCell>{item.application}</TableCell>

                <TableCell className="text-right">
                  <Badge
                    variant={item.role === "host" ? "default" : "secondary"}
                  >
                    {item.role === "host" ? "HOST" : "PLAYER"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}