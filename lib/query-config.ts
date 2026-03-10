import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Configuration
 * Optimized for stale-while-revalidate caching strategy
 */

export const queryConfig = {
  defaultOptions: {
    queries: {
      // Cache configuration
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      cacheTime: 30 * 60 * 1000, // 30 minutes - keep in memory
      
      // Network behavior
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: true, // Refetch when internet reconnects
      refetchOnMount: true, // Check if data is stale on mount
      
      // Error handling
      retry: 1, // Retry failed requests once
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      
      // Performance
      structuralSharing: true, // Optimize re-renders
      
      // Show cached data while fetching new data in background
      keepPreviousData: true,
    },
    mutations: {
      // Retry mutations on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
};

/**
 * Create a new QueryClient instance with optimized config
 */
export function createQueryClient() {
  return new QueryClient(queryConfig);
}

/**
 * Cache key factories for consistent cache management
 */
export const queryKeys = {
  // User profile
  userProfile: (userId: string) => ['userProfile', userId] as const,
  
  // Quizzes
  publicQuizzes: (filters?: { category?: string; language?: string; search?: string }) => 
    ['quizzes', 'public', filters] as const,
  myQuizzes: (userId: string) => ['quizzes', 'my', userId] as const,
  favoriteQuizzes: (favoriteIds: string[]) => ['quizzes', 'favorites', favoriteIds] as const,
  quizDetail: (quizId: string) => ['quiz', quizId] as const,
  
  // Groups
  myGroups: (userId: string) => ['groups', 'my', userId] as const,
  publicGroups: () => ['groups', 'public'] as const,
  groupDetail: (groupId: string) => ['group', groupId] as const,
  groupMembers: (groupId: string) => ['group', groupId, 'members'] as const,
  groupInvitations: (userId: string) => ['groups', 'invitations', userId] as const,
  
  // Friends & Social
  friends: (userId: string) => ['friends', userId] as const,
  followers: (userId: string) => ['followers', userId] as const,
  following: (userId: string) => ['following', userId] as const,
  pendingRequests: (userId: string) => ['friends', 'pending', userId] as const,
  
  // Game sessions
  gameSession: (sessionId: string) => ['gameSession', sessionId] as const,
  participants: (sessionId: string) => ['participants', sessionId] as const,
  
  // History
  gameHistory: (userId: string, filters?: { limit?: number; offset?: number }) => 
    ['gameHistory', userId, filters] as const,
  learnHistory: (userId: string) => ['learnHistory', userId] as const,
};

