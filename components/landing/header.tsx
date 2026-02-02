"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function LandingHeader() {
    const { user, loading, signOut } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <header className="bg-background/80 sticky top-0 z-50 flex h-16 shrink-0 items-center border-b backdrop-blur-xl transition-all">
            <div className="container mx-auto px-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <Image
                        src="/gameforsmartlogo.png"
                        alt="GameForSmart Logo"
                        width={130}
                        height={40}
                        className="h-8 w-auto"
                    />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8 text-[14px] font-bold tracking-tight text-muted-foreground/80">
                    <Link href="#about" className="hover:text-foreground transition-colors">
                        About
                    </Link>
                    <Link href="#features" className="hover:text-foreground transition-colors">
                        Features
                    </Link>
                    <Link href="#quiz" className="hover:text-foreground transition-colors">
                        Quiz
                    </Link>
                </nav>

                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex items-center gap-6">
                    {!loading && (
                        <>
                            {user ? (
                                <Link href="/dashboard">
                                    <Button size="sm" className="rounded-lg h-10 px-6 font-bold shadow-md">
                                        Buka Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm" className="font-bold text-muted-foreground hover:text-primary transition-colors">
                                            Login
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button size="sm" className="rounded-lg h-10 px-6 font-bold shadow-md">
                                            Register
                                        </Button>
                                    </Link>
                                </>
                            )}
                            {user && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => signOut().then(() => window.location.reload())}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    Log out
                                </Button>
                            )}
                        </>
                    )}
                </div>

                {/* Mobile Menu (Hamburger) */}
                <div className="md:hidden flex items-center gap-4">
                    {!loading && user && (
                        <Link href="/dashboard">
                            <Button size="sm" className="rounded-lg h-9 px-4 text-xs font-bold shadow-sm">
                                Dashboard
                            </Button>
                        </Link>
                    )}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col">
                            <SheetHeader className="text-left border-b pb-6 mb-6">
                                <SheetTitle>
                                    <Image
                                        src="/gameforsmartlogo.png"
                                        alt="GameForSmart Logo"
                                        width={140}
                                        height={42}
                                        className="h-9 w-auto"
                                    />
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-6 flex-1">
                                <nav className="flex flex-col gap-2">
                                    <Link
                                        href="#about"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-4 px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-xl transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                        </div>
                                        About
                                    </Link>
                                    <Link
                                        href="#features"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-4 px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-xl transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                        </div>
                                        Features
                                    </Link>
                                    <Link
                                        href="#quiz"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-4 px-4 py-3 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-xl transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                        </div>
                                        Quiz
                                    </Link>
                                </nav>

                                <div className="mt-auto">
                                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                                        {!loading && (
                                            <div className="flex flex-col gap-3">
                                                {user ? (
                                                    <>
                                                        <div className="flex items-center gap-3 mb-2 px-1">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                {user.email?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="text-sm font-bold truncate">{user.email}</p>
                                                                <p className="text-xs text-muted-foreground">Logged in</p>
                                                            </div>
                                                        </div>
                                                        <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                                                            <Button className="w-full rounded-xl h-12 text-base font-bold shadow-sm">
                                                                Buka Dashboard
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full rounded-xl h-11 text-sm font-medium border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                                            onClick={() => {
                                                                setIsOpen(false);
                                                                signOut().then(() => window.location.reload());
                                                            }}
                                                        >
                                                            Log out
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-sm text-center text-muted-foreground font-medium mb-1">
                                                            Mulai petualangan belajarmu
                                                        </p>
                                                        <Link href="/login" onClick={() => setIsOpen(false)}>
                                                            <Button variant="outline" className="w-full rounded-xl h-11 text-base font-bold border-2 bg-background">
                                                                Login
                                                            </Button>
                                                        </Link>
                                                        <Link href="/register" onClick={() => setIsOpen(false)}>
                                                            <Button className="w-full rounded-xl h-11 text-base font-bold shadow-sm">
                                                                Register
                                                            </Button>
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
