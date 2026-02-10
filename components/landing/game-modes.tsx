"use client";

import React from "react";
import { Gamepad2, Users2, Timer, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const modes = [
    {
        title: "Solo Adventure",
        description: "Jelajahi dunia pengetahuan sendirian dan kumpulkan poin.",
        icon: Gamepad2,
    },
    {
        title: "Team Battle",
        description: "Bekerja sama dengan teman timmu untuk mengalahkan tantangan.",
        icon: Users2,
    },
    {
        title: "Time Attack",
        description: "Berpacu dengan waktu! Jawaban cepat skor tinggi.",
        icon: Timer,
    }
];

export function GameModes() {
    return (
        <section id="game-modes" className="container space-y-12 py-16">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
                <h2 className="font-bold text-3xl sm:text-5xl text-foreground">
                    Game Modes
                </h2>
                <p className="max-w-[85%] text-muted-foreground text-lg">
                    Pilih cara bermain yang paling sesuai.
                </p>
            </div>

            <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                {modes.map((mode) => (
                    <div key={mode.title} className="flex flex-col items-center text-center p-6 space-y-4 rounded-3xl bg-muted/30">
                        <div className="h-16 w-16 rounded-2xl bg-background flex items-center justify-center text-primary shadow-sm">
                            <mode.icon className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-foreground">{mode.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {mode.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
