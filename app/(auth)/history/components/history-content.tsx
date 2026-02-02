"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, Clock, CircleHelp, Target } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { HistoryItem } from "./types";

interface HistoryContentProps {
  items: HistoryItem[];
  categories: { id: string; title: string }[];
}

export function HistoryContent({ items, categories }: HistoryContentProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.title])),
    [categories]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.quizTitle.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !selectedCategory || selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, selectedCategory]);

  const handleViewStats = (sessionId: string) => {
    router.push(`/result/${sessionId}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">History</h1>
        <span className="text-muted-foreground text-sm">{filteredItems.length} records</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search quiz..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[120px]">
              {selectedCategory && selectedCategory !== "all"
                ? categoryMap[selectedCategory] || "Category"
                : "Category"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={!selectedCategory || selectedCategory === "all"}
              onCheckedChange={() => setSelectedCategory("all")}>
              All
            </DropdownMenuCheckboxItem>
            {categories.map((cat) => (
              <DropdownMenuCheckboxItem
                key={cat.id}
                checked={selectedCategory === cat.id}
                onCheckedChange={() => setSelectedCategory(cat.id)}>
                {cat.title}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="played" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="played">Played ({items.filter(i => !i.isHost).length})</TabsTrigger>
          <TabsTrigger value="hosted">Hosted ({items.filter(i => i.isHost).length})</TabsTrigger>
        </TabsList>

        {/* PLAYED TAB */}
        <TabsContent value="played" className="space-y-2">
          {filteredItems.filter(i => !i.isHost).length === 0 ? (
            <div className="text-muted-foreground flex h-40 items-center justify-center border rounded-lg border-dashed">
              <p>No played quizzes found.</p>
            </div>
          ) : (
            filteredItems.filter(i => !i.isHost).map((item) => (
              <HistoryCard key={item.id} item={item} categoryMap={categoryMap} onClick={handleViewStats} />
            ))
          )}
        </TabsContent>

        {/* HOSTED TAB */}
        <TabsContent value="hosted" className="space-y-2">
          {filteredItems.filter(i => i.isHost).length === 0 ? (
            <div className="text-muted-foreground flex h-40 items-center justify-center border rounded-lg border-dashed">
              <p>No hosted sessions found.</p>
            </div>
          ) : (
            filteredItems.filter(i => i.isHost).map((item) => (
              <HistoryCard key={item.id} item={item} categoryMap={categoryMap} onClick={handleViewStats} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HistoryCard({ item, categoryMap, onClick }: { item: HistoryItem, categoryMap: Record<string, string>, onClick: (id: string) => void }) {
  return (
    <Card
      className="transition-colors hover:bg-muted/50 cursor-pointer"
      onClick={() => onClick(item.sessionId)}>
      <CardContent className="p-4">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium truncate">{item.quizTitle}</h3>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {categoryMap[item.category] || item.category}
          </Badge>
          {item.isHost && (
             <Badge variant="default" className="shrink-0 text-xs bg-primary/10 text-primary hover:bg-primary/20">
               Hosted
             </Badge>
          )}
        </div>
        {/* Meta row */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <CircleHelp className="h-3 w-3" />
            {item.questionCount} Qs
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.durationMinutes}m
          </span>
          {!item.isHost && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {item.accuracy}%
            </span>
          )}
          <span className="ml-auto">
            {format(parseISO(item.playedAt), "d MMM yyyy, HH:mm", { locale: localeId })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
