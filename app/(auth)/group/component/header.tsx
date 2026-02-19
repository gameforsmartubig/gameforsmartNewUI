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
import { ChevronDownIcon, Play, PlusIcon, Search, Users } from "lucide-react";
import { useState } from "react";
import GroupCard, { GroupData } from "./groupCard";
import DialogCreate from "./dialogcreate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const groupCategoryOptions = [
  {
    value: "Campus",
    labelId: "Kampus",
    labelEn: "Campus",
    icon: <Users className="h-4 w-4 text-indigo-500" />
  },
  {
    value: "Office",
    labelId: "Kantor",
    labelEn: "Office",
    icon: <Users className="h-4 w-4 text-gray-500" />
  },
  {
    value: "Family",
    labelId: "Keluarga",
    labelEn: "Family",
    icon: <Users className="h-4 w-4 text-pink-500" />
  },
  {
    value: "Community",
    labelId: "Komunitas",
    labelEn: "Community",
    icon: <Users className="h-4 w-4 text-green-500" />
  },
  {
    value: "Mosque",
    labelId: "Masjid/Musholla",
    labelEn: "Mosque",
    icon: <Users className="h-4 w-4 text-teal-500" />
  },
  {
    value: "Islamic Boarding School",
    labelId: "Pesantren",
    labelEn: "Islamic Boarding School",
    icon: <Users className="h-4 w-4 text-purple-500" />
  },
  {
    value: "School",
    labelId: "Sekolah",
    labelEn: "School",
    icon: <Users className="h-4 w-4 text-blue-500" />
  },
  {
    value: "Quran Learning Center",
    labelId: "TPA/TPQ",
    labelEn: "Quran Learning Center",
    icon: <Users className="h-4 w-4 text-emerald-500" />
  },
  {
    value: "General",
    labelId: "Umum",
    labelEn: "General",
    icon: <Users className="h-4 w-4 text-gray-500" />
  },
  {
    value: "Others",
    labelId: "Lainnya",
    labelEn: "Others",
    icon: <Users className="h-4 w-4 text-orange-500" />
  }
];

interface HeaderProps {
  discoverGroups: GroupData[];
  myGroups: GroupData[];
}

export default function Header({ discoverGroups, myGroups }: HeaderProps) {
  const [activeTab, setActiveTab] = useState("Discover");
  const [groupCategory, setGroupCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  const handleSearch = () => {
    setSearchQuery(inputValue);
  };

  const filterGroups = (groups: GroupData[]) => {
    return groups.filter((group) => {
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        groupCategory === "All Categories" || group.category === groupCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredDiscoverGroups = filterGroups(discoverGroups);
  const filteredMyGroups = filterGroups(myGroups);

  return (
    <div className="space-y-4">
      {/* Header with Search and Filter */}
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex w-full items-center justify-between sm:w-auto">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Group</h1>
        </div>

        <div className="flex w-full items-center space-x-2 sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {groupCategory && groupCategory !== "All Categories"
                  ? groupCategoryOptions.find((option) => option.value === groupCategory)
                      ?.labelEn || "Category"
                  : "Category"}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={!groupCategory || groupCategory === "All Categories"}
                onCheckedChange={() => setGroupCategory("All Categories")}>
                All Categories
              </DropdownMenuCheckboxItem>
              {groupCategoryOptions.map((option) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={groupCategory === option.value}
                    onCheckedChange={() => setGroupCategory(option.value)}
                    className="capitalize">
                    {option.labelEn}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative w-full sm:w-auto">
            <Input
              placeholder="Search"
              className="w-full pr-20 pl-3 sm:w-[250px]"
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
              className="absolute top-1 right-1 h-7 w-7 p-2"
              onClick={handleSearch}>
              <Search size={20} />
            </Button>
          </div>
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
              <DialogCreate />
            </div>
          </div>

          <TabsContent value="Discover" className="mt-4">
            <GroupCard
              groups={filteredDiscoverGroups}
              // Force remount when filter changes to reset pagination
              key={`discover-${searchQuery}-${groupCategory}`}
            />
          </TabsContent>
          <TabsContent value="MyGroup" className="mt-4">
            <GroupCard
              groups={filteredMyGroups}
              isMyGroup={true}
              // Force remount when filter changes to reset pagination
              key={`mygroup-${searchQuery}-${groupCategory}`}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
