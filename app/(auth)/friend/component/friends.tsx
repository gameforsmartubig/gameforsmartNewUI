"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CircleQuestionMark, ClockPlus, EllipsisVerticalIcon, Icon, Languages, Play, PlusIcon, Search, User } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


const friend = [
  {
    id: 1,
    name: "John Doe",
    status: "Online",
    lastSeen: "10 minutes ago",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  {
    id: 2,
    name: "Jane Doe",
    status: "Offline",
    lastSeen: "1 hour ago",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
]

export function Friends() {
  const [activeTab, setActiveTab] = useState("friends");
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="friends">Friends</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
        <TabsTrigger value="follower">Follower</TabsTrigger>
        <TabsTrigger value="find">Find</TabsTrigger>
      </TabsList>
      <TabsContent value="friends">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {friend.map((friend) => (
                <div key={friend.id} className="flex flex-row items-center justify-between gap-2 border rounded-md p-2">
                  <div className="flex flex-row items-center gap-2">
                    <img src={friend.avatar} alt="" className="h-12 w-12 rounded-full" />
                    <div className="flex flex-col">
                      <div className="text-sm font-medium">{friend.name}</div>
                      <div className="text-xs text-muted-foreground">{friend.status}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mr-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-xs text-muted-foreground">{friend.lastSeen}</div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <EllipsisVerticalIcon/>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Unfollow</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Block</DropdownMenuLabel>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="following"></TabsContent>
      <TabsContent value="follower"></TabsContent>
      <TabsContent value="find"></TabsContent>
    </Tabs>
  );
}

export function SearchFriends() {
  return (
    <div className="flex w-full items-center space-x-2 sm:w-auto">
      <div className="relative w-full sm:w-auto">
        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 absolute top-1 right-1 ml-auto flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:cursor-pointer">
          <Search className="h-4 w-4" />
        </button>
        <Input placeholder="Search" className="pl-8" />
      </div>
    </div>
  );
}
