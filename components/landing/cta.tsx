"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Sparkles } from "lucide-react";

export function CTA() {
    const { user, loading } = useAuth();

    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto flex flex-col items-center gap-8 text-center max-w-4xl px-6">
                <div className="space-y-4">
                    <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
                        Ready to Dominate?
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Join the next evolution of AI-powered competitive learning. <br />
                        <span className="text-foreground font-medium">Your legend begins here.</span>
                    </p>
                </div>

                {!loading && (
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        {user ? (
                            <Link href="/dashboard">
                                <Button size="lg" className="h-14 px-10 rounded-full text-lg font-bold">
                                    Launch Arena
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/register">
                                    <Button size="lg" className="h-14 px-10 rounded-full text-lg font-bold">
                                        Recruit Now
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button variant="outline" size="lg" className="h-14 px-10 rounded-full text-lg font-medium">
                                        Member Login
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
