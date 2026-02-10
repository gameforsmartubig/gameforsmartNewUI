import { BadgeCheck, Bell, ChevronRightIcon, CreditCard, LogOut, Sparkles } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";

export default function UserMenu() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  // Fallback data
  const userMeta = user?.user_metadata || {};

  // Helper to check if name is generic
  const isGeneric = (name: string | null | undefined) => {
    if (!name) return true;
    const lower = name.toLowerCase().trim();
    return lower === "user" || lower === "guest" || lower === "unknown" || lower === "member";
  };

  const googleName = userMeta.full_name || userMeta.name || userMeta.custom_claims?.name;
  const dbName = !isGeneric(profile?.fullname) ? profile?.fullname : null;

  const gmailName = googleName || dbName || profile?.username || user?.email?.split('@')[0] || "User";

  const googleAvatar = userMeta.avatar_url || userMeta.picture || userMeta.custom_claims?.picture;
  const dbAvatar = (profile?.avatar_url && profile.avatar_url !== "/images/avatars/01.png") ? profile.avatar_url : null;
  const gmailAvatar = googleAvatar || dbAvatar || "/images/avatars/01.png";

  const userData = {
    name: gmailName,
    username: profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || "user",
    email: user?.email || "guest@example.com",
    avatar: gmailAvatar
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarImage src={userData.avatar} alt={userData.name} />
          <AvatarFallback className="rounded-lg">
            {userData.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-60" align="end">
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar>
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="rounded-lg">
                {userData.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{userData.name}</span>
              <span className="text-muted-foreground truncate text-xs">@{userData.username}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
