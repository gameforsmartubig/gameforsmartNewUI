"use client";

import React, { createContext, useContext, useCallback } from 'react';
import { useFriendsCount } from '@/hooks/use-friends-count';

interface FriendsContextType {
  friendsCount: number;
  loading: boolean;
  error: string | null;
  refreshFriendsCount: () => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const { friendsCount, loading, error, refetch } = useFriendsCount();

  const refreshFriendsCount = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <FriendsContext.Provider
      value={{
        friendsCount,
        loading,
        error,
        refreshFriendsCount,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriendsContext() {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriendsContext must be used within a FriendsProvider');
  }
  return context;
}
