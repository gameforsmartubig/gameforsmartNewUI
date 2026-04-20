"use client";

import { Users2, UserPlus, UserCheck } from "lucide-react";
import type { Profile } from "../../types";

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
        <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
    </div>
  );
}

export function PublicProfileStats({ profile }: PublicProfileStatsProps) {
  return (
    <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-gray-50 p-4 dark:bg-zinc-800/50">
      <StatItem
        icon={<Users2 className="h-4 w-4 text-teal-500" />}
        value={profile.followers}
        label="Followers"
      />
      <StatItem
        icon={<UserPlus className="h-4 w-4 text-emerald-500" />}
        value={profile.following}
        label="Following"
      />
      <StatItem
        icon={<UserCheck className="h-4 w-4 text-cyan-500" />}
        value={profile.friends}
        label="Friends"
      />
    </div>
  );
}
