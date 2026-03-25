"use client";

// ============================================================
// _hooks/useDashboard.ts
//
// State management + event handlers untuk DashboardContent.
// Tidak ada import supabase langsung — semua I/O lewat service.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { supabaseRealtime } from "@/lib/supabase-realtime";
import {
  toggleFavorite,
  createGameSession,
  softDeleteQuiz
} from "../services/dashboardService";
import type { Quiz } from "../component/types";

export const ITEMS_PER_PAGE = 12;

export function useDashboard(
  publicQuizzes: Quiz[],
  myQuizzes: Quiz[],
  favoriteQuizzes: Quiz[],
  currentProfileId?: string
) {
  const router = useRouter();

  // ── Tab ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("quiz");

  // ── Delete dialog ──────────────────────────────────────────
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [quizToDelete, setQuizToDelete]         = useState<Quiz | null>(null);
  const [isDeleting, setIsDeleting]             = useState(false);

  // ── Search & filter ────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K / Cmd+K / "k" untuk fokus search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const isTyping =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key.toLowerCase() === "k" && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // ── Pagination ─────────────────────────────────────────────
  const [pageState, setPageState] = useState<Record<string, number>>({
    quiz: 1,
    myQuiz: 1,
    favorite: 1
  });

  // Reset semua halaman saat filter berubah
  const handleFilterChange = (type: "search" | "category", value: string | null) => {
    if (type === "search")   setSearchQuery(value || "");
    if (type === "category") setSelectedCategory(value);
    setPageState({ quiz: 1, myQuiz: 1, favorite: 1 });
  };

  const handleSearchSubmit = () => handleFilterChange("search", searchInputValue);

  const handlePageChange = (tab: string, page: number) =>
    setPageState((prev) => ({ ...prev, [tab]: page }));

  // ── Filter logic ───────────────────────────────────────────
  const filterQuizzes = (quizzes: Quiz[]) =>
    quizzes.filter((q) => {
      const matchSearch   = q.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory
        ? q.categoryId === selectedCategory || selectedCategory === "all"
        : true;
      return matchSearch && matchCategory;
    });

  const filteredPublic   = filterQuizzes(publicQuizzes);
  const filteredMy       = filterQuizzes(myQuizzes);
  const filteredFavorite = filterQuizzes(favoriteQuizzes);

  // Ambil slice quiz sesuai halaman aktif
  const getPaginatedQuizzes = (quizzes: Quiz[], tabKey: string) => {
    const page  = pageState[tabKey] || 1;
    const start = (page - 1) * ITEMS_PER_PAGE;
    return quizzes.slice(start, start + ITEMS_PER_PAGE);
  };

  // ── Navigation ─────────────────────────────────────────────
  const handleEditClick     = (quizId: string) => router.push(`/edit/${quizId}`);
  const handleAnalyticClick = (quizId: string) => router.push(`/detail/${quizId}`);

  // ── Host logic ─────────────────────────────────────────────
  const handleHostClick = async (quizId: string) => {
    if (!currentProfileId) {
      toast.error("Profil tidak ditemukan. Silakan login ulang.");
      return;
    }

    const result = await createGameSession(
      supabase,
      supabaseRealtime,
      quizId,
      currentProfileId
    );

    if (!result.success) {
      if (!supabaseRealtime) {
        toast.error("Koneksi realtime tidak tersedia.");
      } else {
        toast.error(result.error || "Terjadi kesalahan saat membuat session");
      }
      return;
    }

    router.push(`/host/${result.sessionId}/settings`);
  };

  // ── Tryout logic ───────────────────────────────────────────
  const handleTryoutClick = async (quizId: string) => {
    if (!currentProfileId) {
      toast.error("Profil tidak ditemukan. Silakan login ulang.");
      return;
    }

    const result = await createGameSession(
      supabase,
      supabaseRealtime,
      quizId,
      currentProfileId
    );

    if (!result.success) {
      if (!supabaseRealtime) {
        toast.error("Koneksi realtime tidak tersedia.");
      } else {
        toast.error(result.error || "Terjadi kesalahan saat membuat session");
      }
      return;
    }

    router.push(`/host/${result.sessionId}/settings?mode=tryout`);
  };

  // ── Favorite logic ─────────────────────────────────────────
  const handleToggleFavorite = async (quiz: Quiz) => {
    if (!currentProfileId) {
      toast.error("Silakan login untuk menyimpan favorit.");
      return;
    }

    const result = await toggleFavorite(supabase, quiz, currentProfileId);

    if (!result.success) {
      toast.error("Gagal mengubah status favorit");
      return;
    }

    if (result.added) {
      toast.success("Ditambahkan ke favorit");
    } else {
      toast.info("Dihapus dari favorit");
    }
    router.refresh();
  };

  // ── Delete logic ───────────────────────────────────────────
  const handleDeleteClick = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteDialog(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setIsDeleting(true);

    const result = await softDeleteQuiz(supabase, quizToDelete.id);

    if (!result.success) {
      toast.error(result.error || "Gagal menghapus quiz");
    } else {
      toast.success("Quiz berhasil dihapus");
      router.refresh();
    }

    setIsDeleting(false);
    setShowDeleteDialog(false);
    setQuizToDelete(null);
  };

  return {
    // tab
    activeTab,
    setActiveTab,
    // search
    searchInputValue,
    setSearchInputValue,
    searchInputRef,
    selectedCategory,
    handleFilterChange,
    handleSearchSubmit,
    // pagination
    pageState,
    handlePageChange,
    getPaginatedQuizzes,
    // filtered lists
    filteredPublic,
    filteredMy,
    filteredFavorite,
    // actions
    handleHostClick,
    handleTryoutClick,
    handleEditClick,
    handleAnalyticClick,
    handleToggleFavorite,
    // delete
    showDeleteDialog,
    setShowDeleteDialog,
    quizToDelete,
    isDeleting,
    handleDeleteClick,
    confirmDeleteQuiz
  };
}
