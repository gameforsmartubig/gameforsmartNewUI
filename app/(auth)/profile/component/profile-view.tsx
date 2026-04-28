"use client";

import { useState } from "react";
import { ProfileCard } from "./profile-card";
import { ProfileInfo } from "./profile-info";
import { EditProfile } from "./edit-profile";
import type { ProfileData } from "../types";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileViewProps {
  data: ProfileData;
}

export function ProfileView({ data }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <EditProfile data={data} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 ">
        <ProfileCard profile={data.profile} onEdit={() => setIsEditing(true)}/>
          <hr />
        <ProfileInfo
          personal={data.personal}
          address={data.address}
        />
      </CardContent>
    </Card>
  );
}
