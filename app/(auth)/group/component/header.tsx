"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDownIcon, Play, PlusIcon, Search } from "lucide-react";
import { useState } from "react";
import GroupCard from "./groupCard";

export default function Header() {
  const [activeTab, setActiveTab] = useState("Discover");
  return (
    <div className="space-y-4">
      {/* Header with Search and Filter */}
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex w-full items-center justify-between sm:w-auto">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Group</h1>
        </div>

        <div className="flex w-full items-center space-x-2 sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Input placeholder="Search" className="w-full pr-20 pl-3 sm:w-[250px]" />
            <Button variant="default" className="absolute top-1 right-1 h-7 w-7 p-2">
              <Search size={20} />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                kategori
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem>All Categories</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Class</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-row items-center justify-between sm:flex-row">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="Discover">Discover</TabsTrigger>
              <TabsTrigger value="MyGroup">My Group</TabsTrigger>
            </TabsList>

            <div className="flex w-full flex-row items-center justify-end gap-2 sm:w-auto">
              <Button variant="outline" className="">
                <PlusIcon className="hidden sm:block" />
                <span className="hidden sm:inline">Create Group</span>
                <span className="inline sm:hidden">Create</span>
              </Button>
            </div>
          </div>

          <TabsContent value="Discover" className="mt-4">
            <GroupCard />
          </TabsContent>
          <TabsContent value="MyGroup" className="mt-4">
            <GroupCard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
