"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Users, Trophy, Layout, Sparkles, Rocket } from "lucide-react";

const features = [
    {
        title: "AI Question Generator",
        description: "Buat soal kualitatif secara otomatis dari teks atau dokumen Anda dalam hitungan detik.",
        icon: Brain,
        color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
        title: "Real-time Multiplayer",
        description: "Mainkan game seru bersama siswa secara langsung dengan papan peringkat yang kompetitif.",
        icon: Users,
        color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    },
    {
        title: "Analitik Mendalam",
        description: "Pantau kemajuan belajar siswa dengan laporan performa yang mendetail dan objektif.",
        icon: Trophy,
        color: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    },
    {
        title: "Bank Soal Lengkap",
        description: "Akses ribuan quiz yang sudah dikurasi oleh komunitas pengajar di seluruh dunia.",
        icon: Layout,
        color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
        title: "Berbagai Tipe Soal",
        description: "Pilihan ganda, isian singkat, hingga menjodohkan. Sesuaikan dengan kebutuhan materi.",
        icon: Sparkles,
        color: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    },
    {
        title: "Integrasi LMS",
        description: "Hubungkan dengan Google Classroom atau Canvas untuk manajemen materi yang mudah.",
        icon: Rocket,
        color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 md:py-40 bg-background border-t">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-20 md:mb-32">
                    <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-foreground font-display">
                        Semua yang Anda Butuhkan.
                    </h2>
                    <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                        Platform komprehensif untuk pengajar modern yang ingin meningkatkan keterlibatan siswa.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            viewport={{ once: true }}
                            className="group"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-8 border shadow-sm group-hover:opacity-80 transition-opacity`}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-foreground tracking-tight">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed text-[15px]">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
