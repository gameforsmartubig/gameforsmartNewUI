"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import QuizHistoryCard from "./historycard";
import { QuizHistory } from "@/app/(auth)/history/page";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowDown01,
  ArrowDown10,
  ArrowUp01,
  ArrowUpDown,
  CalendarDays,
  LayoutGrid,
  List,
  Search
} from "lucide-react";
import QuizHistoryTable from "./historytable";
import { useState, useMemo } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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
  { value: "last_year", label: "Last Year" }
];
export default function QuizHistoryTabs({ data }: Props) {
  const [model, setModel] = useState("grid");
  const [filterTime, setFilterTime] = useState("all");
  const [sort, setSort] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  const handleSearch = () => {
    setSearchQuery(inputValue);
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    // Search Filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.quiztitle.toLowerCase().includes(query) ||
          item.application.toLowerCase().includes(query)
      );
    }

    // Time Filter
    if (filterTime !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((item) => {
        const itemDate = new Date(item.ended_at);
        const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

        switch (filterTime) {
          case "today":
            return itemDay.getTime() === today.getTime();
          case "yesterday": {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return itemDay.getTime() === yesterday.getTime();
          }
          case "this_week": {
            const diffTime = today.getTime() - itemDay.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
          }
          case "last_week": {
            const diffTime = today.getTime() - itemDay.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 7 && diffDays <= 14;
          }
          case "this_month":
            return (
              itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
            );
          case "last_month": {
            let lastMonth = now.getMonth() - 1;
            let lastYear = now.getFullYear();
            if (lastMonth < 0) {
              lastMonth = 11;
              lastYear--;
            }
            return itemDate.getMonth() === lastMonth && itemDate.getFullYear() === lastYear;
          }
          case "this_year":
            return itemDate.getFullYear() === now.getFullYear();
          case "last_year":
            return itemDate.getFullYear() === now.getFullYear() - 1;
          default:
            return true;
        }
      });
    }

    // Sorting
    result.sort((a, b) => {
      const da = new Date(a.ended_at).getTime();
      const db = new Date(b.ended_at).getTime();
      return sort === "asc" ? db - da : da - db;
    });

    return result;
  }, [data, searchQuery, filterTime, sort]);

  const hostData = filteredData.filter((q) => q.role === "host");
  const playerData = filteredData.filter((q) => q.role === "player");

  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <div className="flex justify-between gap-2 sm:justify-start">
          <TabsList className="h-auto w-fit justify-start rounded-none bg-transparent p-0">
            <TabsTrigger value="all" className="tabs-trigger">
              All ({filteredData.length})
            </TabsTrigger>
            <TabsTrigger value="host" className="tabs-trigger">
              Host ({hostData.length})
            </TabsTrigger>
            <TabsTrigger value="player" className="tabs-trigger">
              Player ({playerData.length})
            </TabsTrigger>
          </TabsList>
          <ButtonGroup className="sm:hidden">
            <Button
              variant={model === "grid" ? "default" : "outline"}
              onClick={() => setModel("grid")}
              className={`h-8 w-8 transition-colors ${
                model === "grid"
                  ? "border-orange-400 bg-orange-400 text-white hover:bg-orange-500" // Saat aktif (Halaman sekarang)
                  : "border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
              }`}>
              <LayoutGrid />
            </Button>
            <Button
              variant={model === "list" ? "default" : "outline"}
              onClick={() => setModel("list")}
              className={`h-8 w-8 transition-colors ${
                model === "list"
                  ? "border-orange-400 bg-orange-400 text-white hover:bg-orange-500" // Saat aktif (Halaman sekarang)
                  : "border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
              }`}>
              <List />
            </Button>
          </ButtonGroup>
        </div>
        <div className="flex items-center gap-2">
          {/* Client Tabs */}
          <ButtonGroup className="hidden sm:flex">
            <Button
              variant={model === "grid" ? "default" : "outline"}
              onClick={() => setModel("grid")}
              className={`h-8 w-8 transition-colors ${
                model === "grid"
                  ? "border-orange-400 bg-orange-400 text-white hover:bg-orange-500" // Saat aktif (Halaman sekarang)
                  : "border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
              }`}>
              <LayoutGrid />
            </Button>
            <Button
              variant={model === "list" ? "default" : "outline"}
              onClick={() => setModel("list")}
              className={`h-8 w-8 transition-colors ${
                model === "list"
                  ? "border-orange-400 bg-orange-400 text-white hover:bg-orange-500" // Saat aktif (Halaman sekarang)
                  : "border-slate-200 text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:text-white dark:hover:border-orange-400 dark:hover:bg-orange-950/50 dark:hover:text-orange-400"
              }`}>
              <List />
            </Button>
          </ButtonGroup>
          {sort === "asc" ? (
            <Button variant="outline" onClick={() => setSort("desc")}>
              <ArrowUpDown />
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setSort("asc")}>
              <ArrowUpDown />
            </Button>
          )}
          <Select value={filterTime} onValueChange={setFilterTime}>
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
          <div className="relative w-full sm:w-auto">
            <Input
              placeholder="Search quizzes..."
              className="input w-full pr-20 pl-3 sm:w-[250px]"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Button
              variant="default"
              className="button-orange absolute top-1 right-1 h-7 w-7 p-2"
              onClick={handleSearch}>
              <Search size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* ALL */}
      <TabsContent value="all" className="mt-2">
        {model === "grid" ? (
          <QuizHistoryCard quiz={filteredData} />
        ) : (
          <QuizHistoryTable data={filteredData} />
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
