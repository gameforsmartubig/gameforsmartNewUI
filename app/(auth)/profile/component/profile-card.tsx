"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileCardProps {
  name: string;
  username: string;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
  friends: number;
}

export function ProfileCard({
  name,
  username,
  bio,
  avatar,
  followers,
  following,
  friends
}: ProfileCardProps) {
  return (
    <Card className="w-[340px]">
      <CardContent className="p-6 text-center">
        <Avatar className="mx-auto h-24 w-24">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="rounded-lg">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <h2 className="mt-4 text-xl font-semibold">{name}</h2>
        <p className="text-muted-foreground">{username}</p>

        <div className="mt-6 flex justify-between border-t pt-4">
          <div>
            <p className="font-semibold">{followers}</p>
            <p className="text-muted-foreground text-xs">Followers</p>
          </div>

          <div>
            <p className="font-semibold">{following}</p>
            <p className="text-muted-foreground text-xs">Following</p>
          </div>

          <div>
            <p className="font-semibold">{friends}</p>
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
