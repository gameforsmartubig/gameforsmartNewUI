"use client";

import { QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

interface ProfileQrDialogProps {
  username: string;
}

export function ProfileQrDialog({ username }: ProfileQrDialogProps) {
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/profile/${username}`
      : `/profile/${username}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className="cursor-pointer rounded-lg border border-orange-black p-1"
          title="Share Profile">
          <QrCode />
        </div>
      </DialogTrigger>
      <DialogContent className="flex flex-col items-center sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="text-orange-600">{username}</DialogTitle>
        </DialogHeader>
        <div className="aspect-square w-full rounded-xl border border-orange-100 bg-white p-4 shadow-lg">
          <QRCode
            value={profileUrl}
            level="H"
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
