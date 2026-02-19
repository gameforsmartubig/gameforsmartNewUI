"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface PaginationControlProps {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export function PaginationControlGroup({
  totalItems,
  currentPage,
  onPageChange,
  itemsPerPage = 12
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
      key={page}
      variant={currentPage === page ? "default" : "outline"}
      size="icon"
      className="h-8 w-8"
      onClick={() => onPageChange(page)}>
      {page}
    </Button>
  );

  const renderEllipsisOrInput = (position: "left" | "right") => {
    if (activeInput === position) {
      return (
        <form
          key={position}
          onSubmit={(e) => {
            e.preventDefault();
            handleJumpSubmit();
          }}
          className="flex items-center">
          <Input
            className="h-8 w-12 px-1 text-center"
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
        key={position}
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setActiveInput(position);
          setJumpPage("");
        }}>
        ...
      </Button>
    );
  };

  const renderItems = [];

  renderItems.push(
    <Button
      key="prev"
      variant="outline"
      size="icon"
      className="h-8 w-8"
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}>
      &lt;
    </Button>
  );

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) renderItems.push(renderPageButton(i));
  } else {
    renderItems.push(renderPageButton(1));

    if (currentPage > 4) {
      renderItems.push(renderEllipsisOrInput("left"));
    } else {
      for (let i = 2; i < Math.min(5, totalPages); i++) {
        if (i < Math.max(2, currentPage - 1)) renderItems.push(renderPageButton(i));
      }
    }

    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    let effectiveStart = rangeStart;
    let effectiveEnd = rangeEnd;

    if (currentPage <= 4) {
      effectiveStart = 2;
      effectiveEnd = 4;
    } else if (currentPage >= totalPages - 3) {
      effectiveStart = totalPages - 3;
      effectiveEnd = totalPages - 1;
    }

    for (let i = effectiveStart; i <= effectiveEnd; i++) {
      if (i > 1 && i < totalPages) {
        renderItems.push(renderPageButton(i));
      }
    }

    if (currentPage < totalPages - 3) {
      renderItems.push(renderEllipsisOrInput("right"));
    }

    renderItems.push(renderPageButton(totalPages));
  }

  renderItems.push(
    <Button
      key="next"
      variant="outline"
      size="icon"
      className="h-8 w-8"
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage === totalPages}>
      &gt;
    </Button>
  );

  return <div className="flex items-center justify-center gap-2">{renderItems}</div>;
}
