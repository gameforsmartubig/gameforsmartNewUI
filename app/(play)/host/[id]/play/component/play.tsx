import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CircleQuestionMark, Timer, User } from "lucide-react";
import Image from "next/image";

const session = {
  question_limit: 5,
  total_time_minutes: 30,
};

const player = [
  { id: 1, name: "Aldo Pratama", image: "/images/avatars/01.png", answered: 2 },
  { id: 2, name: "Rizkymendandagipanjangsekali Ananda", image: "/images/avatars/01.png", answered: 5 },
  { id: 3, name: "Dimas Saputra", image: "/images/avatars/01.png", answered: 1 },
  { id: 4, name: "Fajar Nugroho", image: "/images/avatars/01.png", answered: 4 },
  { id: 5, name: "Bayu Kurniawan", image: "/images/avatars/01.png", answered: 0 },
  { id: 6, name: "Nanda Wijaya", image: "/images/avatars/01.png", answered: 3 },
  { id: 7, name: "Ilham Ramadhan", image: "/images/avatars/01.png", answered: 5 },
  { id: 8, name: "Yoga Permana", image: "/images/avatars/01.png", answered: 2 },
  { id: 9, name: "Arif Setiawan", image: "/images/avatars/01.png", answered: 4 },
  { id: 10, name: "Rafi Prakoso", image: "/images/avatars/01.png", answered: 1 },

  { id: 11, name: "Kevin Mahendra", image: "/images/avatars/01.png", answered: 3 },
  { id: 12, name: "Andi Saprian", image: "/images/avatars/01.png", answered: 5 },
  { id: 13, name: "Reza Maulana", image: "/images/avatars/01.png", answered: 0 },
  { id: 14, name: "Agus Firmansyah", image: "/images/avatars/01.png", answered: 2 },
  { id: 15, name: "Hendra Gunawan", image: "/images/avatars/01.png", answered: 4 },
  { id: 16, name: "Rio Santoso", image: "/images/avatars/01.png", answered: 1 },
  { id: 17, name: "Farhan Akbar", image: "/images/avatars/01.png", answered: 5 },
  { id: 18, name: "Dion Alfarizi", image: "/images/avatars/01.png", answered: 3 },
  { id: 19, name: "Yusuf Hidayat", image: "/images/avatars/01.png", answered: 2 },
  { id: 20, name: "Bagas Pramudya", image: "/images/avatars/01.png", answered: 0 },

  { id: 21, name: "Rama Setyo", image: "/images/avatars/01.png", answered: 4 },
  { id: 22, name: "Iqbal Fauzan", image: "/images/avatars/01.png", answered: 1 },
  { id: 23, name: "Wahyu Purnomo", image: "/images/avatars/01.png", answered: 5 },
  { id: 24, name: "Alvin Putra", image: "/images/avatars/01.png", answered: 3 },
  { id: 25, name: "Satria Wicaksono", image: "/images/avatars/01.png", answered: 2 },
  { id: 26, name: "Gilang Ramadhan", image: "/images/avatars/01.png", answered: 4 },
  { id: 27, name: "Tegar Sapto", image: "/images/avatars/01.png", answered: 0 },
  { id: 28, name: "Rendy Kurnia", image: "/images/avatars/01.png", answered: 1 },
  { id: 29, name: "Zaky Firmansyah", image: "/images/avatars/01.png", answered: 5 },
  { id: 30, name: "Hafiz Muttaqin", image: "/images/avatars/01.png", answered: 3 },
  { id: 31, name: "Putra Aditya", image: "/images/avatars/01.png", answered: 4 },
  { id: 32, name: "Rizal Hidayah", image: "/images/avatars/02.png", answered: 1 },
  { id: 33, name: "Andre Saputro", image: "/images/avatars/03.png", answered: 5 },
  { id: 34, name: "Miko Prasetyo", image: "/images/avatars/04.png", answered: 2 },
  { id: 35, name: "Bima Arya", image: "/images/avatars/05.png", answered: 0 },
  { id: 36, name: "Fikri Alamsyah", image: "/images/avatars/06.png", answered: 3 },
  { id: 37, name: "Naufal Zikri", image: "/images/avatars/07.png", answered: 5 },
  { id: 38, name: "Rian Kurnia", image: "/images/avatars/08.png", answered: 1 },
  { id: 39, name: "Azka Ramli", image: "/images/avatars/09.png", answered: 4 },
  { id: 40, name: "Daffa Pradana", image: "/images/avatars/10.png", answered: 2 },
  { id: 41, name: "Iqbal Ramadhan", image: "/images/avatars/11.png", answered: 0 },
  { id: 42, name: "Aji Wibowo", image: "/images/avatars/12.png", answered: 3 },
  { id: 43, name: "Rifki Hakim", image: "/images/avatars/03.png", answered: 5 },
  { id: 44, name: "Yoga Pramana", image: "/images/avatars/11.png", answered: 2 },
  { id: 45, name: "Tomi Saputra", image: "/images/avatars/10.png", answered: 1 },
  { id: 46, name: "Evan Setiaji", image: "/images/avatars/06.png", answered: 4 },
  { id: 47, name: "Haris Fauzi", image: "/images/avatars/07.png", answered: 0 },
  { id: 48, name: "Raka Mahesa", image: "/images/avatars/08.png", answered: 3 },
  { id: 49, name: "Ilman Akbar", image: "/images/avatars/09.png", answered: 5 },
  { id: 50, name: "Fauzan Nirmala", image: "/images/avatars/02.png", answered: 2 }
];

