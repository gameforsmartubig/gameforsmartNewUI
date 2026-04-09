"use client";

// ============================================================
// QuizChart — Pure rendering component.
// All data fetching is in quizDetailService.ts,
// all state management is in useQuizDetail.ts.
// ============================================================

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { ChartItem } from "../services/quizDetailService";

interface QuizChartProps {
  countryData: ChartItem[];
  stateData: ChartItem[];
  loading: boolean;
}

function ChartBar({ data }: { data: ChartItem[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-zinc-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 50, 150)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="2 2" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          width={100}
        />
        <Tooltip
          cursor={{ opacity: 0.1 }}
          contentStyle={{
            borderRadius: "10px",
            border: "none",
          }}
        />
        <Bar dataKey="value" fill="orange" radius={[0, 8, 8, 0]}>
          <LabelList
            dataKey="value"
            position="right"
            style={{ fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function QuizChart({ countryData, stateData, loading }: QuizChartProps) {
  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Chart Lokasi</h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardContent className="flex h-[250px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Chart Lokasi</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Negara */}
        <Card>
          <CardHeader>
            <CardTitle>🌍 Negara</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartBar data={countryData} />
          </CardContent>
        </Card>

        {/* Provinsi */}
        <Card>
          <CardHeader>
            <CardTitle>📍 Provinsi</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartBar data={stateData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}