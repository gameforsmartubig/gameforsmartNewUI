"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Award, Star } from "lucide-react";

interface StatItem {
    title: string;
    value: string;
    description: string;
    icon: React.ElementType;
    className?: string;
    iconColor?: string;
}

const stats: StatItem[] = [
    {
        title: "Total Points",
        value: "15,231",
        description: "+20.1% from last month",
        icon: Star,
        iconColor: "text-amber-500",
    },
    {
        title: "Quizzes Solved",
        value: "48",
        description: "12 this week",
        icon: Target,
        iconColor: "text-blue-500",
    },
    {
        title: "World Rank",
        value: "#240",
        description: "Top 5% overall",
        icon: Trophy,
        iconColor: "text-purple-500",
    },
    {
        title: "Achievement Score",
        value: "850",
        description: "Platinum Level",
        icon: Award,
        iconColor: "text-emerald-500",
    },
];

export function StatsOverview() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index} className="overflow-hidden border-none shadow-sm transition-all hover:shadow-md dark:bg-zinc-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <div className={`rounded-full bg-neutral-100 p-2 dark:bg-zinc-800`}>
                            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-muted-foreground text-xs">{stat.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