export default function Play() {
  return (
    <div className="min-h-screen w-full bg-rose-50">
      <div className="fixed top-0 right-0 left-0 z-50 w-full bg-rose-50">
        <div className="relative flex h-auto w-full flex-col items-center md:h-16 md:flex-row">
          {/* Progress */}
          <div className="absolute right-0 -bottom-1.5 left-0">
            <Progress indicatorColor="bg-blue-500" value={76} className="w-full bg-transparent" />
          </div>

          {/* ===== BARIS 1 (Mobile) / KIRI (Desktop) ===== */}
          <div className="flex w-full items-center justify-between py-2 md:flex-1 md:justify-start md:py-0 px-2">
            <Image
              src="/gameforsmartlogo.png"
              width={200}
              height={40}
              alt="gameforsmart"
              className="opacity-80 dark:opacity-100"
              unoptimized
            />

            {/* End Session (Mobile only) */}
            <div className="md:hidden">
              <Dialog>
                <DialogTrigger>
                  <Button variant={"destructive"}>End Session</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>End Session</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to end this session?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="">
                    <DialogClose>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="destructive">End Session</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* ===== STATISTIK (Baris 2 Mobile / Tengah Desktop) ===== */}
          <div className="flex w-full items-center justify-center gap-6 py-2 md:flex-1 md:py-0">
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-zinc-100">
                <CircleQuestionMark className="size-5 text-blue-500" />
                <span>{session.question_limit}</span>
              </div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase dark:text-zinc-500">
                QUESTIONS
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-zinc-100">
                <Timer className="size-5 text-orange-500" />
                <span>{session.total_time_minutes}m</span>
              </div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase dark:text-zinc-500">
                TIME
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-zinc-100">
                <User className="size-5 text-green-500" />
                <span>{player.length}</span>
              </div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase dark:text-zinc-500">
                PLAYERS
              </p>
            </div>
          </div>

          {/* ===== KANAN DESKTOP ===== */}
          <div className="hidden items-center justify-end md:flex md:flex-1 px-2">
            <Dialog>
              <DialogTrigger>
                <Button variant={"destructive"}>End Session</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>End Session</DialogTitle>
                  <DialogDescription>Are you sure you want to end this session?</DialogDescription>
                </DialogHeader>
                <DialogFooter className="">
                  <DialogClose>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="destructive">End Session</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 pt-36 md:pt-24 pb-4">
        <Card>
          <CardContent className="px-16">
            <p className="text-3xl font-bold sm:text-5xl">30</p>
          </CardContent>
        </Card>
        <span className="text-3xl font-bold sm:text-5xl">:</span>
        <Card>
          <CardContent className="px-16">
            <p className="text-3xl font-bold sm:text-5xl">21</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 md:grid-cols-5">
        {player.map((p) => (
          <Card className="py-4">
            <CardContent className="px-4">
              <div className="flex items-center justify-between gap-2">
                <Avatar>
                  <AvatarImage src={p.image} alt={p.name} />
                  <AvatarFallback className="rounded-lg">{p.name}</AvatarFallback>
                </Avatar>
                <p className="flex-1 overflow-hidden text-ellipsis">{p.name}</p>
                <p>{(p.answered / session.question_limit

                ) * 100}%</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <p>Progress</p>
                  <p>
                    {p.answered}/{session.question_limit}
                  </p>
                </div>
                <Progress value={(p.answered / session.question_limit) * 100} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
