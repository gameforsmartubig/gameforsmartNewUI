"use client";

import { Link2Icon, Mail, MapPin, PhoneCall } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

export function ProfileCard() {
  const { user, profile } = useAuth();

  const userMeta = user?.user_metadata || {};

  // Helper to check if name is generic
  const isGeneric = (name: string | null | undefined) => {
    if (!name) return true;
    const lower = name.toLowerCase().trim();
    return lower === "user" || lower === "guest" || lower === "unknown" || lower === "member";
  };

  // Prio 1: Google/Social metadata (full_name)
  // Prio 2: DB Profile fullname (if not generic)
  // Prio 3: DB Profile username
  // Prio 4: Email username

  const googleName = userMeta.full_name || userMeta.name || userMeta.custom_claims?.name;
  const dbName = !isGeneric(profile?.fullname) ? profile?.fullname : null;

  // Final Resolved Name
  const displayName = googleName || dbName || profile?.username || user?.email?.split('@')[0] || "User";

  // Avatar Resolution
  const googleAvatar = userMeta.avatar_url || userMeta.picture || userMeta.custom_claims?.picture;
  const dbAvatar = (profile?.avatar_url && profile.avatar_url !== "/images/avatars/10.png") ? profile.avatar_url : null;
  const displayAvatar = googleAvatar || dbAvatar || "/images/avatars/10.png";

  const userData = {
    name: displayName,
    username: profile?.username || userMeta.username || user?.email?.split('@')[0] || "guest",
    email: profile?.email || user?.email || "guest@example.com",
    avatar: displayAvatar,
    role: profile?.role || "Member",
    location: profile?.countries?.name || ""
  };

  return (
    <Card className="relative overflow-hidden group border-none shadow-lg bg-card/80 backdrop-blur-xl rounded-3xl">
      {/* Brand accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-orange-400 to-rose-400" />

      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardContent className="relative pt-10 pb-8 px-6">
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-5">
            <div className="relative">
              <div className="absolute -inset-1 bg-linear-to-tr from-orange-400 to-rose-400 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity" />
              <Avatar className="size-28 border-4 border-background shadow-2xl relative">
                <AvatarImage src={userData.avatar} alt={userData.name} className="object-cover" />
                <AvatarFallback className="bg-orange-500 text-white font-black text-2xl">
                  {userData.name.substring(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1.5 right-1.5 size-6 rounded-full bg-green-500 border-4 border-background shadow-lg" />
            </div>

            <div className="text-center space-y-1">
              <h5 className="flex items-center justify-center gap-2 text-2xl font-black tracking-tight text-foreground">
                {userData.name}
              </h5>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20">
                PRO PLAYER
              </div>
              <div className="text-muted-foreground font-semibold text-sm pt-1">@{userData.username}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 transition-colors hover:bg-muted/50">
              <h5 className="text-xl font-black">12</h5>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Games</div>
            </div>
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 transition-colors hover:bg-muted/50">
              <h5 className="text-xl font-black">450</h5>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Coins</div>
            </div>
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 transition-colors hover:bg-muted/50">
              <h5 className="text-xl font-black">Lv.5</h5>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rank</div>
            </div>
          </div>

          <div className="flex flex-col gap-y-2 pt-2">
            <div className="flex items-center gap-3 text-sm font-semibold p-2.5 rounded-xl hover:bg-muted/50 transition-all group/item">
              <div className="p-1.5 rounded-lg bg-primary/5 text-primary group-hover/item:bg-orange-500 group-hover/item:text-white transition-colors">
                <Mail className="size-3.5" />
              </div>
              <span className="truncate text-muted-foreground group-hover/item:text-foreground transition-colors">{userData.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold p-2.5 rounded-xl hover:bg-muted/50 transition-all group/item">
              <div className="p-1.5 rounded-lg bg-primary/5 text-primary group-hover/item:bg-orange-500 group-hover/item:text-white transition-colors">
                <MapPin className="size-3.5" />
              </div>
              <span className="truncate text-muted-foreground group-hover/item:text-foreground transition-colors">{userData.location}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
