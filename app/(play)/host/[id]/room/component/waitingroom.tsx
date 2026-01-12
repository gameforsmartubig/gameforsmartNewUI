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
import { Separator } from "@/components/ui/separator";
import {
  CircleQuestionMark,
  Copy,
  Play,
  Share2,
  Timer,
  User,
  UserPlus,
  Users,
  UserX
} from "lucide-react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

const quiz = [
  {
    name: "Pengetahuan umum dasar matematika",
    description: "Test pengetahuan umum dasar matematika",
    question: 10,
    time: 60,
    player: 20,
    host: "zakky menorva",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  }
];

const player = [
  {
    id: 1,
    name: "zakky menorva",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 2,
    name: "zakky gidora",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 3,
    name: "merni putri",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 4,
    name: "jaka mondo",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 5,
    name: "ferry hanna",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 6,
    name: "gilang minang",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 7,
    name: "raka aditya",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 8,
    name: "dimas putra",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 9,
    name: "andika surya",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 10,
    name: "bima satria",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },

  {
    id: 11,
    name: "aldi firmansyah",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 12,
    name: "yoga pratama",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 13,
    name: "rio saputra",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 14,
    name: "fahri ramadhan",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 15,
    name: "ilham maulana",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 16,
    name: "reza kurnia",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 17,
    name: "angga wijaya",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 18,
    name: "rendi pratama",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 19,
    name: "akbar hidayat",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 20,
    name: "dani saputra",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },

  {
    id: 21,
    name: "fikri alamsyah",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 22,
    name: "kevin pratama",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 23,
    name: "rizky maulana",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 24,
    name: "bayu prasetyo",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 25,
    name: "eko susanto",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 26,
    name: "wahyu setiawan",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 27,
    name: "indra gunawan",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 28,
    name: "ari wibowo",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 29,
    name: "surya pratama",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 30,
    name: "tono wijaya",
    image:
      "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  }
];

export default function WaitingRoom() {
  return (
    <div className="h-screen overflow-y-auto">
      <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1fr_480px]">
        <div className="order-2 space-y-4 p-4 lg:order-1">
          <Card>
            <CardContent>
              {quiz.map((item, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <p className="text-3xl font-semibold">{item.name}</p>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                  <Card>
                    <CardContent className="flex justify-between gap-2">
                      <div className="flex gap-2">
                        <Avatar className="size-10 rounded-full">
                          <AvatarImage src={item.image} alt={item.host} />
                          <AvatarFallback className="rounded-lg">
                            {item.host.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-muted-foreground text-xs">HOSTED BY</p>
                          <p className="font-semibold">{item.host}</p>
                        </div>
                      </div>
                      <div className="flex gap-8">
                        <div className="flex flex-col justify-center">
                          <div className="flex gap-2">
                            <CircleQuestionMark color="blue" />
                            <p>{item.question}</p>
                          </div>
                          <p className="text-muted-foreground text-center text-sm">QUESTIONS</p>
                        </div>
                        <div className="flex flex-col justify-center">
                          <div className="flex gap-2">
                            <Timer color="blue" />
                            <p>{item.time}</p>
                          </div>
                          <p className="text-muted-foreground text-center text-sm">TIME</p>
                        </div>
                        <div className="flex flex-col justify-center">
                          <div className="flex gap-2">
                            <User color="blue" />
                            <p>{item.player}</p>
                          </div>
                          <p className="text-muted-foreground text-center text-sm">PLAYERS</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid grid-cols-6 gap-2">
              {player.map((item, index) => (
                <Card key={index} className="relative">
                  <Dialog>
                    <DialogTrigger>
                      <Button
                        variant="ghost"
                        className="absolute top-2 left-2">
                        <UserX size={12} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="gap-0 sm:max-w-md">
                      <DialogHeader className="mb-0 border-b-0 pb-0">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                          <div className="relative rounded-lg bg-gradient-to-br from-red-500 to-orange-600 p-2">
                            <UserX className="h-5 w-5 text-white" />
                          </div>
                          <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                            Kick Player
                          </span>
                        </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to kick this player?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
                        <DialogClose>
                          <Button variant="outline" className="flex-1 sm:flex-initial">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button variant="destructive" className="flex-1 sm:flex-initial">
                          <UserX className="mr-2 h-4 w-4" />
                          Kick
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <CardContent className="flex flex-col items-center">
                    <Avatar className="size-14 overflow-visible rounded-full">
                      <AvatarImage src={item.image} alt={item.name} />
                      <AvatarFallback className="rounded-lg">
                        {item.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-center">{item.name}</p>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="order-1 lg:order-2">
          <div className="sticky top-0 p-4 sm:pl-0">
            <Card className="min-h-[calc(100vh-2rem)]">
              <CardContent className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <Image
                    src="/gameforsmartlogo.png"
                    width={280}
                    height={40}
                    className=""
                    alt="gameforsmart"
                    unoptimized
                  />
                </div>
                <div className="flex items-center justify-center text-purple-600">
                  <div className="text-center text-6xl font-semibold">780674</div>
                  <Copy className="ml-2" />
                </div>
                <div className="flex justify-center px-16">
                  <Dialog>
                    <DialogTrigger>
                      <div className="w-full cursor-pointer rounded-2xl border-2 border-gray-200 bg-white p-2 shadow-lg">
                        <QRCodeSVG
                          value={`join?pin=780674`}
                          size={240}
                          className="h-full w-full"
                          bgColor="#FFFFFF"
                          fgColor="#4C1D95"
                          level="H"
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] gap-0 p-2 sm:max-w-md sm:p-4 md:max-w-lg lg:max-w-xl">
                      <div className="flex items-center justify-center p-2 sm:p-4">
                        {/* QR Code - Maximum Size */}
                        <div className="aspect-square w-full max-w-[320px] rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-lg sm:max-w-[400px] sm:p-6 md:max-w-[480px] lg:max-w-[560px]">
                          <QRCodeSVG
                            value={`join?pin=780674`}
                            size={512}
                            className="h-full w-full"
                            bgColor="#FFFFFF"
                            fgColor="#4C1D95"
                            level="H"
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative flex items-center justify-center rounded-lg border border-gray-200 p-2">
                  <p className="text-center">join?pin=780674</p>
                  <Copy size={18} className="absolute top-3 right-4" />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2 px-16">
                    <Button className="flex-1 bg-purple-600">
                      <Play /> Start Game
                    </Button>
                    <Button className="flex-1 bg-purple-600">
                      <UserPlus /> Join as Player
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2 px-16">
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Users size={16} /> Invite Group
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Share2 size={16} /> Invite Friends
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                        </svg>
                        Whatsapp
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                          <path
                            fill="currentColor"
                            d="M377.6 141.5L332.5 374c-3.4 24.5-13.6 30.6-34.7 19.1l-96-70.7-46.3 44.6
       c-5.1 5.1-9.4 9.4-19.2 9.4l6.8-97.2 176.9-159.7
       c7.7-6.8-1.7-10.6-11.9-3.8L106.8 243.1 14.2 214.2
       c-24.1-7.5-24.5-24.1 5-35.6L356.6 79.1
       c19.7-7.1 36.9 4.8 21 62.4z"
                          />
                        </svg>
                        Telegram
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
