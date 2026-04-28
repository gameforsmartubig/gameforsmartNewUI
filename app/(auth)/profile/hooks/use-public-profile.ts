"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import {
  followUser,
  unfollowUser,
  getFollowedIds,
} from "@/app/(auth)/friends/services/friends.service";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SuggestedProfile {
  id: string;
  fullname: string;
  username: string;
  avatar_url: string | null;
}

// ─── useFollowStatus ──────────────────────────────────────────────────────────
// Manages follow/unfollow state for a single target user (used by ProfileStats)

interface UseFollowStatusProps {
  targetUserId: string;
}

interface UseFollowStatusReturn {
  isFollowing: boolean;
  isLoading: boolean;
  checkingStatus: boolean;
  isOwnProfile: boolean;
  handleToggleFollow: () => Promise<void>;
}

export function useFollowStatus({ targetUserId }: UseFollowStatusProps): UseFollowStatusReturn {
  const { profileId } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const isOwnProfile = profileId === targetUserId;

  // Check if already following
  useEffect(() => {
    async function checkFollowStatus() {
      if (!profileId || !targetUserId || profileId === targetUserId) {
        setCheckingStatus(false);
        return;
      }
      try {
        const followedIds = await getFollowedIds(profileId);
        setIsFollowing(followedIds.includes(targetUserId));
      } catch (err) {
        console.error("Failed to check follow status:", err);
      } finally {
        setCheckingStatus(false);
      }
    }
    checkFollowStatus();
  }, [profileId, targetUserId]);

  const handleToggleFollow = async () => {
    if (!profileId) {
      toast.error("Please login first");
      return;
    }
    if (profileId === targetUserId) {
      toast.info("You can't follow yourself");
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(profileId, targetUserId);
        setIsFollowing(false);
        toast.success("Unfollowed successfully");
      } else {
        await followUser(profileId, targetUserId);
        setIsFollowing(true);
        toast.success("Followed successfully!");
      }
    } catch (err: any) {
      console.error("Follow/Unfollow error:", err);
      toast.error(err.message || "Failed to update follow status");
    } finally {
      setIsLoading(false);
    }
  };

  return { isFollowing, isLoading, checkingStatus, isOwnProfile, handleToggleFollow };
}

// ─── useSuggestedProfiles ─────────────────────────────────────────────────────
// Fetches random profiles and manages follow state for each (used by ProfileOther)

interface UseSuggestedProfilesProps {
  excludeProfileId?: string;
}

interface UseSuggestedProfilesReturn {
  suggestedProfiles: SuggestedProfile[];
  followedIds: Set<string>;
  loadingIds: Set<string>;
  isLoading: boolean;
  currentUserId: string | null;
  handleToggleFollow: (targetId: string) => Promise<void>;
}

export function useSuggestedProfiles({
  excludeProfileId,
}: UseSuggestedProfilesProps): UseSuggestedProfilesReturn {
  const { profileId } = useAuth();
  const [suggestedProfiles, setSuggestedProfiles] = useState<SuggestedProfile[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch 5 random profiles + follow status
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, fullname, username, avatar_url")
          .not("username", "is", null)
          .limit(20);

        if (error) throw error;

        // Filter out current user and viewed profile, then shuffle & pick 5
        let filtered = (data || []).filter(
          (p) => p.id !== profileId && p.id !== excludeProfileId && p.username
        );

        for (let i = filtered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
        }

        setSuggestedProfiles(filtered.slice(0, 5));

        // Check follow status
        if (profileId) {
          const ids = await getFollowedIds(profileId);
          setFollowedIds(new Set(ids));
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSuggestions();
  }, [profileId, excludeProfileId]);

  const handleToggleFollow = async (targetId: string) => {
    if (!profileId) {
      toast.error("Please login first");
      return;
    }

    setLoadingIds((prev) => new Set(prev).add(targetId));
    try {
      if (followedIds.has(targetId)) {
        await unfollowUser(profileId, targetId);
        setFollowedIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        toast.success("Unfollowed successfully");
      } else {
        await followUser(profileId, targetId);
        setFollowedIds((prev) => new Set(prev).add(targetId));
        toast.success("Followed successfully!");
      }
    } catch (err: any) {
      console.error("Follow/Unfollow error:", err);
      toast.error(err.message || "Failed to update follow status");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  return {
    suggestedProfiles,
    followedIds,
    loadingIds,
    isLoading,
    currentUserId: profileId,
    handleToggleFollow,
  };
}
