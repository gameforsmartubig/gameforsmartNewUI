"use client";

// ============================================================
// components/DashboardTabs.tsx
// Tab bar (Quiz / My Quiz / Favorite) + tombol Create & Join
// Setiap tab merender <QuizGrid> yang sesuai.
// ============================================================

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Play, PlusIcon } from "lucide-react";
import { QuizGrid } from "./QuizGrid";
import type { Quiz, Category } from "./types";

const TABS = [
  { value: "quiz",     label: "Quiz" },
  { value: "myQuiz",  label: "My Quiz" },
  { value: "favorite", label: "Favorite" }
] as const;

type TabValue = (typeof TABS)[number]["value"];

interface DashboardTabsProps {
  activeTab:           string;
  onTabChange:         (tab: string) => void;
  filteredPublic:      Quiz[];
  filteredMy:          Quiz[];
  filteredFavorite:    Quiz[];
  categoryMap:         Record<string, Category>;
  pageState:           Record<string, number>;
  onPageChange:        (tab: string, page: number) => void;
  getPaginatedQuizzes: (quizzes: Quiz[], tabKey: string) => Quiz[];
  onHost:              (quizId: string) => void;
  onEdit:              (quizId: string) => void;
  onAnalytic:          (quizId: string) => void;
  onToggleFavorite:    (quiz: Quiz) => void;
  onDelete:            (quiz: Quiz) => void;
}

export function DashboardTabs({
  activeTab,
  onTabChange,
  filteredPublic,
  filteredMy,
  filteredFavorite,
  categoryMap,
  pageState,
  onPageChange,
  getPaginatedQuizzes,
  onHost,
  onEdit,
  onAnalytic,
  onToggleFavorite,
  onDelete
}: DashboardTabsProps) {
  const router = useRouter();

  const tabData: Record<TabValue, Quiz[]> = {
    quiz:     filteredPublic,
    myQuiz:   filteredMy,
    favorite: filteredFavorite
  };

  const sharedGridProps = { categoryMap, onHost, onEdit, onAnalytic, onToggleFavorite, onDelete };

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">

        {/* Tab list + tombol desktop */}
        <div className="flex items-center justify-between border-gray-100 dark:border-gray-800">
          <TabsList className="h-auto w-fit justify-start rounded-none bg-transparent p-0">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="tabs-trigger">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="hidden flex-row items-center justify-end gap-2 sm:flex sm:w-auto">
            <Button
              variant="outline"
              className="button-green flex"
              onClick={() => router.push("/create")}
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              <span>Create Quiz</span>
            </Button>
            <Button
              variant="outline"
              className="button-yellow flex"
              onClick={() => router.push("/join")}
            >
              <Play className="mr-1 h-4 w-4" />
              <span>Join Quiz</span>
            </Button>
          </div>
        </div>

        {/* Tombol mobile */}
        <div className="mt-4 flex w-full gap-2 sm:hidden">
          <Button
            variant="outline"
            className="button-green flex-1"
            onClick={() => router.push("/create")}
          >
            Create
          </Button>
          <Button
            variant="outline"
            className="button-yellow flex-1"
            onClick={() => router.push("/join")}
          >
            Join
          </Button>
        </div>

        {/* Konten tiap tab */}
        {TABS.map(({ value }) => (
          <TabsContent key={value} value={value} className="mt-4">
            <QuizGrid
              quizzes={tabData[value]}
              paginatedQuizzes={getPaginatedQuizzes(tabData[value], value)}
              tabKey={value}
              currentPage={pageState[value] || 1}
              onPageChange={(page) => onPageChange(value, page)}
              {...sharedGridProps}
            />
          </TabsContent>
        ))}

      </Tabs>
    </div>
  );
}
