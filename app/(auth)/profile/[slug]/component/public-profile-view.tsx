"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PublicProfileBanner } from "./public-profile-banner";
import { PublicProfileStats } from "./public-profile-stats";
import { PublicProfileAbout } from "./public-profile-about";
import type { PublicProfileData } from "../../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface PublicProfileViewProps {
  data: PublicProfileData;
}

export function PublicProfileView({ data }: PublicProfileViewProps) {
  const { profile } = data;

  return (
    <div className="flex gap-4">
      <Card className="flex-2">
        <CardContent className="flex flex-col gap-6">
          {/* Stats */}
          <PublicProfileStats profile={profile} />

          <hr />
          {/* About card */}
          <PublicProfileAbout data={data} />
        </CardContent>
      </Card>
      <Card className="flex-1">
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar} alt={profile.fullName} />
                <AvatarFallback className="rounded-lg">lalaaa</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl">{profile.fullName}</p>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
            <Button className="button-orange"><UserPlus/>Add Friend</Button>
          </div>
          <hr />
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar} alt={profile.fullName} />
                <AvatarFallback className="rounded-lg">lalaaa</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl">{profile.fullName}</p>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
            <Button className="button-orange"><UserPlus/>Add Friend</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
