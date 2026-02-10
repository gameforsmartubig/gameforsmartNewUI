"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Zap, BookOpen, Gamepad2, LogIn, UserPlus, LayoutDashboard, Info, Sparkles } from "lucide-react";
import ThemeSwitch from "@/components/layout/header/theme-switch";
import { useTheme } from "next-themes";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export function LandingHeader() {
    const { user, loading } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { href: "#about", label: "About", icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
        { href: "#game", label: "Game", icon: Gamepad2, color: "text-orange-500", bg: "bg-orange-500/10" },
        { href: "#features", label: "Quiz", icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    const headerClasses = cn(
        "sticky top-0 z-50 w-full transition-all duration-500 border-b",
        scrolled
            ? "h-16 bg-background/90 dark:bg-[#0a0a0f]/90 backdrop-blur-2xl border-border/50 dark:border-primary/20 shadow-lg dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            : "h-20 bg-transparent border-transparent"
    );

    if (!mounted) return null;

    return (
        <header className={headerClasses}>
            <div className="container flex h-full items-center justify-between px-6 md:px-12">
                <div className="flex items-center group">
                    <Link href="/" className="flex items-center transition-transform group-hover:scale-105 active:scale-95">
                        <Logo className="md:flex" />
                    </Link>
                </div>

                <div className="hidden md:flex flex-1 items-center ml-12">
                    <nav className="flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="group/nav relative px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all overflow-hidden"
                            >
                                <div className="relative z-10 flex items-center gap-2">
                                    {link.label}

                                </div>
                                <div className="absolute inset-x-2 bottom-0 h-0.5 bg-primary scale-x-0 group-hover/nav:scale-x-100 transition-transform origin-left" />
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4 md:gap-8">
                    <div className="hidden md:flex items-center gap-6">
                        <ThemeSwitch />
                        {!loading && (
                            <div className="flex items-center gap-4">
                                {user ? (
                                    <Link href="/dashboard">
                                        <Button size="lg" className="h-12 px-10 rounded-2xl font-black text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-110 active:scale-95 uppercase tracking-widest italic border border-primary/10 dark:border-white/10 group overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]" />
                                            Enter Arena
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="/login">
                                            <Button variant="ghost" className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 px-6 transition-all rounded-xl">Lobby Access</Button>
                                        </Link>
                                        <Link href="/register">
                                            <Button size="lg" className="h-12 px-10 rounded-2xl font-black text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-110 active:scale-95 uppercase tracking-widest italic border border-primary/10 dark:border-white/10 group overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]" />
                                                Recruit Now
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Navigation Controls */}
                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeSwitch />
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-muted/50 dark:bg-white/5 border border-border/50 dark:border-white/10 hover:bg-primary/20 transition-all">
                                    <Menu className="h-7 w-7 text-foreground dark:text-white" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] border-l-border dark:border-l-primary/20 bg-background/95 dark:bg-[#0a0a0f]/95 backdrop-blur-2xl">
                                <SheetHeader>
                                    <SheetTitle className="text-left flex items-center gap-2">
                                        <Logo className="scale-75 origin-left" />
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col h-full py-10 px-6">
                                    <div className="flex flex-col gap-6">
                                        {navLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setIsOpen(false)}
                                                className="text-lg font-medium hover:text-primary transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="mt-auto space-y-6">
                                        {!loading && (
                                            <div className="grid gap-3 pt-8 border-t">
                                                {user ? (
                                                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                                                        <Button className="w-full rounded-xl font-bold">
                                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                                            Enter Lobby
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <>
                                                        <Link href="/register" onClick={() => setIsOpen(false)}>
                                                            <Button className="w-full rounded-xl font-bold">
                                                                Sign Up
                                                            </Button>
                                                        </Link>
                                                        <Link href="/login" onClick={() => setIsOpen(false)}>
                                                            <Button variant="outline" className="w-full rounded-xl font-bold">
                                                                Log In
                                                            </Button>
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}
