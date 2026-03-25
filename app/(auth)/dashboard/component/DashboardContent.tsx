"use client";

// ============================================================
// components/DashboardContent.tsx
//
// Client Component utama yang dirakit dari sub-komponen.
// Hanya mengelola wiring antara hook dan komponen UI —
// tidak ada logika bisnis atau Supabase langsung di sini.
// ============================================================

import { useDashboard } from "../hooks/useDashboard";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardTabs } from "./DashboardTabs";
import { DeleteQuizDialog } from "./DeleteQuizDialog";
import type { Category, Quiz } from "./types";

interface DashboardContentProps {
  publicQuizzes:    Quiz[];
  myQuizzes:        Quiz[];
  favoriteQuizzes:  Quiz[];
  categories:       Category[];
  currentProfileId?: string;
}

export function DashboardContent({
  publicQuizzes,
  myQuizzes,
  favoriteQuizzes,
  categories,
  currentProfileId
}: DashboardContentProps) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const {
    activeTab, setActiveTab,
    searchInputValue, setSearchInputValue, searchInputRef,
    selectedCategory, handleFilterChange, handleSearchSubmit,
    pageState, handlePageChange, getPaginatedQuizzes,
    filteredPublic, filteredMy, filteredFavorite,
    handleHostClick, handleTryoutClick, handleEditClick, handleAnalyticClick, handleToggleFavorite,
    // delete
    showDeleteDialog, setShowDeleteDialog,
    quizToDelete, isDeleting, handleDeleteClick, confirmDeleteQuiz
  } = useDashboard(publicQuizzes, myQuizzes, favoriteQuizzes, currentProfileId);

  return (
    <div className="space-y-4">
      <DashboardHeader
        categories={categories}
        categoryMap={categoryMap}
        selectedCategory={selectedCategory}
        searchInputValue={searchInputValue}
        searchInputRef={searchInputRef}
        onCategoryChange={(id) => handleFilterChange("category", id)}
        onSearchChange={setSearchInputValue}
        onSearchSubmit={handleSearchSubmit}
      />

      <DashboardTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filteredPublic={filteredPublic}
        filteredMy={filteredMy}
        filteredFavorite={filteredFavorite}
        categoryMap={categoryMap}
        pageState={pageState}
        onPageChange={handlePageChange}
        getPaginatedQuizzes={getPaginatedQuizzes}
        onHost={handleHostClick}
        onTryout={handleTryoutClick}
        onEdit={handleEditClick}
        onAnalytic={handleAnalyticClick}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteClick}
      />

      {/* Delete Quiz Confirmation Dialog */}
      <DeleteQuizDialog
        open={showDeleteDialog}
        quizTitle={quizToDelete?.title || ""}
        deleting={isDeleting}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteQuiz}
      />
    </div>
  );
}
