import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const players = [
  { id: 1, name: "Putra Aditya", image: "/images/avatars/01.png", answered: 4, score: 78 },
  { id: 2, name: "Rizal Hidayah", image: "/images/avatars/02.png", answered: 1, score: 45 },
  { id: 3, name: "Andre Saputro", image: "/images/avatars/03.png", answered: 5, score: 92 },
  { id: 4, name: "Miko Prasetyo", image: "/images/avatars/04.png", answered: 2, score: 60 },
  { id: 5, name: "Bima Arya", image: "/images/avatars/05.png", answered: 0, score: 15 },
  { id: 6, name: "Fikri Alamsyah", image: "/images/avatars/06.png", answered: 3, score: 70 },
  { id: 7, name: "Naufal Zikri", image: "/images/avatars/07.png", answered: 5, score: 88 },
  { id: 8, name: "Rian Kurnia", image: "/images/avatars/08.png", answered: 1, score: 40 },
  { id: 9, name: "Azka Ramli", image: "/images/avatars/09.png", answered: 4, score: 81 },
  { id: 10, name: "Daffa Pradana", image: "/images/avatars/10.png", answered: 2, score: 55 },

  { id: 11, name: "Iqbal Ramadhan", image: "/images/avatars/11.png", answered: 0, score: 22 },
  { id: 12, name: "Aji Wibowo", image: "/images/avatars/01.png", answered: 3, score: 67 },
  { id: 13, name: "Rifki Hakim", image: "/images/avatars/02.png", answered: 5, score: 95 },
  { id: 14, name: "Yoga Pramana", image: "/images/avatars/03.png", answered: 2, score: 58 },
  { id: 15, name: "Tomi Saputra", image: "/images/avatars/04.png", answered: 1, score: 36 },
  { id: 16, name: "Evan Setiaji", image: "/images/avatars/05.png", answered: 4, score: 83 },
  { id: 17, name: "Haris Fauzi", image: "/images/avatars/06.png", answered: 0, score: 18 },
  { id: 18, name: "Raka Mahesa", image: "/images/avatars/07.png", answered: 3, score: 72 },
  { id: 19, name: "Ilman Akbar", image: "/images/avatars/08.png", answered: 5, score: 90 },
  { id: 20, name: "Fauzan Nirmala", image: "/images/avatars/09.png", answered: 2, score: 61 },

  { id: 21, name: "Bayu Kurniawan", image: "/images/avatars/10.png", answered: 4, score: 79 },
  { id: 22, name: "Arif Setiawan", image: "/images/avatars/11.png", answered: 1, score: 42 },
  { id: 23, name: "Kevin Mahendra", image: "/images/avatars/01.png", answered: 3, score: 68 },
  { id: 24, name: "Rama Prakoso", image: "/images/avatars/02.png", answered: 5, score: 94 },
  { id: 25, name: "Dion Alfarizi", image: "/images/avatars/03.png", answered: 2, score: 57 },
  { id: 26, name: "Bagas Pramudya", image: "/images/avatars/04.png", answered: 0, score: 20 },
  { id: 27, name: "Yusuf Hidayat", image: "/images/avatars/05.png", answered: 4, score: 82 },
  { id: 28, name: "Gilang Ramadhan", image: "/images/avatars/06.png", answered: 1, score: 39 },
  { id: 29, name: "Rendy Kurnia", image: "/images/avatars/07.png", answered: 3, score: 71 },
  { id: 30, name: "Hafiz Muttaqin", image: "/images/avatars/08.png", answered: 5, score: 89 }
];
const Details = {
  quizName: "belajar bersama",
  questions: 5,
  time: 17
};

export default function Leaderboard() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="mx-auto w-full p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_500px]">
          {/* Content */}
          <div className="space-y-4">
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4">
                <div>{players[5].name}</div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4">
              <Card>
                <CardContent className="flex flex-col gap-2">
                  {players.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="flex items-center gap-4">
                        <div className="">
                          <Avatar className="size-14">
                            <AvatarImage src={p.image} />
                          </Avatar>
                        </div>
                        <div className="flex-1">
                          <p className="text-2xl">{p.name}</p>
                          <p className="text-muted-foreground">{p.answered} Questions answered </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-4xl font-bold">{p.score}</span>
                            <p>Points</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sticky Code */}
          <div className="sticky top-4 h-fit">
            <div className="bg-primary rounded-xl p-4 text-white">Code</div>
          </div>
        </div>
      </div>
    </div>
  );
}
