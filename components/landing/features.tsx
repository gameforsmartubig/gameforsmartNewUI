"use client";

import React from "react";
import { Brain, Users, Trophy, Layout, Sparkles, Rocket } from "lucide-react";

const features = [
    {
        title: "AI Question Generator",
        description: "Buat soal kualitatif secara otomatis dari teks atau dokumen Anda dalam hitungan detik.",
        icon: Brain,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
    },
    {
        title: "Real-time Multiplayer",
        description: "Mainkan game seru bersama siswa secara langsung dengan papan peringkat yang kompetitif.",
        icon: Users,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        title: "Analitik Mendalam",
        description: "Pantau kemajuan belajar siswa dengan laporan performa yang mendetail dan objektif.",
        icon: Trophy,
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
    },
    {
        title: "Bank Soal Lengkap",
        description: "Akses ribuan game yang sudah dikurasi oleh komunitas pengajar di seluruh dunia.",
        icon: Layout,
        color: "text-pink-500",
        bg: "bg-pink-500/10",
    },
    {
        title: "Berbagai Tipe Soal",
        description: "Pilihan ganda, isian singkat, hingga menjodohkan. Sesuaikan dengan kebutuhan materi.",
        icon: Sparkles,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
    },
    {
        title: "Integrasi LMS",
        description: "Hubungkan dengan Google Classroom atau Canvas untuk manajemen materi yang mudah.",
        icon: Rocket,
        color: "text-green-500",
        bg: "bg-green-500/10",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-muted/30">
            <div className="container space-y-16">
                <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                    <h2 className="font-bold text-4xl sm:text-5xl tracking-tight text-foreground">
                        Core Features
                    </h2>
                    <p className="max-w-[85%] leading-relaxed text-muted-foreground text-lg sm:text-xl">
                        Engineered for speed. Optimized for victory. <br />
                        Power up your learning experience with our advanced gaming engine.
                    </p>
                </div>

                <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="group relative flex flex-col items-start gap-4 p-8 rounded-3xl bg-background border border-border transition-all duration-300 hover:shadow-lg"
                        >
                            <div className={`relative h-14 w-14 rounded-2xl ${feature.bg.replace('/20', '/10')} dark:${feature.bg} flex items-center justify-center`}>
                                <feature.icon className={`h-7 w-7 ${feature.color}`} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
