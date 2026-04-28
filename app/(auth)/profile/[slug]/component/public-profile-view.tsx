"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PublicProfileStats } from "./public-profile-stats";
import { PublicProfileAbout } from "./public-profile-about";
import PublicProfileOther from "./public-profile-other";
import type { PublicProfileData } from "../../types";

interface PublicProfileViewProps {
  data: PublicProfileData;
}

export function PublicProfileView({ data }: PublicProfileViewProps) {
  const { profile } = data;

  return (
    <div className="flex gap-4 flex-col md:flex-row">
      <Card className="flex-2">
        <CardContent className="flex flex-col gap-6">
          {/* Stats with Add Friend */}
          <PublicProfileStats profile={profile} targetUserId={data.id} />

          <hr />
          {/* About card */}
          <PublicProfileAbout data={data} />
        </CardContent>
      </Card>
      <Card className="flex-1">
        <CardContent>
          {/* Suggested profiles to follow */}
          <PublicProfileOther excludeProfileId={data.id} />
        </CardContent>
      </Card>
    </div>
  );
}
