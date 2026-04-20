"use client";

import { useState } from "react";
import { ProfileCard } from "./profile-card";
import { ProfileInfo } from "./profile-info";
import { EditProfile } from "./edit-profile";
import type { ProfileData } from "../types";

interface ProfileViewProps {
  data: ProfileData;
}

export function ProfileView({ data }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <EditProfile data={data} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <ProfileCard profile={data.profile} />
      <ProfileInfo
        personal={data.personal}
        address={data.address}
        onEdit={() => setIsEditing(true)}
      />
    </div>
  );
}
