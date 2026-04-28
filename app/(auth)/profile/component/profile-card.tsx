"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileStats } from "./profile-stats";
import { ProfileQrDialog } from "./profile-qr-dialog";
import type { Profile } from "../types";
import { Button } from "@/components/ui/button";

interface ProfileCardProps {
  profile: Profile;
  onEdit: () => void;
}

export function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  return (
    <div className="relative flex-1">
      {/* QR Code trigger */}
      <div className="absolute top-0 right-0 flex items-center gap-2">
        <div className="">
          <ProfileQrDialog username={profile.username} />
        </div>
        <Button className="button-orange-outline" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <div className="flex gap-4 items-center">
        {/* Avatar */}
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.avatar} alt={profile.fullName} />
          <AvatarFallback className="rounded-lg">
            {profile.fullName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-2xl font-semibold">{profile.fullName}</h2>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>
          <ProfileStats profile={profile} />
        </div>
      </div>
    </div>
  );
}
