"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Youtube, Github } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";

export function Footer() {
    const { user, loading, signOut } = useAuth();
    return (
        <footer className="bg-background border-t pt-24 pb-12">
            <div className="container mx-auto px-4 text-center">
                <div className="max-w-2xl mx-auto mb-16">
                    <Link href="/" className="inline-block mb-8">
                        <Image
                            src="/gameforsmartlogo.png"
                            alt="GameForSmart Logo"
                            width={140}
                            height={45}
                            className="h-9 w-auto mx-auto"
                        />
                    </Link>
                    <p className="text-muted-foreground text-lg leading-relaxed font-medium mb-10">
                        Platform edukasi interaktif berbasis AI yang membantu pengajar dan siswa belajar lebih cerdas, menyenangkan, dan terukur.
                    </p>
                    <div className="flex justify-center gap-8 mb-12">
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Facebook className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Twitter className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Instagram className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Github className="w-5 h-5" />
                        </Link>
                    </div>

                    <nav className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm font-bold uppercase tracking-widest text-foreground/70">
                        <Link href="#about" className="hover:text-primary transition-colors">About</Link>
                        <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
                        <Link href="#quiz" className="hover:text-primary transition-colors">Quiz</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
                    </nav>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} GameForSmart. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Facebook className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Twitter className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Instagram className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Youtube className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
