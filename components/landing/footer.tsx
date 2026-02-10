"use client";

import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, Github } from "lucide-react";
import { Logo } from "@/components/ui/logo";

import { useAuth } from "@/contexts/auth-context";

export function Footer() {
    const { user, loading, signOut } = useAuth();
    return (
        <footer className="bg-background dark:bg-[#0a0a0f] border-t border-border dark:border-white/5 pt-24 pb-12 overflow-hidden relative">
            {/* Subtle Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            <div className="container mx-auto px-4 text-center relative z-10">
                <div className="max-w-3xl mx-auto mb-16">
                    <Link href="/" className="inline-block mb-10 transition-transform hover:scale-105 active:scale-95">
                        <Logo className="justify-center" />
                    </Link>
                    <p className="text-slate-600 dark:text-slate-400 text-xl leading-relaxed font-bold uppercase tracking-wide mb-12 drop-shadow-md">
                        The definitive AI-powered battleground where learning meets <span className="text-slate-900 dark:text-white italic">legendary gameplay.</span>
                    </p>

                    <div className="flex justify-center flex-wrap gap-10 mb-16">
                        {[
                            { icon: Facebook, href: "#" },
                            { icon: Twitter, href: "#" },
                            { icon: Instagram, href: "#" },
                            { icon: Github, href: "#" },
                            { icon: Youtube, href: "#" },
                        ].map((social, i) => (
                            <Link
                                key={i}
                                href={social.href}
                                className="group relative p-4 rounded-2xl bg-muted/20 dark:bg-white/5 border border-border dark:border-white/5 hover:border-primary/50 transition-all hover:-translate-y-2"
                            >
                                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <social.icon className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors relative z-10" />
                            </Link>
                        ))}
                    </div>

                    <nav className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-xs font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                        {["About", "Arena", "Mechanics", "Privacy", "Support"].map((label) => (
                            <Link key={label} href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors relative group">
                                {label}
                                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="mt-20 pt-10 border-t border-border dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">
                            System Status: <span className="text-green-500 font-bold">Operational</span>
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                            © {new Date().getFullYear()} GAMEFORSMART. Protocol Alpha Secure.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-10 w-px bg-border dark:bg-white/5 hidden md:block" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 italic">
                            Built for the next generation of champions.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
