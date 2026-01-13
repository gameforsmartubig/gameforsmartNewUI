"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { CircleQuestionMark, Copy, LogOut, Play, Timer, User, Users, UserX } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const participants = [
  {
    id: 1,
    nickname: "Player 1",
    avatar_url: "https://i.pravatar.cc/150?u=1"
  },
  {
    id: 2,
    nickname: "Player 2",
    avatar_url: "https://i.pravatar.cc/150?u=2"
  },
  {
    id: 3,
    nickname: "Player 3",
    avatar_url: "https://i.pravatar.cc/150?u=3"
  },
  {
    id: 4,
    nickname: "Player 4",
    avatar_url: "https://i.pravatar.cc/150?u=4"
  },
  {
    id: 5,
    nickname: "Player 5",
    avatar_url: "https://i.pravatar.cc/150?u=5"
  },
  {
    id: 6,
    nickname: "Player 6",
    avatar_url: "https://i.pravatar.cc/150?u=6"
  },
  {
    id: 7,
    nickname: "Player 7",
    avatar_url: "https://i.pravatar.cc/150?u=7"
  },
  {
    id: 8,
    nickname: "Player 8",
    avatar_url: "https://i.pravatar.cc/150?u=8"
  },
  {
    id: 9,
    nickname: "Player 9",
    avatar_url: "https://i.pravatar.cc/150?u=9"
  },
  {
    id: 10,
    nickname: "Player 10",
    avatar_url: "https://i.pravatar.cc/150?u=10"
  }
];

const session = {
  code: "234567",
  name: "Test Room",
  description: "This is a test room",
  quiz: 10,
  time: 60
};

export default function WaitingRoom() {
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  return (
    <div className="h-screen overflow-y-auto bg-gray-50/50">
      <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1fr_480px]">
        {/* Left Column: Stats & Participants */}
        <div className="order-2 p-4 lg:order-1">
          <Card className="min-h-[420px] gap-0 border-0 bg-white shadow-sm">
            <CardContent>
              <div className="flex w-full items-center justify-between pb-6">
                <div className="flex items-center gap-2">
                  <Users />
                  <p className="text-2xl">Players</p>
                </div>
                <Button
                  variant="outline"
                  className=""
                  onClick={() => {
                    setLeaveDialogOpen(true);
                  }}>
                  <LogOut />
                  Leave
                </Button>
              </div>
              {participants.length === 0 ? (
                <div className="text-muted-foreground flex h-40 flex-col items-center justify-center">
                  <Users className="mb-2 size-12 opacity-20" />
                  <p>Waiting for players to join...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {participants.map((player) => (
                    <Card
                      key={player.id}
                      className="group relative overflow-hidden border-0 bg-gray-50 py-0 transition-colors hover:bg-gray-100">
                      <CardContent className="flex flex-col items-center p-3">
                        <Avatar className="mb-2 size-12 border-2 border-white shadow-sm">
                          <AvatarImage src={player.avatar_url || ""} />
                          <AvatarFallback className="bg-purple-100 text-xs text-purple-600">
                            {player.nickname.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p
                          className="w-full truncate text-center text-sm leading-tight font-medium"
                          title={player.nickname}>
                          {player.nickname}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls & QR */}
        <div className="order-1 p-4 sm:pl-0 pb-0">
          <Card className="h-full bg-white lg:order-2">
            <CardContent className="sticky top-0 flex h-full flex-col gap-6">
              <div className="flex justify-center">
                <Image
                  src="/gameforsmartlogo.png"
                  width={200}
                  height={40}
                  alt="gameforsmart"
                  className="opacity-80"
                  unoptimized
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-3xl font-bold tracking-tight text-gray-900">{session.name}</p>
                <p className="text-muted-foreground text-sm">
                  {session.description || "No description"}
                </p>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center justify-evenly">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <CircleQuestionMark className="size-5 text-blue-500" />
                        <span>{session.quiz}</span>
                      </div>
                      <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                        QUESTIONS
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <Timer className="size-5 text-orange-500" />
                        <span>{session.time}m</span>
                      </div>
                      <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                        TIME
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <User className="size-5 text-green-500" />
                        <span>{participants.length}</span>
                      </div>
                      <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                        PLAYERS
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col items-center justify-center">
                <div className="mb-2 flex justify-center md:mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-30 blur-lg"></div>
                    <div className="relative rounded-full border-2 border-white bg-gradient-to-br from-purple-100 to-blue-100 p-3 shadow-lg md:border-4 md:p-6">
                      <Play className="h-8 w-8 text-purple-600 md:h-12 md:w-12" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <h2 className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent md:text-2xl lg:text-3xl">
                    Wait For Host To Start
                  </h2>
                </div>
              </div>

              {/* Game PIN */}
              <div className="space-y-2 text-center">
                <p className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                  Game PIN
                </p>
                <div className="flex cursor-pointer items-center justify-center gap-2 text-6xl font-black text-purple-600 transition-opacity hover:opacity-80">
                  {session.code}
                </div>
              </div>

              {/* Join Link */}
              <div className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-600 transition-colors select-all hover:bg-gray-100">
                <span className="max-w-[240px] truncate">/join/234567</span>
                <Copy size={14} />
              </div>

              {/* Action Buttons */}
              <div className="mt-auto space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground border border-dashed text-xs">
                    WhatsApp
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground border border-dashed text-xs">
                    Telegram
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* leave Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <UserX size={20} /> Leave Room
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {}}>
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
