"use client"

import { useState } from "react"
import { ProfileCard, ProfileInfo, EditProfile } from "./"

export function ProfileView({ data }: any) {

  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <EditProfile
        data={data}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className="flex gap-6">
      <ProfileCard {...data.profile} />

      <ProfileInfo
        personal={data.personal}
        address={data.address}
        onEdit={() => setIsEditing(true)}
      />
    </div>
  )
}