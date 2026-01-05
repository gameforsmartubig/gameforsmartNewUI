"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tabs } from "@radix-ui/react-tabs";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  CircleQuestionMark,
  ClockPlus,
  Languages,
  Play,
  PlusIcon,
  Search,
  User
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import type { Category, Quiz } from "./types";
import { categoryIconMap } from "./quiz-icons";

export function DashboardContent({
  publicQuizzes,
  myQuizzes,
  favoriteQuizzes,
  categories
}: {
  publicQuizzes: Quiz[];
  myQuizzes: Quiz[];
  favoriteQuizzes: Quiz[];
  categories: Category[];
}) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const [activeTab, setActiveTab] = useState("quiz");

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Pagination State
  const [pageState, setPageState] = useState<Record<string, number>>({
    quiz: 1,
    myQuiz: 1,
    favorite: 1
  });

  const ITEMS_PER_PAGE = 6;

  // Reset pagination when search or category changes
  const handleFilterChange = (type: "search" | "category", value: string | null) => {
    if (type === "search") setSearchQuery(value || "");
    if (type === "category") setSelectedCategory(value);

    // Reset pages for all tabs
    setPageState({
      quiz: 1,
      myQuiz: 1,
      favorite: 1
    });
  };

  const handleSearchSubmit = () => {
    handleFilterChange("search", searchInputValue);
  };

  const handlePageChange = (tab: string, page: number) => {
    setPageState((prev) => ({ ...prev, [tab]: page }));
  };

  // Filter Logic
  const filterQuizzes = (quizzes: Quiz[]) => {
    return quizzes.filter((quiz) => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory
        ? quiz.categoryId === selectedCategory || selectedCategory === "all"
        : true;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredPublic = filterQuizzes(publicQuizzes);
  const filteredMy = filterQuizzes(myQuizzes);
  const filteredFavorite = filterQuizzes(favoriteQuizzes);

  const PaginationControl = ({
    totalItems,
    currentPage,
    onPageChange
  }: {
    totalItems: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
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

    // Previous
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

    // Number Logic
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

    // Next
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

    return <div className="mt-6 flex items-center justify-center gap-2">{renderItems}</div>;
  };

  const renderQuizList = (quizzes: Quiz[], tabKey: string) => {
    const currentPage = pageState[tabKey] || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentQuizzes = quizzes.slice(startIndex, endIndex);

    if (quizzes.length === 0) {
      return (
        <div className="flex h-40 w-full flex-col items-center justify-center text-gray-500">
          <p>Tidak ada kuis yang ditemukan.</p>
        </div>
      );
    }

    return (
      <div className="flex w-full flex-col items-center justify-center gap-6">
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentQuizzes.map((quiz) => {
            const category = categoryMap[quiz.categoryId];
            const Icon = category
              ? categoryIconMap[category.icon] || categoryIconMap["BookOpen"]
              : categoryIconMap["BookOpen"];
            return (
              <Card key={quiz.title}>
                <CardHeader>
                  <CardTitle>{quiz.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-row items-center justify-start gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <User size={16} /> {quiz.creator}
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockPlus size={16} /> {quiz.createdAt}
                    </div>
                    <div className="flex items-center gap-1">
                      <Languages size={16} /> {quiz.language}
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-evenly gap-2 text-sm">
                    <div className="flex flex-col items-center gap-1">
                      <CircleQuestionMark size={32} />
                      <div>{quiz.questions}</div>
                      <div>Pertanyaan</div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Icon size={32} />
                      <div>{category?.title || "Umum"}</div>
                      <div>Kategori</div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Play size={32} />
                      <div>{quiz.played}</div>
                      <div>Dimainkan</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline">Host</Button>
                  <Button variant="outline">Tryout</Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        <PaginationControl
          totalItems={quizzes.length}
          currentPage={currentPage}
          onPageChange={(page) => handlePageChange(tabKey, page)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Search and Filter */}
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex w-full items-center justify-between sm:w-auto">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Dashboard</h1>
        </div>

        <div className="flex w-full items-center space-x-2 sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder="Search"
              className="w-full pl-8 sm:w-[200px]"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
            />
            <Button
              variant="default"
              className="absolute top-1 right-1 h-7 w-7 p-2"
              onClick={handleSearchSubmit}>
              <Search size={20} />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {selectedCategory && selectedCategory !== "all"
                  ? categoryMap[selectedCategory]?.title || "Category"
                  : "Category"}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={!selectedCategory || selectedCategory === "all"}
                onCheckedChange={() => handleFilterChange("category", "all")}>
                All Categories
              </DropdownMenuCheckboxItem>
              {categories.map((category) => {
                const Icon = categoryIconMap[category.icon];
                return (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    className="capitalize"
                    checked={selectedCategory === category.id}
                    onCheckedChange={() => handleFilterChange("category", category.id)}>
                    <Icon className="mr-2 h-4 w-4" />
                    {category.title}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-row items-center justify-between gap-2 sm:flex-row">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <div className="flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
            <TabsList>
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
              <TabsTrigger value="myQuiz">My Quiz</TabsTrigger>
              <TabsTrigger value="favorite">Favorite</TabsTrigger>
            </TabsList>

            <div className="flex w-full flex-row items-center justify-end gap-2 sm:w-auto">
              <Button variant="outline" className="">
                <PlusIcon />
                <span className="hidden sm:inline">Create Quiz</span>
                <span className="inline sm:hidden">Create</span>
              </Button>
              <Button variant="outline" className="flex">
                <Play />
                <span className="hidden sm:inline">Join Quiz</span>
                <span className="inline sm:hidden">Join</span>
              </Button>
            </div>
          </div>

          <TabsContent value="quiz" className="mt-4">
            {renderQuizList(filteredPublic, "quiz")}
          </TabsContent>
          <TabsContent value="myQuiz" className="mt-4">
            {renderQuizList(filteredMy, "myQuiz")}
          </TabsContent>
          <TabsContent value="favorite" className="mt-4">
            {renderQuizList(filteredFavorite, "favorite")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
