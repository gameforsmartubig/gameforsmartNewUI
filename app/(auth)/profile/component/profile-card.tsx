"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileStats } from "./profile-stats";
import { ProfileQrDialog } from "./profile-qr-dialog";
import type { Profile } from "../types";

interface ProfileCardProps {
  profile: Profile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card className="relative flex-1">
      <CardContent className="p-6 text-center">
        {/* QR Code trigger */}
        <div className="absolute right-4 top-4">
          <ProfileQrDialog username={profile.username} />
        </div>

        {/* Avatar */}
        <Avatar className="mx-auto h-24 w-24">
          <AvatarImage src={profile.avatar} alt={profile.fullName} />
          <AvatarFallback className="rounded-lg">
            {profile.fullName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <h2 className="mt-4 text-xl font-semibold">{profile.fullName}</h2>
        <p className="text-muted-foreground">@{profile.username}</p>

        <ProfileStats profile={profile} />
      </CardContent>
    </Card>
  );
}
