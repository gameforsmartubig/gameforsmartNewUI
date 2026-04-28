"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSuggestedProfiles, type SuggestedProfile } from "../../hooks/use-public-profile";

// ─── Sub-components (presentation only) ──────────────────────────────────────

interface ProfileItemProps {
  profile: SuggestedProfile;
  currentUserId: string | null;
  isFollowing: boolean;
  onToggleFollow: (targetId: string) => void;
  isLoading: boolean;
}

function ProfileItem({
  profile,
  currentUserId,
  isFollowing,
  onToggleFollow,
  isLoading,
}: ProfileItemProps) {
  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="flex items-center justify-between py-3">
      <Link
        href={`/profile/${profile.username}`}
        className="flex flex-1 items-center gap-3 transition-opacity hover:opacity-80">
        <Avatar className="h-12 w-12 border-2 border-orange-100 dark:border-zinc-700">
          <AvatarImage src={profile.avatar_url || ""} alt={profile.fullname} />
          <AvatarFallback className="bg-orange-50 text-sm font-bold text-orange-600 dark:bg-zinc-800 dark:text-orange-400">
            {profile.fullname?.substring(0, 2).toUpperCase() || "??"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900 dark:text-zinc-100">
            {profile.fullname || "Anonymous"}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            @{profile.username}
          </p>
        </div>
      </Link>
      {!isOwnProfile && (
        <Button
          size="sm"
          className={isFollowing ? "button-orange-outline" : "button-orange"}
          onClick={() => onToggleFollow(profile.id)}
          disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isFollowing ? (
            <UserMinus className="h-3.5 w-3.5" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          {isFollowing ? "Unfollow" : "Follow"}
        </Button>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface PublicProfileOtherProps {
  excludeProfileId?: string;
}

export default function PublicProfileOther({ excludeProfileId }: PublicProfileOtherProps) {
  const {
    suggestedProfiles,
    followedIds,
    loadingIds,
    isLoading,
    currentUserId,
    handleToggleFollow,
  } = useSuggestedProfiles({ excludeProfileId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
      </div>
    );
  }

  if (suggestedProfiles.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        No suggestions available
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-bold tracking-wider text-orange-800/60 uppercase dark:text-zinc-500">
        People you may know
      </h3>
      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {suggestedProfiles.map((p) => (
          <ProfileItem
            key={p.id}
            profile={p}
            currentUserId={currentUserId}
            isFollowing={followedIds.has(p.id)}
            onToggleFollow={handleToggleFollow}
            isLoading={loadingIds.has(p.id)}
          />
        ))}
      </div>
    </div>
  );
}
