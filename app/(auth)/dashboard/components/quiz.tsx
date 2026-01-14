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
  StarOff
} from "lucide-react";
import { useState } from "react";
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

import type { Category, Quiz } from "./types";
import { categoryIconMap } from "./quiz-icons";

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

  // Host Logic
  const handleHostClick = async (quizId: string) => {
    if (!currentProfileId) {
      toast.error("Profil tidak ditemukan. Silakan login ulang.");
      return;
    }

    try {
      // 1. Fetch full quiz details for session
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

      // 2. Prepare Data
      const profileData = Array.isArray(quizData.profiles)
        ? quizData.profiles[0]
        : quizData.profiles;

      const gamePin = Math.floor(100000 + Math.random() * 900000).toString();

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
        application: "gameforsmartNewUI" // Branding
      };

      // 3. Create Session in MAIN Database (for records/history)
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

      // 4. Create Session in REALTIME Database (for fast gameplay)
      // 4. Create Session in REALTIME Database (optimized schema)
      // Map data clearly to match table 'game_sessions_rt'
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
        application: "gameforsmartNewUI"
      };

      const { error: realtimeError } = await supabaseRealtime
        .from("game_sessions_rt")
        .insert(sessionDataForRealtime);

      if (realtimeError) {
        console.error("Session creation error (Realtime DB):", realtimeError);
        toast.warning(
          "Sesi dibuat di DB utama tapi gagal di DB realtime. Game mungkin tidak berjalan optimal."
        );
      }

      // 5. Redirect
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

    // Determine current state based on passed prop data (which should be fresh from server)
    const isCurrentlyFavorited = quiz._raw?.isFavorite;

    try {
      // 1. Get current profile's favorites list
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("favorite_quiz")
        .eq("id", currentProfileId)
        .single();

      if (profileError) throw profileError;

      // Ensure favorites structure exists
      let currentFavorites: string[] = [];
      const favData = profile?.favorite_quiz as { favorites?: string[] } | null;
      if (favData && Array.isArray(favData.favorites)) {
        currentFavorites = favData.favorites;
      }

      // 2. Get quiz's favorite list (who favorited it)
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

      // 3. Toggle logic
      let newFavorites: string[] = [];
      let newQuizFavorites: string[] = [];

      if (isCurrentlyFavorited) {
        // Remove
        newFavorites = currentFavorites.filter((id) => id !== quiz.id);
        newQuizFavorites = quizFavoriteProfiles.filter((id) => id !== currentProfileId);
        toast.info("Dihapus dari favorit");
      } else {
        // Add
        // Use Set to prevent duplicates
        newFavorites = Array.from(new Set([...currentFavorites, quiz.id]));
        newQuizFavorites = Array.from(new Set([...quizFavoriteProfiles, currentProfileId]));
        toast.success("Ditambahkan ke favorit");
      }

      // 4. Update Database
      // Update Profile
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ favorite_quiz: { favorites: newFavorites } })
        .eq("id", currentProfileId);

      if (updateProfileError) throw updateProfileError;

      // Update Quiz
      const { error: updateQuizError } = await supabase
        .from("quizzes")
        .update({ favorite: newQuizFavorites })
        .eq("id", quiz.id);

      if (updateQuizError) throw updateQuizError;

      // Ideally trigger a refresh of the page data here.
      // Since this is a client component receiving props from a server component,
      // we navigate to current path to refresh server props.
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
              <Card
                key={quiz.id}
                className="transition-colors hover:bg-neutral-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-900/50">
                <CardContent className="flex flex-col gap-2 px-5 py-0">
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground flex gap-1 dark:text-zinc-400">
                      <div className="rounded-lg border border-gray-200 bg-blue-50 px-1.5 py-1 text-sm font-medium dark:border-zinc-700 dark:bg-blue-950/30 dark:text-blue-200">
                        {category?.title || "Umum"}
                      </div>
                      <div className="rounded-lg border border-gray-200 px-1.5 py-1 text-sm font-medium uppercase dark:border-zinc-700">
                        {quiz.language}
                      </div>
                    </div>
                    {/* Common Dropdown Menu Logic */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleFavoriteQuiz(quiz)}>
                          {isFavorite ? (
                            <>
                              <StarOff className="mr-2 h-4 w-4" />
                              <span>Unfavorite</span>
                            </>
                          ) : (
                            <>
                              <Star className="mr-2 h-4 w-4" />
                              <span>Favorite</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        {tabKey === "myQuiz" ? (
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>Report</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h1 className="line-clamp-1 text-lg font-bold" title={quiz.title}>
                    {quiz.title}
                  </h1>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User size={14} />
                    <span className="line-clamp-1">{quiz.creator}</span>
                  </div>

                  <div className="mt-1 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <CircleQuestionMark size={14} />
                      <div>{quiz.questions} Questions</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Play size={14} />
                      <div>{quiz.played} Plays</div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap justify-end gap-2 pt-4">
                    {tabKey === "myQuiz" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(quiz.id)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnalyticClick(quiz.id)}>
                          Analytic
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHostClick(quiz.id)}>
                          Host
                        </Button>
                        <Button variant="outline" size="sm">
                          Tryout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHostClick(quiz.id)}>
                          Host
                        </Button>
                        <Button variant="outline" size="sm">
                          Tryout
                        </Button>
                      </>
                    )}
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
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
              <TabsTrigger value="myQuiz">My Quiz</TabsTrigger>
              <TabsTrigger value="favorite">Favorite</TabsTrigger>
            </TabsList>

            <div className="flex w-full flex-row items-center justify-end gap-2 sm:w-auto">
              <Button variant="outline" className="">
                <PlusIcon className="hidden sm:block" />
                <span className="hidden sm:inline">Create Quiz</span>
                <span className="inline sm:hidden">Create</span>
              </Button>
              <Button onClick={() => router.push("/join")} variant="outline" className="flex">
                <Play className="hidden sm:block" />
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
