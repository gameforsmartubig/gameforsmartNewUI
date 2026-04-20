"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "../../types";

interface PublicProfileBannerProps {
  profile: Profile;
}

export function PublicProfileBanner({ profile }: PublicProfileBannerProps) {
  return (
    <>
      {/* Gradient banner */}
      <div className="relative h-32 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-60" />
      </div>

      {/* Avatar — overlapping banner */}
      <div className="-mt-16 mb-4 flex justify-center">
        <div className="rounded-full border-4 border-white shadow-lg dark:border-zinc-900">
          <Avatar className="h-28 w-28">
            <AvatarImage src={profile.avatar} alt={profile.fullName} />
            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-2xl font-bold text-white">
              {profile.fullName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </>
  );
}
