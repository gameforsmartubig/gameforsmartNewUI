"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationControlProps {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export function PaginationControl({
  totalItems,
  currentPage,
  onPageChange,
  itemsPerPage = 10
}: PaginationControlProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [jumpPage, setJumpPage] = useState("");
  const [activeInput, setActiveInput] = useState<"left" | "right" | null>(null);

  if (totalPages <= 1) return null;

  const handleJumpSubmit = () => {
    const page = parseInt(jumpPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
    setActiveInput(null);
    setJumpPage("");
  };

  const renderPageButton = (page: number) => (
    <Button
      key={`page-${page}`}
      variant={currentPage === page ? "default" : "outline"}
      size="icon"
      className={`h-8 w-8 transition-colors ${
        currentPage === page
          ? "border-orange-400 bg-orange-400 text-white hover:bg-orange-500" // Saat aktif (Halaman sekarang)
          : "border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
      }`}
      onClick={() => onPageChange(page)}>
      {page}
    </Button>
  );

  const renderEllipsisOrInput = (position: "left" | "right") => {
    if (activeInput === position) {
      return (
        <form
          key={`input-${position}`}
          onSubmit={(e) => {
            e.preventDefault();
            handleJumpSubmit();
          }}
          className="flex items-center">
          <Input
            className="h-8 w-8 border-slate-200 p-0 text-center text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 focus-visible:ring-1 focus-visible:ring-orange-400 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
            autoFocus
            onBlur={() => {
              setTimeout(() => setActiveInput(null), 200);
            }}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
          />
        </form>
      );
    }
    return (
      <Button
        key={`ellipsis-${position}`}
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
        onClick={() => {
          setActiveInput(position);
          setJumpPage("");
        }}>
        ...
      </Button>
    );
  };

  const renderItems = [];

  // Tombol Previous
  renderItems.push(
    <Button
      key="prev"
      variant="outline"
      size="icon"
      className="h-8 w-8 border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
  );

  // Logika Range Halaman
  const getPageNumbers = () => {
    const pages: (number | "left" | "right")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage === 1) {
        pages.push(1, 2, "right", totalPages);
      } else if (currentPage === totalPages) {
        pages.push(1, "left", totalPages - 1, totalPages);
      } else {
        pages.push(1);

        const start = currentPage - 1;
        const end = currentPage + 1;

        if (start > 2) pages.push("left");

        for (let i = Math.max(2, start); i <= Math.min(totalPages - 1, end); i++) {
          pages.push(i);
        }

        if (end < totalPages - 1) pages.push("right");

        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  pageNumbers.forEach((pageIndicator) => {
    if (pageIndicator === "left" || pageIndicator === "right") {
      renderItems.push(renderEllipsisOrInput(pageIndicator));
    } else {
      renderItems.push(renderPageButton(pageIndicator));
    }
  });

  // Tombol Next
  renderItems.push(
    <Button
      key="next"
      variant="outline"
      size="icon"
      className="h-8 w-8 border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage === totalPages}>
      <ChevronRight className="h-4 w-4" />
    </Button>
  );

  return <div className="flex items-center justify-center gap-2">{renderItems}</div>;
}
