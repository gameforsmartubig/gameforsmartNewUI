"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/app/service/profile/profile.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import QRCode from "react-qr-code";


export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Card className="relative flex-1">
      <CardContent className="p-6 text-center">
        <div className="absolute right-4 top-4">
          <Dialog>
            <DialogTrigger asChild>
              <div className="border border-orange-black rounded-lg p-1" title="Share Profile">
              <QrCode />
              </div>
            </DialogTrigger>
            <DialogContent className="flex flex-col items-center sm:max-w-[620px]">
              <DialogHeader>
                <DialogTitle className="text-orange-600">{profile.username}</DialogTitle>
              </DialogHeader>
              <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-lg aspect-square w-full">
                <QRCode value={`${window.location.origin}/profile/${profile.username}`} level="H" style={{ height: 'auto', maxWidth: '100%', width: '100%' }} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Avatar className="mx-auto h-24 w-24">
          <AvatarImage src={profile.avatar} alt={profile.fullName} />
          <AvatarFallback className="rounded-lg">
            {profile.fullName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <h2 className="mt-4 text-xl font-semibold">{profile.fullName}</h2>
        <p className="text-muted-foreground">@{profile.username}</p>

        <div className="mt-6 flex justify-between border-t pt-4">
          <div>
            <p className="font-semibold">{profile.followers}</p>
            <p className="text-muted-foreground text-xs">Followers</p>
          </div>

          <div>
            <p className="font-semibold">{profile.following}</p>
            <p className="text-muted-foreground text-xs">Following</p>
          </div>

          <div>
            <p className="font-semibold">{profile.friends}</p>
            <p className="text-muted-foreground text-xs">Friends</p>
          </div>
        </div>

        {/* <div className="space-y-2 mt-6">
          <Button className="w-full">Follow</Button>
          <Button variant="secondary" className="w-full">
            Message
          </Button>
        </div> */}
      </CardContent>
    </Card>
  );
}
