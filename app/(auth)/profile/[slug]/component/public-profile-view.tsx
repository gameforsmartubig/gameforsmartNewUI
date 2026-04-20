"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PublicProfileBanner } from "./public-profile-banner";
import { PublicProfileStats } from "./public-profile-stats";
import { PublicProfileAbout } from "./public-profile-about";
import type { PublicProfileData } from "../../types";

interface PublicProfileViewProps {
  data: PublicProfileData;
}

export function PublicProfileView({ data }: PublicProfileViewProps) {
  const { profile } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Hero card: banner + avatar + name + stats */}
      <Card className="overflow-hidden border-0 shadow-xl">
        <PublicProfileBanner profile={profile} />

        <CardContent className="relative px-6 pb-6">
          {/* Name & username */}
          <div className="text-center">
            {data.nickname && (
              <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
                {data.nickname}
              </p>
            )}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.fullName}
            </h2>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
          </div>

          {/* Stats */}
          <PublicProfileStats profile={profile} />
        </CardContent>
      </Card>

      {/* About card */}
      <PublicProfileAbout data={data} />
    </div>
  );
}
