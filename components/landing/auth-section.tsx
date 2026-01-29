"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { UserPlus, LogIn, CheckCircle2, MapPin, Zap } from "lucide-react";

export function AuthSection() {
    const { user, loading } = useAuth();

    // Removed early return to ensure section id="quiz" always exists
    // if (loading || user) return null;

    return (
        <section id="quiz" className="py-24 md:py-32 bg-accent/30 border-y">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground font-display">
                        {user ? "Siap Melanjutkan?" : "Siap Untuk Bergabung?"}
                    </h2>
                    <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                        {user
                            ? "Kuis dan siswa Anda sudah menunggu. Kembali ke dashboard untuk melihat perkembangan terbaru."
                            : "Pendaftaran hanya butuh 30 detik. Nikmati fitur cerdas yang memudahkan Anda memulai."
                        }
                    </p>
                </div>

                <div className="max-w-5xl mx-auto">
                    {user ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-card p-10 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                                <Zap className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Selamat Datang Kembali!</h3>
                            <p className="text-muted-foreground mb-8 font-medium max-w-lg mx-auto">
                                Anda sudah terlogin sebagai <span className="text-foreground font-bold">{user.email}</span>.
                                Akses semua fitur pembelajaran cerdas Anda sekarang.
                            </p>
                            <Link href="/dashboard">
                                <Button className="h-14 px-8 rounded-xl text-lg font-bold shadow-lg">
                                    Buka Dashboard Saya
                                </Button>
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Register Card */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="bg-card p-10 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <UserPlus className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Register</h3>
                                <p className="text-muted-foreground mb-8 font-medium">
                                    Daftar sekarang dan rasakan pengalaman pendaftaran pintar dengan deteksi lokasi otomatis.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        Validasi Username Real-time
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                                        <MapPin className="w-5 h-5 text-blue-500" />
                                        Deteksi Lokasi Otomatis
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                        Gratis Selamanya
                                    </li>
                                </ul>
                                <Link href="/register">
                                    <Button className="w-full h-14 rounded-xl text-lg font-bold shadow-lg">
                                        Buat Akun Gratis
                                    </Button>
                                </Link>
                            </motion.div>

                            {/* Login Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="bg-background/50 p-10 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <LogIn className="w-7 h-7 text-foreground" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Login</h3>
                                <p className="text-muted-foreground mb-8 font-medium">
                                    Masuk kembali untuk melanjutkan pembuatan kuis Anda atau melihat hasil belajar siswa.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                        Akses Dashboard Instan
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                        Backup Data Otomatis
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                        Sinkronisasi Semua Perangkat
                                    </li>
                                </ul>
                                <Link href="/login">
                                    <Button variant="outline" className="w-full h-14 rounded-xl text-lg font-bold border-2">
                                        Masuk ke Akun
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
