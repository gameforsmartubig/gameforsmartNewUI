"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoField } from "./info-field";
import { AddressSection } from "./address-section";
import type { PersonalInfo, AddressInfo } from "../types";

interface ProfileInfoProps {
  personal: PersonalInfo;
  address: AddressInfo;
  onEdit: () => void;
}

export function ProfileInfo({ personal, address, onEdit }: ProfileInfoProps) {
  return (
    <Card className="flex-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Personal Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your profile details and public identity.
          </p>
        </div>
        <Button variant="outline" onClick={onEdit}>
          Edit
        </Button>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Personal fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InfoField label="NICKNAME"               value={personal.nickname} />
          <InfoField label="FULL NAME"              value={personal.fullName} />
          <InfoField label="USERNAME"               value={personal.username} />
          <InfoField label="EMAIL ADDRESS"          value={personal.email} />
          <InfoField label="DATE OF BIRTH"          value={personal.birthDate} />
          <InfoField label="ORGANIZATION/INSTITUTION" value={personal.grade} />
          <InfoField label="PHONE NUMBER"           value={personal.phone} />
          <InfoField label="GENDER"                 value={personal.gender} />
        </div>

        {/* Address */}
        <AddressSection address={address} />
      </CardContent>
    </Card>
  );
}
