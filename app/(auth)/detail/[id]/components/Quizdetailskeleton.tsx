"use client";

// ============================================================
// _components/QuizDetailSkeleton.tsx
// Loading skeleton untuk QuizInfoCard + QuestionsPreview
// ============================================================

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function QuizDetailSkeleton() {
  return (
    <div className="space-y-4 p-0 ">

      {/* Info card skeleton */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden py-0">
        <CardContent className="px-5 py-5 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          {/* Badges */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
          <Separator />
          {/* Creator */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Separator />
          {/* Buttons */}
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Questions skeleton */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm gap-0">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-md" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50">
                <Skeleton className="w-6 h-6 rounded-md shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 gap-1.5">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30">
                    <Skeleton className="w-5 h-5 rounded shrink-0" />
                    <Skeleton className="h-3 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}