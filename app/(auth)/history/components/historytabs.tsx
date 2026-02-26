"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import QuizHistoryCard from "./historycard";
import { QuizHistory } from "@/app/(auth)/history/page";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays, LayoutGrid, List } from "lucide-react";
import QuizHistoryTable from "./historytable";
import { useState } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  data: QuizHistory[];
}

const time = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
];
export default function QuizHistoryTabs({ data }: Props) {
  const [model, setModel] = useState("grid");
  const [filterTime, setFilterTime] = useState("all");

  const hostData = data.filter((q) => q.role === "host");
  const playerData = data.filter((q) => q.role === "player");

  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <div className="flex gap-2 justify-between sm:justify-start">
          <TabsList className="h-auto w-fit justify-start rounded-none bg-transparent p-0">
            <TabsTrigger value="all" className="tabs-trigger">All ({data.length})</TabsTrigger>
            <TabsTrigger value="host" className="tabs-trigger">Host ({hostData.length})</TabsTrigger>
            <TabsTrigger value="player" className="tabs-trigger">Player ({playerData.length})</TabsTrigger>
          </TabsList>
          <ButtonGroup>
            <Button variant="outline" onClick={() => setModel("grid")}>
              <LayoutGrid />
            </Button>
            <Button variant="outline" onClick={() => setModel("list")}>
              <List />
            </Button>
          </ButtonGroup>
        </div>
        <div className="flex gap-2">
          {/* Client Tabs */}
          <Select value={filterTime} onValueChange={setFilterTime}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {time.map((time)=>(
                <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Search quizzes..." />
        </div>
      </div>

      {/* ALL */}
      <TabsContent value="all" className="mt-2">
        {model === "grid" ? (
          <QuizHistoryCard quiz={data} />
        ) : (
          <QuizHistoryTable data={data} />
        )}
      </TabsContent>

      {/* HOST */}
      <TabsContent value="host" className="mt-2">
        {model === "grid" ? (
          <QuizHistoryCard quiz={hostData} />
        ) : (
          <QuizHistoryTable data={hostData} />
        )}
      </TabsContent>

      {/* PLAYER */}
      <TabsContent value="player" className="mt-2">
        {model === "grid" ? (
          <QuizHistoryCard quiz={playerData} />
        ) : (
          <QuizHistoryTable data={playerData} />
        )}
      </TabsContent>
    </Tabs>
  );
}
