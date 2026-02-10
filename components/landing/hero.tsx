"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Gamepad2, Trophy, Zap } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function Hero() {
    const { user, loading } = useAuth();
    const [onlinePlayers, setOnlinePlayers] = useState(12435);
    const [mounted, setMounted] = useState(false);

    // Simulate live player count updates
    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setOnlinePlayers(prev => prev + Math.floor(Math.random() * 10) - 2);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="about" className="relative flex items-center justify-center pt-24 pb-12 bg-background">
            <div className="container relative z-10 flex flex-col items-center text-center px-4">
                {/* Live Stats Widget */}
                <div className="mb-8 flex items-center gap-4">
                    <div className="px-4 py-2 rounded-full flex items-center gap-2 border bg-muted/50">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {mounted ? onlinePlayers.toLocaleString() : onlinePlayers} Online
                        </span>
                    </div>
                </div>

                {/* Hero Title */}
                <div className="mb-8 space-y-4">
                    <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-foreground">
                        ENTER THE ARENA
                    </h1>
                    <p className="max-w-[800px] text-xl text-muted-foreground sm:text-2xl leading-relaxed mx-auto">
                        The next generation of <span className="font-bold text-foreground">AI Quizzing</span> is here. <br />
                        Battle friends, win coins, and claim your legend.
                    </p>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center mt-8">
                    {!loading && (
                        <>
                            {user ? (
                                <Link href="/dashboard">
                                    <Button size="lg" className="h-16 px-10 rounded-full text-lg font-bold">
                                        <Gamepad2 className="mr-2 h-5 w-5" />
                                        Launch Lobby
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/register">
                                        <Button size="lg" className="h-16 px-10 rounded-full text-lg font-bold">
                                            <Zap className="mr-2 h-5 w-5 fill-current" />
                                            Play Now
                                        </Button>
                                    </Link>
                                    <Link href="#game">
                                        <Button variant="outline" size="lg" className="h-16 px-10 rounded-full text-lg font-medium">
                                            Browse Games
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
