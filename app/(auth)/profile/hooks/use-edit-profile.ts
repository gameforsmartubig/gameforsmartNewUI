"use client";

import { useState, useRef, useEffect, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload-image";
import { updateProfileData } from "../services/profile.service";
import type { LocationValue } from "@/components/ui/location-selector";
import type { ProfileData } from "../types";

export function useEditProfile(data: ProfileData, onCancel: () => void) {
  const router = useRouter();
  const { personal, address } = data;

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Location
  const [location, setLocation] = useState<LocationValue>({
    countryId: address.countryId || null,
    stateId:   address.stateId   || null,
    cityId:    address.cityId    || null,
    countryName: address.country !== "-" ? address.country : "",
    stateName:   address.state   !== "-" ? address.state   : "",
    cityName:    address.city    !== "-" ? address.city    : "",
    latitude:  null,
    longitude: null
  });

  // Server action
  const [state, formAction, isPendingForm] = useActionState(updateProfileData, null);
  const [isPendingTrans, startTransition]  = useTransition();
  const isSaving = isPendingForm || isPendingTrans || isUploading;

  // React to server action result
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.refresh();
      setTimeout(() => onCancel(), 500);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onCancel, router]);

  // Avatar handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCameraClick = () => fileInputRef.current?.click();

  // Form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const file = formData.get("avatarFile") as File;
    if (file && file.size > 0 && file.name !== "undefined") {
      setIsUploading(true);
      const url = await uploadImage(file, "avatars");
      setIsUploading(false);

      if (url) {
        formData.append("avatarUrl", url);
      } else {
        toast.error("Gagal mengunggah foto profil baru.");
        return;
      }
    }

    formData.delete("avatarFile");
    startTransition(() => formAction(formData));
  };

  return {
    personal,
    avatarPreview,
    fileInputRef,
    location,
    setLocation,
    isSaving,
    handleFileChange,
    handleCameraClick,
    handleSubmit
  };
}
