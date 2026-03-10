"use client";

// ============================================================
// layout.tsx
// Wraps create quiz route with QueryClientProvider so hooks
// like useQueryClient() work without error.
// ============================================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";

export default function CreateQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use a ref so the QueryClient instance is stable across re-renders
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
}