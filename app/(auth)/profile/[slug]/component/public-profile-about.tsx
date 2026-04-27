"use client";

import { Building2, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicProfileData } from "../../types";

interface PublicProfileAboutProps {
  data: PublicProfileData;
}

interface AboutFieldProps {
  label: string;
  children: React.ReactNode;
}

function AboutField({ label, children }: AboutFieldProps) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {label}
      </p>
      <div className="mt-1 font-medium text-gray-900 dark:text-white">{children}</div>
    </div>
  );
}

export function PublicProfileAbout({ data }: PublicProfileAboutProps) {
  return (
    <div className="flex-1 ">
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <AboutField label="Nickname">
            {data.nickname || "-"}
          </AboutField>

          <AboutField label="Full Name">
            {data.fullName || "-"}
          </AboutField>

          <AboutField label="Username">
            @{data.username}
          </AboutField>

          <AboutField label="Gender">
            <span className="capitalize">{data.gender || "-"}</span>
          </AboutField>

          <AboutField label="Organization / Institution">
            <div className="flex items-center gap-1.5">
              <Building2 className="text-muted-foreground h-4 w-4" />
              <span>{data.organization || "-"}</span>
            </div>
          </AboutField>

          <AboutField label="Country">
            <div className="flex items-center gap-1.5">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <span>{data.country}</span>
            </div>
          </AboutField>
        </div>
    </div>
  );
}
