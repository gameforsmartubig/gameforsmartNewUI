"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Globe, Key, LogOut, Mail, MapPin, Pencil, Settings, Trash2, EyeOff, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

import Flag from "react-world-flags";
import { getCurrentLanguage, setLanguage, supportedLanguages, Language } from "@/lib/i18n";
import { EditProfileDialog } from "./component/edit-profile-dialog";

export default function ProfilePage() {
    const { user, profile, loading, signOut } = useAuth();
    const [isPrivate, setIsPrivate] = useState(false);
    const [language, setLanguageState] = useState<Language>("en");
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    // Optimized profile data derivation - prioritize Gmail/Google account metadata
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

    const profileData = {
        name: displayName,
        username: profile?.username || userMeta.username || user?.email?.split('@')[0] || "guest",
        email: profile?.email || user?.email || "",
        location: profile?.countries?.name || "",
        bio: "",
        avatar: displayAvatar
    };

    const handleLanguageChange = async (value: string) => {
        const langCode = value as Language;
        await setLanguage(langCode);
        setLanguageState(langCode);
        toast.success(`Bahasa diganti ke ${supportedLanguages.find(l => l.code === langCode)?.name}`);
    };

    const handleToggle = () => {
        const newState = !isPrivate;
        setIsPrivate(newState);
        if (newState) {
            toast.success("Profile sekarang private");
        } else {
            toast.success("Profile sekarang public");
        }
    };

    const handleSignOut = async () => {
        await signOut();
        window.location.href = "/login";
    };

    const handleSaveUserProfile = (data: { name: string; username: string; location: string; bio?: string; avatar?: string }) => {
        // Since we now derive data directly, we would normally trigger a refresh or update the DB
        toast.info("Updating profile...");
    };

    return (
        <div className="container mx-auto max-w-5xl space-y-8 pt-6 pb-12 px-4 md:px-0">

            <EditProfileDialog
                open={isEditProfileOpen}
                onOpenChange={setIsEditProfileOpen}
                initialData={profileData}
                onSave={handleSaveUserProfile}
            />

            {/* Profile Header section */}
            <div className="relative overflow-hidden rounded-3xl bg-card border shadow-sm">
                {/* Banner Backdrop */}
                <div className="h-32 md:h-48 bg-linear-to-r from-orange-400 via-rose-400 to-purple-500 opacity-20 grayscale-20"></div>

                <CardContent className="px-6 pb-8 -mt-12 md:-mt-16 relative">
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                            {/* Avatar with Ring */}
                            <div className="relative group">
                                <Avatar className="h-24 w-24 md:h-36 md:w-36 border-4 border-background ring-4 ring-orange-500/10 shadow-xl overflow-hidden transition-all duration-300">
                                    <AvatarImage src={profileData.avatar} alt={profileData.name} className="object-cover" />
                                    <AvatarFallback className="bg-orange-600 text-4xl text-white font-bold">
                                        {profileData.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            {/* Profile Info */}
                            <div className="space-y-1 pb-2">
                                <h1 className="text-2xl font-black text-foreground md:text-4xl tracking-tight">{profileData.name}</h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground font-medium">
                                    <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                                        <Mail className="h-3.5 w-3.5 text-orange-500" />
                                        {profileData.email}
                                    </span>
                                    {profileData.location && (
                                        <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                                            <MapPin className="h-3.5 w-3.5 text-rose-500" />
                                            {profileData.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="rounded-full font-bold px-6 border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-all"
                                onClick={() => setIsEditProfileOpen(true)}
                            >
                                Edit Profile
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="rounded-full">
                                        <Settings className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl">
                                    <DropdownMenuLabel className="text-muted-foreground font-semibold text-xs px-2 py-1.5 uppercase tracking-wider">Settings</DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent text-sm cursor-pointer" onClick={handleToggle}>
                                        <div className="flex items-center gap-3">
                                            {isPrivate ? (
                                                <EyeOff className="h-4 w-4 text-slate-500" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-orange-500" />
                                            )}
                                            <span>{isPrivate ? "Private Profile" : "Public Profile"}</span>
                                        </div>
                                        <Switch
                                            checked={isPrivate}
                                            onCheckedChange={handleToggle}
                                            className="scale-75"
                                        />
                                    </div>

                                    <DropdownMenuItem className="gap-3 p-2 cursor-pointer rounded-lg">
                                        <Key className="h-4 w-4 text-purple-500" />
                                        <span>Ganti Password</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem onClick={handleSignOut} className="gap-3 p-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg">
                                        <LogOut className="h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="gap-3 p-2 cursor-pointer text-destructive/80 focus:text-destructive focus:bg-destructive/10 rounded-lg">
                                        <Trash2 className="h-4 w-4" />
                                        <span>Hapus Akun</span>
                                    </DropdownMenuItem>

                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="mt-8 pt-8 border-t flex flex-wrap items-center justify-center md:justify-start gap-8 md:gap-16">
                        <Link href="/friend?tab=following" className="group/stat">
                            <div className="text-center md:text-left transition-transform active:scale-95">
                                <div className="text-2xl font-black text-foreground group-hover/stat:text-orange-600">0</div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Following</div>
                            </div>
                        </Link>
                        <Link href="/friend?tab=follower" className="group/stat">
                            <div className="text-center md:text-left transition-transform active:scale-95">
                                <div className="text-2xl font-black text-foreground group-hover/stat:text-orange-600">0</div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Followers</div>
                            </div>
                        </Link>
                        <Link href="/friend?tab=friends" className="group/stat">
                            <div className="text-center md:text-left transition-transform active:scale-95">
                                <div className="text-2xl font-black text-foreground group-hover/stat:text-orange-600">0</div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Friends</div>
                            </div>
                        </Link>
                    </div>
                </CardContent>
            </div>

            {/* Bottom Content Grid */}
            <div className="grid gap-8 lg:grid-cols-12">
                {/* Main Settings column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Language Card */}
                    <Card className="overflow-hidden border-none shadow-sm bg-card/60 backdrop-blur-sm">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <h3 className="font-bold">Preferences</h3>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Display Language</label>
                                <Select value={language} onValueChange={handleLanguageChange}>
                                    <SelectTrigger className="w-full bg-background/50 border-orange-100 rounded-xl">
                                        <SelectValue placeholder="Language">
                                            <div className="flex items-center gap-3">
                                                <span className="relative flex h-5 w-5 overflow-hidden rounded-full border shadow-sm">
                                                    <Flag code={supportedLanguages.find(l => l.code === language)?.flag || 'us'} className="h-full w-full object-cover" />
                                                </span>
                                                <span className="font-medium">{supportedLanguages.find(l => l.code === language)?.name}</span>
                                            </div>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl p-1">
                                        {supportedLanguages.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code} className="rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="relative flex h-5 w-5 overflow-hidden rounded-full border shadow-sm">
                                                        <Flag code={lang.flag} className="h-full w-full object-cover" />
                                                    </span>
                                                    <span>{lang.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Health/Security Placeholder */}
                    <Card className="overflow-hidden border-none shadow-sm bg-card/60 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                        <Settings className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-bold">Account Security</h3>
                                </div>
                                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                    <p className="text-sm font-medium text-orange-900/70 dark:text-orange-200/70">Your profile is currently public and secure.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Notifications column */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Penerima Notifikasi */}
                        <Card className="overflow-hidden border shadow-sm h-full rounded-2xl">
                            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
                                <h3 className="font-bold text-sm uppercase tracking-wide">Penerima Notifikasi</h3>
                                <Button size="sm" variant="ghost" className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold px-3">Tambah</Button>
                            </div>
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center justify-center py-8 space-y-3 opacity-60">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                        <Mail className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground tracking-wide">Belum ada penerima</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pengirim Notifikasi */}
                        <Card className="overflow-hidden border shadow-sm h-full rounded-2xl">
                            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
                                <h3 className="font-bold text-sm uppercase tracking-wide">Pengirim Notifikasi</h3>
                            </div>
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center justify-center py-8 space-y-3 opacity-60">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                        <Settings className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground tracking-wide">Belum ada pengirim</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity Placeholder */}
                    <Card className="overflow-hidden border shadow-sm rounded-2xl">
                        <div className="px-6 py-4 border-b bg-muted/30">
                            <h3 className="font-bold text-sm uppercase tracking-wide">Recent Activity</h3>
                        </div>
                        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="text-muted-foreground/40 font-black text-4xl italic">PLAY MORE</div>
                            <p className="text-sm text-muted-foreground font-medium italic">Complete more quests to see your activity here</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
}
