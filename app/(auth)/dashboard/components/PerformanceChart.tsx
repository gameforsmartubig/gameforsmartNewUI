"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Line,
    LineChart,
    CartesianGrid
} from "recharts";

const data = [
    { name: "Mon", sessions: 4, points: 240 },
    { name: "Tue", sessions: 3, points: 300 },
    { name: "Wed", sessions: 5, points: 200 },
    { name: "Thu", sessions: 2, points: 278 },
    { name: "Fri", sessions: 6, points: 189 },
    { name: "Sat", sessions: 4, points: 239 },
    { name: "Sun", sessions: 7, points: 278 },
];

export function PerformanceChart() {
    return (
        <Card className="col-span-1 border-none shadow-sm dark:bg-zinc-900 lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Weekly Performance</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full pb-4 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: "rgba(0,0,0,0.05)" }}
                            contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                        />
                        <Bar
                            dataKey="sessions"
                            fill="currentColor"
                            radius={[4, 4, 0, 0]}
                            className="fill-zinc-800 dark:fill-zinc-200"
                            barSize={30}
                        />
                        <Bar
                            dataKey="points"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                            opacity={0.3}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
