import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Calendar, EyeOff, Globe, Lock, Users } from "lucide-react";

export const groups = [
  {
    id: "1",
    category: "SCIENCE",
    name: "Quantum Mechanics Enthusiasts",
    members: 1248,
    status: "public",
    admins_approval: false,
    created_at: "17 Dec 2025",
    creator_id: {
      fullname: "Dr. Sheldon Cooper",
      nickname: "Sheldon",
      username: "sheldoncooper",
      city: "Pasadena",
      state: "California"
    }
  },
  {
    id: "2",
    category: "HISTORY",
    name: "Victorian Era Scholars",
    members: 432,
    status: "public",
    admins_approval: true,
    created_at: "5 Jan 2025",
    creator_id: {
      fullname: "Eleanor Vance",
      nickname: "Eleanor",
      username: "eleanorvance",
      city: "Madiun",
      state: "Jawa Tengah"
    }
  },
  {
    id: "3",
    category: "POP CULTURE",
    name: "90s Sitcom Trivia",
    members: 2841,
    status: "private",
    admins_approval: false,
    created_at: "28 Feb 2025",
    creator_id: {
      fullname: "Joey Tribbiani",
      nickname: "Joey",
      username: "joeytribbiani",
      city: "Kabupaten Malang",
      state: "Jawa Timur"
    }
  },
  {
    id: "4",
    category: "TECHNOLOGY",
    name: "Rust Programming Masters",
    members: 890,
    status: "secret",
    admins_approval: false,
    created_at: "12 Mar 2025",
    creator_id: {
      fullname: "Ferris Rust",
      nickname: "Ferris",
      username: "ferrisrust",
      city: "Berlin",
      state: "Germany"
    }
  },
  {
    id: "5",
    category: "GEOGRAPHY",
    name: "Hidden Gems Explorers",
    members: 212,
    status: "private",
    admins_approval: true,
    created_at: "1 Apr 2025",
    creator_id: {
      fullname: "Marta Wander",
      nickname: "Marta",
      username: "martawander",
      city: "Lisbon",
      state: "Portugal"
    }
  },
  {
    id: "6",
    category: "SPACE",
    name: "Mars Colonization Society",
    members: 5512,
    status: "public",
    admins_approval: false,
    created_at: "20 Feb 2025",
    creator_id: {
      fullname: "Elon Mars",
      nickname: "Elon",
      username: "elonmars",
      city: "Boca Chica",
      state: "Texas"
    }
  },
  {
    id: "7",
    category: "BUSINESS",
    name: "Startup Growth Hub",
    members: 1675,
    status: "public",
    admins_approval: true,
    created_at: "9 Jan 2025",
    creator_id: {
      fullname: "Alicia Grant",
      nickname: "Alicia",
      username: "aliciagrant",
      city: "Jakarta",
      state: "DKI Jakarta"
    }
  },
  {
    id: "8",
    category: "ART",
    name: "Digital Artists Collective",
    members: 980,
    status: "private",
    admins_approval: false,
    created_at: "15 May 2025",
    creator_id: {
      fullname: "Luna Sketch",
      nickname: "Luna",
      username: "lunasketch",
      city: "Bandung",
      state: "Jawa Barat"
    }
  },
  {
    id: "9",
    category: "SPORT",
    name: "Football Strategy Talk",
    members: 2210,
    status: "public",
    admins_approval: false,
    created_at: "2 Jun 2025",
    creator_id: {
      fullname: "Marco Silva",
      nickname: "Marco",
      username: "marcosilva",
      city: "Madrid",
      state: "Spain"
    }
  },
  {
    id: "10",
    category: "MUSIC",
    name: "Indie Music Lovers",
    members: 1450,
    status: "private",
    admins_approval: true,
    created_at: "11 Jul 2025",
    creator_id: {
      fullname: "Clara Tune",
      nickname: "Clara",
      username: "claratune",
      city: "Surabaya",
      state: "Jawa Timur"
    }
  },
  {
    id: "11",
    category: "EDUCATION",
    name: "Modern Teaching Methods",
    members: 620,
    status: "public",
    admins_approval: false,
    created_at: "19 Jan 2025",
    creator_id: {
      fullname: "Samuel Bright",
      nickname: "Sam",
      username: "sambright",
      city: "Yogyakarta",
      state: "DIY"
    }
  },
  {
    id: "12",
    category: "HEALTH",
    name: "Healthy Lifestyle Community",
    members: 1990,
    status: "public",
    admins_approval: true,
    created_at: "7 Feb 2025",
    creator_id: {
      fullname: "Nina Fit",
      nickname: "Nina",
      username: "ninafit",
      city: "Denpasar",
      state: "Bali"
    }
  },
  {
    id: "13",
    category: "GAMING",
    name: "Competitive Esports Arena",
    members: 3400,
    status: "public",
    admins_approval: false,
    created_at: "25 Mar 2025",
    creator_id: {
      fullname: "Rex Hunter",
      nickname: "Rex",
      username: "rexhunter",
      city: "Seoul",
      state: "South Korea"
    }
  },
  {
    id: "14",
    category: "LITERATURE",
    name: "Classic Novel Readers",
    members: 410,
    status: "private",
    admins_approval: false,
    created_at: "30 Apr 2025",
    creator_id: {
      fullname: "Emily Words",
      nickname: "Emily",
      username: "emilywords",
      city: "London",
      state: "UK"
    }
  },
  {
    id: "15",
    category: "PHOTOGRAPHY",
    name: "Street Photography ID",
    members: 875,
    status: "public",
    admins_approval: false,
    created_at: "18 May 2025",
    creator_id: {
      fullname: "Raka Lens",
      nickname: "Raka",
      username: "rakalens",
      city: "Semarang",
      state: "Jawa Tengah"
    }
  },
  {
    id: "16",
    category: "FOOD",
    name: "Culinary Experiment Lab",
    members: 1230,
    status: "public",
    admins_approval: true,
    created_at: "9 Jun 2025",
    creator_id: {
      fullname: "Chef Anton",
      nickname: "Anton",
      username: "chefanton",
      city: "Makassar",
      state: "Sulawesi Selatan"
    }
  },
  {
    id: "17",
    category: "FINANCE",
    name: "Crypto Investors Circle",
    members: 2780,
    status: "private",
    admins_approval: true,
    created_at: "12 Jul 2025",
    creator_id: {
      fullname: "Daniel Coin",
      nickname: "Daniel",
      username: "danielcoin",
      city: "Singapore",
      state: "SG"
    }
  },
  {
    id: "18",
    category: "ANIME",
    name: "Anime Discussion Room",
    members: 3560,
    status: "public",
    admins_approval: false,
    created_at: "22 Aug 2025",
    creator_id: {
      fullname: "Hikari Chan",
      nickname: "Hikari",
      username: "hikarichan",
      city: "Tokyo",
      state: "Japan"
    }
  },
  {
    id: "19",
    category: "AI",
    name: "Artificial Intelligence Lab",
    members: 1890,
    status: "public",
    admins_approval: false,
    created_at: "3 Sep 2025",
    creator_id: {
      fullname: "Alan Neural",
      nickname: "Alan",
      username: "alanneural",
      city: "San Francisco",
      state: "California"
    }
  },
  {
    id: "20",
    category: "ENVIRONMENT",
    name: "Climate Action Network",
    members: 980,
    status: "private",
    admins_approval: true,
    created_at: "10 Oct 2025",
    creator_id: {
      fullname: "Greta Earth",
      nickname: "Greta",
      username: "gretaearth",
      city: "Stockholm",
      state: "Sweden"
    }
  }
];

