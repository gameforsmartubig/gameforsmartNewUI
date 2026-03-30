"use client";

// ============================================================
// components/DashboardHeader.tsx
// Bar atas: judul "Dashboard", dropdown kategori, bahasa, kotak search
// ============================================================

import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, Search, Languages } from "lucide-react";
import { categoryIconMap } from "./quiz-icons";
import type { Category } from "./types";

// ── Language options ──
const languageOptions = [
  { id: "id", label: "🇮🇩 Indonesia" },
  { id: "en", label: "🇺🇸 English" },
];

interface DashboardHeaderProps {
  categories:         Category[];
  categoryMap:        Record<string, Category>;
  selectedCategory:   string | null;
  selectedLanguage:   string | null;
  searchInputValue:   string;
  searchInputRef:     RefObject<HTMLInputElement | null>;
  onCategoryChange:   (categoryId: string) => void;
  onLanguageChange:   (languageId: string) => void;
  onSearchChange:     (value: string) => void;
  onSearchSubmit:     () => void;
}

export function DashboardHeader({
  categories,
  categoryMap,
  selectedCategory,
  selectedLanguage,
  searchInputValue,
  searchInputRef,
  onCategoryChange,
  onLanguageChange,
  onSearchChange,
  onSearchSubmit
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
      {/* Judul */}
      <div className="flex w-full items-center justify-between sm:w-auto">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Dashboard</h1>
      </div>

      {/* Filter + Search */}
      <div className="flex w-full items-center space-x-2 sm:w-auto">
        {/* Dropdown kategori */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="input">
            <Button variant="outline" className="ml-auto">
              {selectedCategory && selectedCategory !== "all"
                ? categoryMap[selectedCategory]?.title ?? "Category"
                : "Category"}
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={!selectedCategory || selectedCategory === "all"}
              onCheckedChange={() => onCategoryChange("all")}
            >
              All Categories
            </DropdownMenuCheckboxItem>
            {categories.map((cat) => {
              const Icon = categoryIconMap[cat.icon];
              return (
                <DropdownMenuCheckboxItem
                  key={cat.id}
                  className="capitalize"
                  checked={selectedCategory === cat.id}
                  onCheckedChange={() => onCategoryChange(cat.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {cat.title}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dropdown bahasa */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="input">
            <Button variant="outline" className="ml-auto">
              {selectedLanguage && selectedLanguage !== "all"
                ? languageOptions.find((l) => l.id === selectedLanguage)?.label ?? "Language"
                : "Language"}
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={!selectedLanguage || selectedLanguage === "all"}
              onCheckedChange={() => onLanguageChange("all")}
            >
              All Languages
            </DropdownMenuCheckboxItem>
            {languageOptions.map((lang) => (
              <DropdownMenuCheckboxItem
                key={lang.id}
                checked={selectedLanguage === lang.id}
                onCheckedChange={() => onLanguageChange(lang.id)}
              >
                {lang.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search input */}
        <div className="relative w-full sm:w-auto">
          <Input
            ref={searchInputRef}
            placeholder="Search...."
            className="input w-full pr-10 pl-3 sm:w-[250px]"
            value={searchInputValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSearchSubmit(); }}
          />
          <Button
            variant="default"
            className="button-orange absolute top-1 right-1 h-7 w-7 p-2"
            onClick={onSearchSubmit}
          >
            <Search size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
