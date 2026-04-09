"use client";

// ============================================================
// _hooks/useQuizDetail.ts
// State + business logic untuk halaman Quiz Detail.
// Tidak ada import supabase langsung — semua lewat service.
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  fetchQuizDetail,
  toggleFavorite,
  fetchQuizLocationChart,
} from "../services/quizDetailService";
import type { QuizDetail } from "../types";
import type { ChartItem } from "../services/quizDetailService";

export function useQuizDetail(quizId: string) {
  const { user }   = useAuth();
  const router     = useRouter();
  const { toast }  = useToast();

  // ── State ───────────────────────────────────────────────────
  const [quiz,                  setQuiz]                  = useState<QuizDetail | null>(null);
  const [loading,               setLoading]               = useState(true);
  const [isFavorited,           setIsFavorited]           = useState(false);
  const [favoriteCount,         setFavoriteCount]         = useState(0);
  const [isTogglingFavorite,    setIsTogglingFavorite]    = useState(false);
  const [copied,                setCopied]                = useState(false);
  const [profileId,             setProfileId]             = useState<string | null>(null);
  const [userFavoriteQuizIds,   setUserFavoriteQuizIds]   = useState<string[]>([]);

  // Chart state
  const [countryData,  setCountryData]  = useState<ChartItem[]>([]);
  const [stateData,    setStateData]    = useState<ChartItem[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  // ── Load ────────────────────────────────────────────────────
  useEffect(() => {
    if (!quizId) return;
    load();
  }, [quizId, user]);

  // Scroll to top on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    const t = setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }), 0);
    return () => clearTimeout(t);
  }, [quizId]);

  useEffect(() => {
    if (!loading && typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [loading]);

  const load = async () => {
    setLoading(true);
    setChartLoading(true);
    try {
      // Fetch quiz detail and chart data in parallel
      const [result, chartData] = await Promise.all([
        fetchQuizDetail(quizId, user?.id),
        fetchQuizLocationChart(quizId),
      ]);

      setQuiz(result.quiz);
      setProfileId(result.profileId);
      setUserFavoriteQuizIds(result.userFavoriteQuizIds);
      setIsFavorited(result.quiz.is_favorited);
      setFavoriteCount(result.quiz.favorite_count);

      setCountryData(chartData.countryData);
      setStateData(chartData.stateData);
    } catch (error) {
      console.error("[useQuizDetail] load:", error);
      toast({ title: "Error", description: "Failed to load quiz", variant: "destructive" });
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  // ── Toggle Favorite ─────────────────────────────────────────
  const handleToggleFavorite = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to favorite this quiz", variant: "destructive" });
      return;
    }
    if (!profileId) {
      toast({ title: "Profile Not Found", description: "Unable to find your profile information.", variant: "destructive" });
      return;
    }
    if (!quiz) return;

    setIsTogglingFavorite(true);
    try {
      const { updatedQuizFavs, updatedProfileFavs } = await toggleFavorite({
        quizId,
        profileId,
        isFavorited,
        currentQuizFavs:    Array.isArray(quiz.favorite) ? [...quiz.favorite] : [],
        currentProfileFavs: [...userFavoriteQuizIds],
      });

      setQuiz((prev) =>
        prev
          ? { ...prev, favorite: updatedQuizFavs, favorite_count: updatedQuizFavs.length, is_favorited: !isFavorited }
          : prev
      );
      setIsFavorited((p) => !p);
      setFavoriteCount(updatedQuizFavs.length);
      setUserFavoriteQuizIds(updatedProfileFavs);

      toast({
        title:       isFavorited ? "Removed from favorites" : "Added to favorites",
        description: isFavorited ? "Quiz removed from your favorites" : "Quiz added to your favorites",
      });
    } catch (error) {
      console.error("[useQuizDetail] toggleFavorite:", error);
      toast({ title: "Error", description: "Failed to update favorite status", variant: "destructive" });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // ── Host Quiz ───────────────────────────────────────────────
  const handleHostQuiz = () => {
    router.push(`/host/${quizId}/settings`);
  };

  // ── Tryout ──────────────────────────────────────────────────
  const handleTryout = () => {
    router.push(`/learn/${quizId}/settings`);
  };

  // ── Edit ────────────────────────────────────────────────────
  const handleEdit = () => {
    router.push(`/quiz/edit/${quizId}`);
  };

  // ── Share / copy link ───────────────────────────────────────
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: quiz?.title ?? "Quiz", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Link copied", description: "Quiz link copied to clipboard" });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* silent */ }
    }
  };

  // ── Derived ─────────────────────────────────────────────────
  const isCreator   = !!(profileId && quiz?.creator_id === profileId);
  const questionCount = quiz?.questions?.length ?? 0;

  return {
    quiz,
    loading,
    isFavorited,
    favoriteCount,
    isTogglingFavorite,
    copied,
    isCreator,
    questionCount,
    // Chart
    countryData,
    stateData,
    chartLoading,
    // Actions
    handleToggleFavorite,
    handleHostQuiz,
    handleTryout,
    handleEdit,
    handleShare,
  };
}