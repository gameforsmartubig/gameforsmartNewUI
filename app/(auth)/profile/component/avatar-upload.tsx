"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
  currentAvatar: string;
  preview: string | null;
  fullName: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCameraClick: () => void;
}

export function AvatarUpload({
  currentAvatar,
  preview,
  fullName,
  fileInputRef,
  onFileChange,
  onCameraClick
}: AvatarUploadProps) {
  return (
    <div className="relative mx-auto w-fit">
      <Avatar className="h-24 w-24 border-2 border-slate-100 shadow-sm">
        <AvatarImage
          src={preview || currentAvatar}
          alt={fullName}
          className="object-cover"
        />
        <AvatarFallback className="rounded-lg bg-orange-100/50 text-orange-700">
          {fullName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <Button
        type="button"
        onClick={onCameraClick}
        variant="default"
        className="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 p-0 text-white shadow-md hover:bg-blue-700"
        title="Ganti Foto Profil">
        <Camera className="h-4 w-4" />
      </Button>

      <input
        type="file"
        name="avatarFile"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={onFileChange}
      />
    </div>
  );
}
