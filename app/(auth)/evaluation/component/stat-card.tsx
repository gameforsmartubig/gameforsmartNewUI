"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, PlayCircle, HelpCircle, Target } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useState } from "react";

const time = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year", label: "This Year" },
  { value: "last_year", label: "Last Year" }
];

interface Props {
  title: string;
  value: string;
  icon: string;
}

const iconMap = {
  play: PlayCircle,
  target: Target,
  help: HelpCircle,
  trend: TrendingUp
};

export function StatCard({ title, value, icon }: Props) {
  const Icon = iconMap[icon as keyof typeof iconMap];

  return (
    <Card className="rounded-2xl py-0 shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm uppercase">{title}</p>
          {Icon && <Icon className="text-primary size-5" />}
        </div>

        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function TimeFilter({
  period,
  setPeriod
}: {
  period: string;
  setPeriod: (val: any) => void;
}) {
  return (
    <Select value={period} onValueChange={setPeriod}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {time.map((time) => (
          <SelectItem key={time.value} value={time.value}>
            {time.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
