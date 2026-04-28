"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { LocationSelector } from "@/components/ui/location-selector";
import { AvatarUpload } from "./avatar-upload";
import { useEditProfile } from "../hooks/use-profile";
import type { ProfileData } from "../types";

interface EditProfileProps {
  data: ProfileData;
  onCancel: () => void;
}

export function EditProfile({ data, onCancel }: EditProfileProps) {
  const {
    personal,
    avatarPreview,
    fileInputRef,
    location,
    setLocation,
    isSaving,
    handleFileChange,
    handleCameraClick,
    handleSubmit
  } = useEditProfile(data, onCancel);

  return (
    <Card className="animate-in fade-in mx-auto max-w-5xl duration-300">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden location fields */}
          <input type="hidden" name="countryId" value={location.countryId || ""} />
          <input type="hidden" name="stateId"   value={location.stateId   || ""} />
          <input type="hidden" name="cityId"    value={location.cityId    || ""} />

          {/* Avatar */}
          <AvatarUpload
            currentAvatar={data.profile.avatar}
            preview={avatarPreview}
            fullName={personal.fullName}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onCameraClick={handleCameraClick}
          />

          {/* Personal fields */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Full Name</Label>
              <Input name="fullName" defaultValue={personal.fullName} />
            </div>

            <div>
              <Label>Nickname</Label>
              <Input name="nickname" defaultValue={personal.nickname} />
            </div>

            <div>
              <Label>Username</Label>
              <Input name="username" defaultValue={personal.username.replace("@", "")} />
            </div>

            <div className="opacity-70">
              <Label>Email</Label>
              <Input
                disabled
                value={personal.email}
                title="Email tidak dapat diganti"
                className="bg-slate-100"
              />
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input type="text" name="phone" defaultValue={personal.phone} />
            </div>

            <div>
              <Label>Date of Birth</Label>
              <Input type="date" name="birthDate" defaultValue={personal.isoBirthDate} />
            </div>

            <div>
              <Label>Grade</Label>
              <Select name="grade" defaultValue={personal.grade || undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elementary School">Elementary School</SelectItem>
                  <SelectItem value="Junior High School">Junior High School</SelectItem>
                  <SelectItem value="Senior High School">Senior High School</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Organization/Institution</Label>
              <Input name="organization" defaultValue={personal.organization} />
            </div>

            <div>
              <Label>Gender</Label>
              <Select name="gender" defaultValue={personal.gender || undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="pt-2">
            <h3 className="mb-4 font-semibold text-slate-800">Address Location</h3>
            <div className="grid grid-cols-1 gap-6 align-top md:grid-cols-3">
              <LocationSelector
                value={location}
                onChange={setLocation}
                showDetectButton={false}
                showClearButton={true}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="min-w-[100px]">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
