
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

import Flag from "react-world-flags";
import { getCurrentLanguage, setLanguage, supportedLanguages, Language } from "@/lib/i18n";
import { EditProfileDialog } from "./component/edit-profile-dialog";

export default function ProfilePage() {
    const [isPrivate, setIsPrivate] = useState(false);
    const [language, setLanguageState] = useState<Language>("en");
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    // Initial dummy data
    const [userProfile, setUserProfile] = useState({
        name: "FIENZZ",
        username: "fienzz1809",
        email: "fienzz1809@gmail.com",
        location: "Kabupaten Malang, Jawa Timur",
        bio: "",
        avatar: ""
    });

    useEffect(() => {
        setLanguageState(getCurrentLanguage());
    }, []);

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

    const handleSaveUserProfile = (data: { name: string; username: string; location: string; bio?: string; avatar?: string }) => {
        setUserProfile(prev => ({ ...prev, ...data }));
    };

    return (
        <div className="container mx-auto max-w-5xl space-y-6 pt-6 pb-12">

            <EditProfileDialog
                open={isEditProfileOpen}
                onOpenChange={setIsEditProfileOpen}
                initialData={userProfile}
                onSave={handleSaveUserProfile}
            />

            {/* Profile Card */}
            <Card className="relative overflow-hidden border-none shadow-sm">
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-orange-500"></div>
                <CardContent className="p-6 md:p-10">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                        <div className="flex flex-col gap-6 md:flex-row md:items-center">
                            {/* Avatar */}
                            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
                                <AvatarImage src={userProfile.avatar} alt={userProfile.name} className="object-cover" />
                                <AvatarFallback className="bg-green-600 text-4xl text-white font-bold">
                                    {userProfile.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>

                            {/* Profile Info */}
                            <div className="space-y-3">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground md:text-3xl">{userProfile.name}</h1>
                                    <p className="text-md text-muted-foreground">@{userProfile.username}</p>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-8 md:gap-12">
                                    <Link href="/friend?tab=following">
                                        <div className="text-center md:text-left group/stat cursor-pointer hover:opacity-80 transition-opacity">
                                            <div className="text-xl font-bold">128</div>
                                            <div className="text-xs text-muted-foreground">Following</div>
                                        </div>
                                    </Link>
                                    <div className="h-8 w-px bg-border"></div>
                                    <Link href="/friend?tab=follower">
                                        <div className="text-center md:text-left group/stat cursor-pointer hover:opacity-80 transition-opacity">
                                            <div className="text-xl font-bold">342</div>
                                            <div className="text-xs text-muted-foreground">Followers</div>
                                        </div>
                                    </Link>
                                    <div className="h-8 w-px bg-border"></div>
                                    <Link href="/friend?tab=friends">
                                        <div className="text-center md:text-left group/stat cursor-pointer hover:opacity-80 transition-opacity">
                                            <div className="text-xl font-bold">45</div>
                                            <div className="text-xs text-muted-foreground">Friends</div>
                                        </div>
                                    </Link>
                                </div>

                                {/* Contact Details */}
                                <div className="flex flex-col gap-1 pt-1 md:flex-row md:gap-6 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <span>{userProfile.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>{userProfile.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings Menu */}
                        <div className="absolute right-6 top-6 md:static">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Settings className="h-6 w-6 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 p-2">
                                    <DropdownMenuLabel className="text-muted-foreground font-normal text-sm px-2 py-1.5">Settings</DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        className="gap-3 p-2 cursor-pointer"
                                        onSelect={() => setIsEditProfileOpen(true)}
                                    >
                                        <Pencil className="h-4 w-4 text-blue-500" />
                                        <span>Edit Profile</span>
                                    </DropdownMenuItem>

                                    <div className="flex items-center justify-between p-2 rounded-sm hover:bg-accent text-sm cursor-pointer" onClick={handleToggle}>
                                        <div className="flex items-center gap-3">
                                            {isPrivate ? (
                                                <EyeOff className="h-4 w-4 text-slate-500" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-blue-500" />
                                            )}
                                            <span>{isPrivate ? "Private Profile" : "Public Profile"}</span>
                                        </div>
                                        <Switch
                                            checked={isPrivate}
                                            onCheckedChange={handleToggle}
                                            className="scale-75"
                                        />
                                    </div>

                                    <DropdownMenuItem className="gap-3 p-2 cursor-pointer">
                                        <Key className="h-4 w-4 text-purple-500" />
                                        <span>Ganti Password</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem className="gap-3 p-2 cursor-pointer text-orange-600 focus:text-orange-600 focus:bg-orange-50">
                                        <LogOut className="h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="gap-3 p-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                        <span>Hapus Akun</span>
                                    </DropdownMenuItem>

                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                    </div>
                </CardContent>
            </Card>

            {/* Language Section */}
            <Card className="relative overflow-hidden border-none shadow-sm">
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-blue-500"></div>
                <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h3 className="text-md font-semibold">Language</h3>
                        </div>
                    </div>
                    <Select value={language} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Language">
                                <div className="flex items-center gap-3">
                                    <span className="relative flex h-5 w-5 overflow-hidden rounded-full border shadow-sm">
                                        <Flag code={supportedLanguages.find(l => l.code === language)?.flag || 'us'} className="h-full w-full object-cover" />
                                    </span>
                                    <span>{supportedLanguages.find(l => l.code === language)?.name}</span>
                                </div>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {supportedLanguages.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
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
                </CardContent>
            </Card>

            {/* Notification Sections */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Penerima Notifikasi */}
                <Card className="relative overflow-hidden border-none shadow-sm h-full">
                    {/* <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-green-500"></div> */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <h3 className="font-semibold">Penerima Notifikasi</h3>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Tambah</Button>
                    </div>
                    <CardContent className="p-6 pt-0">
                        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                            Belum ada penerima
                        </div>
                    </CardContent>
                </Card>

                {/* Pengirim Notifikasi */}
                <Card className="relative overflow-hidden border-none shadow-sm h-full">
                    {/* <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-purple-500"></div> */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <h3 className="font-semibold">Pengirim Notifikasi</h3>
                    </div>
                    <CardContent className="p-6 pt-0">
                        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                            Belum ada pengirim
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