export default function GroupCard() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="rounded-2xl border shadow-sm">
            <CardContent className="space-y-5 px-6">
              <div className="flex items-center justify-between">
                {/* Category */}
                <Badge className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
                  {group.category}
                </Badge>

                <div className="flex items-center gap-2">
                  {group.status == "private" ? (
                    <>
                      <Lock size={16} />
                    </>
                  ) : group.status == "secret" ? (
                    <>
                      <EyeOff size={16} />
                    </>
                  ) : (
                    <>
                      
                    </>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-lg font-semibold">{group.name}</h3>
              </div>

              {/* Stats */}
              <div className="text-muted-foreground flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  {group.members.toLocaleString()} members
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  {group.created_at}
                </div>
              </div>

              {/* Owner */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-lime-400">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-lime-400 text-white">
                    {(
                      group.creator_id.nickname?.[0] ||
                      group.creator_id.fullname?.[0] ||
                      group.creator_id.username?.[0] ||
                      "?"
                    ).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {group.creator_id.nickname} - {group.creator_id.fullname}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    @{group.creator_id.username} - {group.creator_id.city}, {group.creator_id.state}
                  </p>
                </div>
              </div>

              {/* Button */}
              {group.admins_approval ? (
                <Button variant="outline" className="w-full rounded-xl">
                  Request to Join
                </Button>
              ) : (
                <Button className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
                  Join Group
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
