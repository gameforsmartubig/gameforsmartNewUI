"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tabs } from "@radix-ui/react-tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  ChevronDownIcon,
  CircleQuestionMark,
  ClockPlus,
  Edit,
  Ellipsis,
  EllipsisVertical,
  Languages,
  MoreHorizontal,
  Play,
  PlusIcon,
  Search,
  User,
  Star,
  StarOff,
  Calendar,
  Trash,
  CircleOff
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { supabaseRealtime } from "@/lib/supabase-realtime";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

import type { Category, Quiz } from "./types";
import { categoryIconMap } from "./quiz-icons";
import { generateXID } from "@/lib/id-generator";

export function DashboardContent({
  publicQuizzes,
  myQuizzes,
  favoriteQuizzes,
  categories,
  currentProfileId
}: {
  publicQuizzes: Quiz[];
  myQuizzes: Quiz[];
  favoriteQuizzes: Quiz[];
  categories: Category[];
  currentProfileId?: string;
}) {
  const router = useRouter();
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const [activeTab, setActiveTab] = useState("quiz");

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      // Global shortcut: Ctrl+K or Cmd+K
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Pro shortcut: Just "k" (if not in an input)
      if (e.key.toLowerCase() === "k" && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Date Range State
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });

  // Pagination State
  const [pageState, setPageState] = useState<Record<string, number>>({
    quiz: 1,
    myQuiz: 1,
    favorite: 1
  });

  const ITEMS_PER_PAGE = 12;

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

  // Host Logic
  const handleHostClick = async (quizId: string) => {
    if (!currentProfileId) {
      toast.error("Profil tidak ditemukan. Silakan login ulang.");
      return;
    }

    try {
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select(
          `
          id,
          title,
          description,
          category,
          language,
          image_url,
          profiles (
            username,
            avatar_url
          )
        `
        )
        .eq("id", quizId)
        .single();

      if (quizError || !quizData) {
        toast.error("Quiz tidak ditemukan");
        return;
      }

      const profileData = Array.isArray(quizData.profiles)
        ? quizData.profiles[0]
        : quizData.profiles;

      const gamePin = Math.floor(100000 + Math.random() * 900000).toString();
      const sessionId = generateXID();

      const quizDetail = {
        title: quizData.title,
        description: quizData.description || null,
        category: quizData.category || "general",
        language: quizData.language || "id",
        image: quizData.image_url || null,
        creator_username: profileData?.username || "Unknown",
        creator_avatar: profileData?.avatar_url || null
      };

      const sessionData = {
        quiz_id: quizId,
        host_id: currentProfileId,
        game_pin: gamePin,
        status: "waiting",
        game_end_mode: "first_finish",
        allow_join_after_start: false,
        question_limit: "5",
        total_time_minutes: 5,
        current_questions: [],
        quiz_detail: quizDetail,
        application: "Quiz V2"
      };

      const { data: newSession, error: sessionError } = await supabase
        .from("game_sessions")
        .insert(sessionData)
        .select()
        .single();

      if (sessionError || !newSession) {
        console.error("Session creation error (Main DB):", sessionError);
        toast.error("Gagal membuat sesi game di database utama");
        return;
      }

      const sessionDataForRealtime = {
        id: newSession.id,
        game_pin: gamePin,
        quiz_id: quizId,
        host_id: currentProfileId,
        status: "waiting",
        total_time_minutes: 5,
        game_end_mode: "first_finish",
        allow_join_after_start: false,
        question_limit: "5",
        application: "Quiz V2"
      };

      if (!supabaseRealtime) {
        toast.error("Koneksi realtime tidak tersedia.");
        return;
      }

      const { error: realtimeError } = await supabaseRealtime
        .from("game_sessions_rt")
        .insert(sessionDataForRealtime);

      if (realtimeError) {
        console.error("Session creation error (Realtime DB):", realtimeError);
        toast.warning(
          "Sesi dibuat di DB utama tapi gagal di DB realtime. Game mungkin tidak berjalan optimal."
        );
      }

      router.push(`/host/${newSession.id}/settings`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Terjadi kesalahan saat membuat session");
    }
  };

  const handleEditClick = (quizId: string) => {
    router.push(`/quiz/${quizId}/edit`);
  };

  const handleAnalyticClick = (quizId: string) => {
    router.push(`/quiz/${quizId}/analytic`);
  };

  // Favorite Logic
  const toggleFavoriteQuiz = async (quiz: Quiz) => {
    if (!currentProfileId) {
      toast.error("Silakan login untuk menyimpan favorit.");
      return;
    }

    const isCurrentlyFavorited = quiz._raw?.isFavorite;

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("favorite_quiz")
        .eq("id", currentProfileId)
        .single();

      if (profileError) throw profileError;

      let currentFavorites: string[] = [];
      const favData = profile?.favorite_quiz as { favorites?: string[] } | null;
      if (favData && Array.isArray(favData.favorites)) {
        currentFavorites = favData.favorites;
      }

      const { data: quizData, error: quizDataError } = await supabase
        .from("quizzes")
        .select("favorite")
        .eq("id", quiz.id)
        .single();

      if (quizDataError) throw quizDataError;

      let quizFavoriteProfiles: string[] = [];
      if (quizData?.favorite && Array.isArray(quizData.favorite)) {
        quizFavoriteProfiles = quizData.favorite;
      }

      let newFavorites: string[] = [];
      let newQuizFavorites: string[] = [];

      if (isCurrentlyFavorited) {
        newFavorites = currentFavorites.filter((id) => id !== quiz.id);
        newQuizFavorites = quizFavoriteProfiles.filter((id) => id !== currentProfileId);
        toast.info("Dihapus dari favorit");
      } else {
        newFavorites = Array.from(new Set([...currentFavorites, quiz.id]));
        newQuizFavorites = Array.from(new Set([...quizFavoriteProfiles, currentProfileId]));
        toast.success("Ditambahkan ke favorit");
      }

      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ favorite_quiz: { favorites: newFavorites } })
        .eq("id", currentProfileId);

      if (updateProfileError) throw updateProfileError;

      const { error: updateQuizError } = await supabase
        .from("quizzes")
        .update({ favorite: newQuizFavorites })
        .eq("id", quiz.id);

      if (updateQuizError) throw updateQuizError;

      router.refresh();
    } catch (e) {
      console.error("Error toggling favorite:", e);
      toast.error("Gagal mengubah status favorit");
    }
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
        // Tetap menggunakan variant kondisional
        variant={currentPage === page ? "default" : "outline"}
        size="icon"
        className={`h-8 w-8 transition-colors ${
          currentPage === page
            ? "border-orange-400 bg-orange-400 text-white hover:bg-orange-500" // Saat aktif (Halaman sekarang)
            : "border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400" // Saat tidak aktif
        }`}
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
              className="h-8 w-8 border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
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
          className="h-8 w-8 border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
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
        className="h-8 w-8 border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
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
        className="h-8 w-8 border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
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
        <div className="text-muted-foreground flex h-40 w-full flex-col items-center justify-center">
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
            const isFavorite = quiz._raw?.isFavorite;

            return (
              <Card key={quiz.id} className="border-card py-0">
                <div className="vertical-line" />
                <CardContent className="flex flex-1 flex-col gap-2 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground flex gap-1">
                      {/* Badge Kategori */}
                      <div className="rounded-lg border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700 uppercase dark:border-green-700 dark:bg-green-900/30 dark:text-green-500">
                        {category?.title || "Umum"}
                      </div>
                      {/* Badge Bahasa */}
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-bold text-yellow-700 uppercase dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">
                        {quiz.language}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orange-600 hover:bg-orange-50">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleFavoriteQuiz(quiz)}>
                          {isFavorite ? (
                            <>
                              <StarOff className="mr-2 h-4 w-4 text-orange-500" />
                              <span>Unfavorite</span>
                            </>
                          ) : (
                            <>
                              <Star className="mr-2 h-4 w-4 text-orange-500" />
                              <span>Favorite</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        {tabKey === "myQuiz" ? (
                          <DropdownMenuItem className="text-red-600 dark:text-red-500">
                            <Trash className="mr-2 h-4 w-4 text-red-600 dark:text-red-500" />
                            Delete
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-red-600 dark:text-red-500">
                            <CircleOff className="mr-2 h-4 w-4 text-red-600 dark:text-red-500" />
                            Report
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h1
                    className="line-clamp-1 text-lg font-bold text-zinc-800 dark:text-zinc-300"
                    title={quiz.title}>
                    {quiz.title}
                  </h1>

                  <div className="text-md flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-400">
                    <User size={14} className="text-orange-500" />
                    <span className="line-clamp-1">{quiz.creator}</span>
                  </div>

                  <div className="flex flex-wrap justify-between gap-2 border-zinc-50 pt-3 dark:border-zinc-800">
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-700 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <CircleQuestionMark size={14} className="text-green-500" />
                        <div>{quiz.questions} Soal</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Play size={14} className="text-yellow-500" />
                        <div>{quiz.played} Main</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {tabKey === "myQuiz" ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="button-orange-outline"
                            onClick={() => handleEditClick(quiz.id)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="button-green-outline"
                            onClick={() => handleAnalyticClick(quiz.id)}>
                            Analytic
                          </Button>
                          <Button
                            size="sm"
                            className="button-orange"
                            onClick={() => handleHostClick(quiz.id)}>
                            Host
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            className="button-orange"
                            onClick={() => handleHostClick(quiz.id)}>
                            <Play className="mr-1 h-3 w-3 fill-current" /> Host
                          </Button>
                          <Button variant="outline" size="sm" className="button-yellow-outline">
                            Tryout
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="input">
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
          <div className="relative w-full sm:w-auto">
            <Input
              ref={searchInputRef}
              placeholder="Search...."
              className="input w-full pr-20 pl-3 sm:w-[250px]"
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
              className="button-orange absolute top-1 right-1 h-7 w-7 p-2"
              onClick={handleSearchSubmit}>
              <Search size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between border-gray-100 dark:border-gray-800">
            <TabsList className="h-auto w-fit justify-start rounded-none bg-transparent p-0">
              {[
                { value: "quiz", label: "Quiz" },
                { value: "myQuiz", label: "My Quiz" },
                { value: "favorite", label: "Favorite" }
              ].map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="tabs-trigger">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="hidden flex-row items-center justify-end gap-2 sm:flex sm:w-auto">
              <Button
                variant="outline"
                className="button-green flex"
                onClick={() => router.push("/create")}>
                <PlusIcon className="mr-1 h-4 w-4" />
                <span>Create Quiz</span>
              </Button>
              <Button
                onClick={() => router.push("/join")}
                variant="outline"
                className="button-yellow flex">
                <Play className="mr-1 h-4 w-4" />
                <span>Join Quiz</span>
              </Button>
            </div>
          </div>

          {/* Tombol Mobile (Muncul di bawah tab jika layar kecil) */}
          <div className="mt-4 flex w-full gap-2 sm:hidden">
            <Button
              variant="outline"
              className="button-green flex-1"
              onClick={() => router.push("/create")}>
              Create
            </Button>
            <Button
              variant="outline"
              className="button-yellow flex-1"
              onClick={() => router.push("/join")}>
              Join
            </Button>
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
