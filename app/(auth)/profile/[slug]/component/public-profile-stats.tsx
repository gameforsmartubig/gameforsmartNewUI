"use client";

import { Users2, UserPlus, UserCheck, UserMinus, Loader2 } from "lucide-react";
import type { Profile } from "../../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFollowStatus } from "../../hooks/use-public-profile";

interface PublicProfileStatsProps {
  profile: Profile;
  targetUserId: string;
}

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <p className="text-muted-foreground mt-0.5 text-lg md:text-xl">{label}</p>
    </div>
  );
}

export function PublicProfileStats({ profile, targetUserId }: PublicProfileStatsProps) {
  const { isFollowing, isLoading, checkingStatus, isOwnProfile, handleToggleFollow } =
    useFollowStatus({ targetUserId });

  return (
    <div className="relative flex-1 space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.avatar} alt={profile.fullName} />
          <AvatarFallback className="rounded-lg">
            {profile.fullName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-4xl text-gray-900 dark:text-white">{profile.fullName}</h2>
          <p className="text-muted-foreground text-sm">@{profile.username}</p>
        </div>
      </div>
      <div className="flex justify-between items-center rounded-xl bg-gray-50 md:justify-normal md:gap-24 dark:bg-zinc-800/50">
        <StatItem
          icon={<Users2 className="h-4 w-4 text-teal-500 md:h-6 md:w-6" />}
          value={profile.followers}
          label="Followers"
        />
        <StatItem
          icon={<UserPlus className="h-4 w-4 text-emerald-500 md:h-6 md:w-6" />}
          value={profile.following}
          label="Following"
        />
        <StatItem
          icon={<UserCheck className="h-4 w-4 text-cyan-500 md:h-6 md:w-6" />}
          value={profile.friends}
          label="Friends"
        />
        {/* Add Friend / Unfollow Button */}
        {!isOwnProfile && !checkingStatus && (
          <Button
            className={
              isFollowing
                ? "button-orange-outline top-0 right-0 md:absolute"
                : "button-orange top-0 right-0 md:absolute"
            }
            onClick={handleToggleFollow}
            disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
              <UserMinus className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {isLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
          </Button>
        )}
      </div>
    </div>
  );
}
