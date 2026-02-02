"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export function CTA() {
    const { user, loading } = useAuth();

    return (
        <section className="py-32 md:py-48 bg-background border-t overflow-hidden relative">
            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto"
                >
                    <h2 className="text-4xl md:text-7xl font-extrabold tracking-tighter mb-10 text-foreground font-display">
                        Mulai Belajar Lebih <span className="italic">Cerdas</span> Hari Ini.
                    </h2>
                    <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-medium max-w-xl mx-auto">
                        Bergabunglah dengan ribuan pengajar dan transformasi pengalaman belajar siswa Anda.
                    </p>

                    {!loading && (
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            {user ? (
                                <Link href="/dashboard">
                                    <Button size="lg" className="rounded-xl px-12 h-16 text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95 bg-primary text-primary-foreground">
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/register">
                                        <Button size="lg" className="rounded-xl px-12 h-16 text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95 bg-primary text-primary-foreground">
                                            Register
                                        </Button>
                                    </Link>
                                    <Link href="/login">
                                        <Button size="lg" variant="outline" className="rounded-xl px-12 h-16 text-lg font-bold border-2 hover:bg-accent transition-all text-foreground">
                                            Login
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    )}

                    <p className="mt-10 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Tidak perlu kartu kredit.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
