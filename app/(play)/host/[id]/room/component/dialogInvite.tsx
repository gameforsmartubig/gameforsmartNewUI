"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Share2, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function InviteFriend() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Friend[]>([]);

  type Friend = {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };

  const dummyFriends: Friend[] = [
    { id: 1, name: "Alex Johnson", username: "@alex_quiz" },
    { id: 2, name: "David Chen", username: "@dchen_88" },
    { id: 3, name: "Sarah Miller", username: "@sarah_m" },
    { id: 4, name: "Kevin Smith", username: "@ksmith_pro" },
    { id: 5, name: "Emily Blunt", username: "@em_the_quizzer" },
    { id: 6, name: "Alex Johnson", username: "@alex_quiz" },
    { id: 7, name: "David Chen", username: "@dchen_88" },
    { id: 8, name: "Sarah Miller", username: "@sarah_m" },
    { id: 9, name: "Kevin Smith", username: "@ksmith_pro" },
    { id: 10, name: "Emily Blunt", username: "@em_the_quizzer" },
    { id: 11, name: "Alex Johnson", username: "@alex_quiz" },
    { id: 12, name: "David Chen", username: "@dchen_88" },
    { id: 13, name: "Sarah Miller", username: "@sarah_m" },
    { id: 14, name: "Kevin Smith", username: "@ksmith_pro" },
    { id: 15, name: "Emily Blunt", username: "@em_the_quizzer" },
    { id: 16, name: "Alex Johnson", username: "@alex_quiz" },
    { id: 17, name: "David Chen", username: "@dchen_88" },
    { id: 18, name: "Sarah Miller", username: "@sarah_m" },
    { id: 19, name: "Kevin Smith", username: "@ksmith_pro" },
    { id: 20, name: "Emily Blunt", username: "@em_the_quizzer" }
  ];

  const toggleSelect = (friend: Friend) => {
    setSelected((prev) => {
      const exists = prev.find((g) => g.id === friend.id);

      if (exists) {
        return prev.filter((g) => g.id !== friend.id);
      }

      return [...prev, friend];
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" className="w-full text-xs">
          <Share2 className="mr-2 size-3" /> Invite Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full gap-0 overflow-hidden min-w-0 rounded-2xl border border-lime-400 bg-white p-0">
        {/* Header */}
        <DialogHeader className="border-b border-lime-200 p-6">
          <DialogTitle className="text-lg font-semibold text-lime-600">Invite Friends</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-6 min-w-0 max-w-full">
          <Input
            placeholder="Search by name or username..."
            className="border-lime-300 focus-visible:ring-lime-400"
          />

          {/* Selected */}
          <div className="w-full">
            <p className="mb-2 text-xs font-medium text-orange-500">SELECTED ({selected.length})</p>

            <div className="w-full max-w-full overflow-x-auto">
              <div className="flex gap-2 py-2">
                {selected.map((friend) => (
                  <div key={friend.id} className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 border-2 border-lime-400">
                      <AvatarFallback className="bg-lime-400 text-white">
                        {friend.name[0]}
                      </AvatarFallback>
                    </Avatar>

                    <button
                      onClick={() => toggleSelect(friend)}
                      className="absolute -top-1 -right-1 rounded-full bg-orange-500 p-1 text-white hover:bg-orange-600">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Friend List */}
          <div className="max-h-60 overflow-y-auto pr-2">
            {dummyFriends.map((friend) => {
              const isSelected = selected.some((f) => f.id === friend.id);

              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between border-b border-lime-200 py-1.5">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-lime-400 text-white">
                        {friend.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{friend.name}</p>
                      <p className="text-xs text-gray-500">{friend.username}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => toggleSelect(friend)}
                    className={
                      isSelected
                        ? "bg-lime-500 text-white hover:bg-lime-600"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }>
                    {isSelected ? "Added" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-lime-200 p-6">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-gray-500">
            Cancel
          </Button>

          <Button className="bg-orange-500 px-6 font-semibold text-white hover:bg-orange-600">
            Send Invites ({selected.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InviteGroup() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Group[]>([]);

  type Group = {
    id: number;
    name: string;
    members: number;
  };

  const dummyGroups: Group[] = [
    { id: 1, name: "Math Masters", members: 24 },
    { id: 2, name: "Science Squad", members: 18 },
    { id: 3, name: "History Heroes", members: 12 },
    { id: 4, name: "Coding Club", members: 30 },
    { id: 5, name: "Quiz Warriors", members: 15 },
    { id: 6, name: "Math Masters", members: 24 },
    { id: 7, name: "Science Squad", members: 18 },
    { id: 8, name: "History Heroes", members: 12 },
    { id: 9, name: "Coding Club", members: 30 },
    { id: 10, name: "Quiz Warriors", members: 15 },
    { id: 11, name: "Math Masters", members: 24 },
    { id: 12, name: "Science Squad", members: 18 },
    { id: 13, name: "History Heroes", members: 12 },
    { id: 14, name: "Coding Club", members: 30 },
    { id: 15, name: "Quiz Warriors", members: 15 }
  ];

  const toggleSelect = (group: Group) => {
    setSelected((prev) => {
      const exists = prev.find((g) => g.id === group.id);

      if (exists) {
        return prev.filter((g) => g.id !== group.id);
      }

      return [...prev, group];
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" className="w-full text-xs">
          <Users className="mr-2 size-3" /> Invite Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border border-lime-400 bg-white p-0">
        <DialogHeader className="border-b border-lime-200 p-6">
          <DialogTitle className="text-lg font-semibold text-lime-600">Invite Groups</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-6">
          <Input
            placeholder="Search group..."
            className="border-lime-300 focus-visible:ring-lime-400"
          />

          <div>
            <p className="mb-2 text-xs font-medium text-orange-500">SELECTED ({selected.length})</p>

            <div className="flex max-h-20 flex-wrap gap-2 overflow-y-auto">
              {selected.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-2 rounded-full border-b-2 bg-lime-400 px-3 py-1 text-xs font-medium text-white">
                  {group.name}
                  <button
                    onClick={() => toggleSelect(group)}
                    className="text-white hover:text-orange-600">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto pr-2">
            {dummyGroups.map((group) => {
              const isSelected = selected.some((g) => g.id === group.id);

              return (
                <div
                  key={group.id}
                  className="flex items-center justify-between border-b border-lime-200 py-1.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{group.name}</p>
                    <p className="text-xs text-gray-500">{group.members} members</p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => toggleSelect(group)}
                    className={
                      isSelected
                        ? "bg-lime-500 text-white hover:bg-lime-600"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }>
                    {isSelected ? "Added" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-lime-200 p-6">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-gray-500">
            Cancel
          </Button>

          <Button className="bg-lime-500 px-6 font-semibold text-white hover:bg-lime-600">
            Send Invites ({selected.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
