"use client";

import React from "react";
import Image from "next/image";
import { Users, ArrowRight, Sparkles, Star, Play, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const popularGames = [
    {
        title: "Space Quiz",
        category: "Adventure",
        players: "1.2k",
        rating: 4.9,
        difficulty: 3,
        image: "/space_quiz_cover_1770006369387_1770011493407.png",
        tag: "New",
        color: "from-blue-600 to-cyan-400",
        tagColor: "bg-emerald-500",
    },
    {
        title: "Quiz Rush",
        category: "Action",
        players: "2.5k",
        rating: 4.8,
        difficulty: 5,
        image: "/quiz_rush_cover_1770006391244_1770011517209.png",
        tag: "Popular",
        color: "from-red-600 to-rose-900",
        tagColor: "bg-red-500",
    },
    {
        title: "Crazy Race",
        category: "Racing",
        players: "850",
        rating: 4.7,
        difficulty: 4,
        image: "/crazy_race_cover_1770006413400.png",
        tag: "Double XP",
        color: "from-purple-600 to-pink-400",
        tagColor: "bg-primary-500",
    }
];

export function PopularGames() {
    return (
        <section id="game" className="py-24 bg-background overflow-hidden">
            <div className="container relative z-10">
                <div className="flex flex-col items-center text-center gap-4 mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                        Popular Challenges
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl text-center">
                        Real-time multiplayer battles. Professional leaderboards. <br />
                        Choose a portal and start your legend.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto px-4">
                    {popularGames.map((game, index) => (
                        <div
                            key={game.title}
                            className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-xl bg-card border border-border/50 shadow-sm"
                        >
                            {/* Animated Border Glow (on hover) */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${game.color}`} />

                            {/* Image & Overlay */}
                            <div className="aspect-[2/3] w-full overflow-hidden relative">
                                <Image
                                    src={game.image}
                                    alt={game.title}
                                    fill
                                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                    unoptimized
                                />
                                {/* Dynamic Badge */}
                                <div className={`absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full ${game.tagColor || 'bg-primary'} text-white text-[7px] font-black uppercase tracking-widest shadow-xl`}>
                                    {game.tag}
                                </div>


                            </div>

                            {/* Content Block */}
                            <div className="p-3 flex flex-col gap-2 relative z-20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 bg-muted/30 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
                                        <Users className="h-2 w-2 text-primary" />
                                        <span className="text-[7px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">{game.players}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <Star className="h-2.5 w-2.5 text-yellow-500 fill-current" />
                                        <span className="text-[8px] font-black text-slate-900 dark:text-white">{game.rating}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-black text-sm text-slate-900 dark:text-white tracking-tight group-hover:text-primary transition-colors uppercase italic leading-none truncate">{game.title}</h3>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Badge variant="outline" className="h-3.5 border-border dark:border-white/10 text-[6px] uppercase tracking-tighter font-black bg-muted/50 dark:bg-white/5 text-slate-900 dark:text-white px-1">{game.category}</Badge>
                                    </div>
                                </div>

                                <Button className="w-full h-8 rounded-lg font-black text-[9px] bg-primary hover:bg-primary/90 shadow-md transition-all uppercase tracking-widest relative overflow-hidden">
                                    Join
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-12 flex justify-center">
                    <Button variant="ghost" className="gap-2 rounded-xl text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-white font-black uppercase tracking-widest hover:bg-primary/5 dark:hover:bg-white/5 h-12 px-6 border border-border/50 dark:border-white/5 text-[10px]">
                        More Portals <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
