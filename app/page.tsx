import React from "react";
import { LandingHeader } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { generateMeta } from "@/lib/utils";
import { CTA } from "@/components/landing/cta";
import { AuthSection } from "@/components/landing/auth-section";
import { GameModes } from "@/components/landing/game-modes";
import { PopularGames } from "@/components/landing/popular-games";

export async function generateMetadata() {
    return generateMeta({
        title: "GameForSmart - Create Interactive AI Quizzes",
        description: "Transform your teaching with AI-powered quiz creation, real-time multiplayer games, and comprehensive analytics.",
        canonical: "/"
    });
}

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
            <LandingHeader />
            <main className="flex-grow space-y-24 md:space-y-32">
                <Hero />
                <PopularGames />
                <Features />
                <CTA />
            </main>
            <Footer />
        </div>
    );
}
