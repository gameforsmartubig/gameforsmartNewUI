"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { Brain, Rocket, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export function Hero() {
    const { user, loading } = useAuth();

    return (
        <section id="about" className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-background">
            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-10 border border-border/50">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Tambah Nge-Game, Tambah Cerdas</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter leading-[0.95] mb-10 text-foreground font-display">
                        Buat Game Quiz
                        <br />
                        <span className="text-primary italic">Luar Biasa</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed mb-12 max-w-2xl mx-auto font-medium">
                        Transformasikan cara mengajar Anda dengan pembuatan kuis berbasis AI dan game multiplayer real-time.
                    </p>

                    {!loading && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-24">
                            {user ? (
                                <Link href="/dashboard">
                                    <Button size="lg" className="rounded-xl px-12 h-14 text-base font-bold shadow-lg transition-all hover:scale-105 active:scale-95">
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/register">
                                        <Button size="lg" className="rounded-xl px-12 h-14 text-base font-bold shadow-lg transition-all hover:scale-105 active:scale-95">
                                            Register
                                        </Button>
                                    </Link>
                                    <Link href="/login">
                                        <Button size="lg" variant="outline" className="rounded-xl px-12 h-14 text-base font-bold bg-background shadow-sm transition-all hover:bg-accent group">
                                            Login
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative max-w-4xl mx-auto"
                >
                    <div className="relative p-2 bg-muted/30 rounded-[2rem] border border-border/50 shadow-sm backdrop-blur-sm">
                        <div className="bg-card rounded-[1.5rem] overflow-hidden border border-border shadow-2xl relative">
                            <Image
                                src="/academy-dashboard-light.svg"
                                alt="Dashboard Preview"
                                width={1400}
                                height={900}
                                className="w-full h-auto object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
                        </div>
                    </div>

                    {/* Subtle Floating Status */}
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 -right-12 z-20 bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-border hidden xl:flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold">Live Session</div>
                            <div className="text-[10px] text-muted-foreground font-bold tracking-tight">1,240 STUDENTS ACTIVE</div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
