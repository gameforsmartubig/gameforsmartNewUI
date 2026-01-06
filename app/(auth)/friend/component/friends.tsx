"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  CircleQuestionMark,
  ClockPlus,
  EllipsisVerticalIcon,
  Funnel,
  Icon,
  Languages,
  Play,
  Plus,
  PlusIcon,
  RotateCcw,
  Search,
  Trash,
  User
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const friend = [
  {
    id: 1,
    fullname: "mirena gone dranico dentona monarcy",
    nickname: "john",
    username: "miracle",
    country: "Indonesia",
    state: "Jawa Barat",
    city: "Bandung",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  {
    id: 2,
    fullname: "Jane Doe",
    nickname: "jane",
    username: "monastery",
    country: "USA",
    state: "New York",
    city: "New York",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  }
];

export function Friends() {
  const [activeTab, setActiveTab] = useState("friends");
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
      <div className="flex items-center justify-between w-full gap-4">
        <TabsList className="flex justify-start">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="follower">Follower</TabsTrigger>
          <TabsTrigger value="find">Find People</TabsTrigger>
        </TabsList>
        <div className="sm:flex items-center justify-end hidden">
          <SearchFriends />
        </div>
      </div>
      <TabsContent value="friends" className="space-y-4">
        <div className="sm:hidden">
          <SearchFriends />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {friend.map((friend) => (
            <Card>
              <CardContent
                key={friend.id}
                className="flex flex-row items-center justify-between gap-4">
                <div className="">
                  <img src={friend.avatar} alt="" className="h-12 w-12 rounded-full" />
                </div>
                <div className="flex flex-1 flex-col items-start overflow-hidden">
                  <div title={friend.fullname} className="text-md break-words line-clamp-1">{friend.fullname}</div>
                  <div className="text-muted-foreground text-sm font-medium break-words line-clamp-1">
                    {friend.nickname}{" • @" + friend.username}
                  </div>
                  <div className="text-muted-foreground text-xs break-words line-clamp-1">{friend.country + ", " + friend.state + ", " + friend.city}</div>
                </div>
                <Button variant="default">
                  <Plus size={16} /> Unfollow
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="following" className="space-y-4">
        <div className="sm:hidden">
          <SearchFriends />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {friend.map((friend) => (
            <Card>
              <CardContent
                key={friend.id}
                className="flex flex-row items-center justify-between gap-4">
                <div className="">
                  <img src={friend.avatar} alt="" className="h-12 w-12 rounded-full" />
                </div>
                <div className="flex flex-1 flex-col items-start overflow-hidden">
                  <div title={friend.fullname} className="text-md break-words line-clamp-1">{friend.fullname}</div>
                  <div className="text-muted-foreground text-sm font-medium break-words line-clamp-1">
                    {friend.nickname}{" • @" + friend.username}
                  </div>
                  <div className="text-muted-foreground text-xs break-words line-clamp-1">{friend.country + ", " + friend.state + ", " + friend.city}</div>
                </div>
                <Button variant="default">
                  <Plus size={16} /> Unfollow
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="follower" className="space-y-4">
        <div className="sm:hidden">
          <SearchFriends />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {friend.map((friend) => (
            <Card>
              <CardContent
                key={friend.id}
                className="flex flex-row items-center justify-between gap-4">
                <div className="">
                  <img src={friend.avatar} alt="" className="h-12 w-12 rounded-full" />
                </div>
                <div className="flex flex-1 flex-col items-start overflow-hidden">
                  <div title={friend.fullname} className="text-md break-words line-clamp-1">{friend.fullname}</div>
                  <div className="text-muted-foreground text-sm font-medium break-words line-clamp-1">
                    {friend.nickname}{" • @" + friend.username}
                  </div>
                  <div className="text-muted-foreground text-xs break-words line-clamp-1">{friend.country + ", " + friend.state + ", " + friend.city}</div>
                </div>
                <Button variant="default">
                  <Trash size={16} /> Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="find" className="space-y-4">
        <div className="sm:hidden">
          <SearchFriends />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {friend.map((friend) => (
            <Card>
              <CardContent
                key={friend.id}
                className="flex flex-row items-center justify-between gap-4">
                <div className="">
                  <img src={friend.avatar} alt="" className="h-12 w-12 rounded-full" />
                </div>
                <div className="flex flex-1 flex-col items-start overflow-hidden">
                  <div title={friend.fullname} className="text-md break-words line-clamp-1">{friend.fullname}</div>
                  <div className="text-muted-foreground text-sm font-medium break-words line-clamp-1">
                    {friend.nickname}{" • @" + friend.username}
                  </div>
                  <div className="text-muted-foreground text-xs break-words line-clamp-1">{friend.country + ", " + friend.state + ", " + friend.city}</div>
                </div>
                <Button variant="default">
                  <Plus size={16} /> Follow
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

export function SearchFriends() {
  return (
    <div className="flex w-full items-center space-x-2">
      <div className="relative w-full sm:w-auto">
        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
        <Input placeholder="Search" className="pl-8" />
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 absolute top-1 right-1 ml-auto flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:cursor-pointer">
          <Search className="h-4 w-4" />
        </button>
      </div>
      <div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Funnel />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Filter <Funnel size={16} />
              </DialogTitle>
            </DialogHeader>
            <form className="flex w-full flex-col gap-2">
              <label htmlFor="country" className="text-start text-sm font-medium">
                Country
              </label>
              <select name="country" id="country" className="w-full rounded-md border p-2">
                <option value="">Select Country</option>
                <option value="">Select Country</option>
                <option value="">Select Country</option>
              </select>
              <label htmlFor="state" className="text-start text-sm font-medium">
                State
              </label>
              <select name="state" id="state" className="w-full rounded-md border p-2">
                <option value="">Select State</option>
                <option value="">Select State</option>
                <option value="">Select State</option>
              </select>
              <label htmlFor="city" className="text-start text-sm font-medium">
                City
              </label>
              <select name="city" id="city" className="w-full rounded-md border p-2">
                <option value="">Select City</option>
                <option value="">Select City</option>
                <option value="">Select City</option>
              </select>
            </form>
            <DialogFooter className="flex w-full flex-row items-center justify-between sm:justify-between">
              <Button variant="outline">
                <RotateCcw />
                Reset
              </Button>
              <div className="flex items-center gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="default">Apply</Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
