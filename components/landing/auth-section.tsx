"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export function AuthSection() {
    const { user, loading } = useAuth();

    return (
        <section id="auth" className="container py-8 md:py-12 lg:py-24 border-t border-border">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
                <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                    Ready to join?
                </h2>
                <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Join thousands of students and teachers who are already learning smarter.
                </p>

                {!loading && (
                    <div className="flex gap-4 mt-4">
                        {user ? (
                            <Link href="/dashboard">
                                <Button size="lg" className="h-11 px-8">Go to Dashboard</Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/register">
                                    <Button size="lg" className="h-11 px-8">Get Started</Button>
                                </Link>
                                <Link href="/login">
                                    <Button variant="outline" size="lg" className="h-11 px-8">Login</Button>
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
