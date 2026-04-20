"use client";

import type { Profile } from "../types";

interface ProfileStatsProps {
  profile: Profile;
}

interface StatItemProps {
  value: number;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div>
      <p className="font-semibold">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  return (
    <div className="mt-6 flex justify-between border-t pt-4">
      <StatItem value={profile.followers} label="Followers" />
      <StatItem value={profile.following} label="Following" />
      <StatItem value={profile.friends}   label="Friends" />
    </div>
  );
}
