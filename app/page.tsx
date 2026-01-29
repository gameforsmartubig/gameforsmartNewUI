import React from "react";
import { LandingHeader } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { generateMeta } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CTA } from "@/components/landing/cta";
import { AuthSection } from "@/components/landing/auth-section";

export async function generateMetadata() {
    return generateMeta({
        title: "GameForSmart - Create Interactive AI Quizzes",
        description: "Transform your teaching with AI-powered quiz creation, real-time multiplayer games, and comprehensive analytics.",
        canonical: "/"
    });
}

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <LandingHeader />
            <main className="flex-grow">
                <Hero />
                <Features />
                <AuthSection />
                <CTA />
            </main>
            <Footer />
        </div>
    );
}
