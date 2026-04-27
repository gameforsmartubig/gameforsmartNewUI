"use client";

import { Users2, UserPlus, UserCheck } from "lucide-react";
import type { Profile } from "../../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PublicProfileStatsProps {
  profile: Profile;
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
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <p className="text-muted-foreground mt-0.5 text-xl">{label}</p>
    </div>
  );
}

export function PublicProfileStats({ profile }: PublicProfileStatsProps) {
  return (
    <div className="relative flex-1 space-y-6">
      <Button className="button-orange absolute top-0 right-0">
        <UserPlus />
        Add Friend
      </Button>
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
      <div className="flex items-center mb-0">
        <div className="grid grid-cols-3 gap-24 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
          <StatItem
            icon={<Users2 className="h-6 w-6 text-teal-500" />}
            value={profile.followers}
            label="Followers"
          />
          <StatItem
            icon={<UserPlus className="h-6 w-6 text-emerald-500" />}
            value={profile.following}
            label="Following"
          />
          <StatItem
            icon={<UserCheck className="h-6 w-6 text-cyan-500" />}
            value={profile.friends}
            label="Friends"
          />
        </div>
      </div>
    </div>
  );
}
