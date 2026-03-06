"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile } from "@/app/service/profile/profile.service";


export function ProfileCard({
  profile
}: { profile: Profile }) {
  return (
    <Card className="w-[340px]">
      <CardContent className="p-6 text-center">
        <Avatar className="mx-auto h-24 w-24">
          <AvatarImage src={profile.avatar} alt={profile.fullName} />
          <AvatarFallback className="rounded-lg">
            {profile.fullName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <h2 className="mt-4 text-xl font-semibold">{profile.fullName}</h2>
        <p className="text-muted-foreground">{profile.username}</p>

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
