import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Calendar, Globe, Settings, Bell, Copy, LogOut } from "lucide-react";

const group = {
  "name" : "Elite Quiz Masters",
  "description" : "A group dedicated to weekly science and history challenges. Join our community to test your knowledge and climb the leaderboard!",
  "created" : "10 Oct 2025",
  "settings" : {
    "status" : "private",
    "admins_approval" : true
  }
}

const members = [
  {
    name: "Alex Johnson",
    username: "@alex_j",
    role: "OWNER"
  },
  {
    name: "Sarah Miller",
    username: "@sarahm_quiz",
    role: "ADMIN"
  },
  {
    name: "Marcus Lee",
    username: "@m_lee_99",
    role: "MEMBER"
  },
  {
    name: "Elena Rodriguez",
    username: "@elena_rod",
    role: "MEMBER"
  },
  {
    name: "David Chen",
    username: "@dchen_pro",
    role: "MEMBER"
  },
  {
    name: "Jessica White",
    username: "@jess_w",
    role: "MEMBER"
  },
  {
    name: "Michael Brown",
    username: "@mikebrown",
    role: "ADMIN"
  },
  {
    name: "Sophia Taylor",
    username: "@soph_t",
    role: "MEMBER"
  },
  {
    name: "Daniel Wilson",
    username: "@dan_wilson",
    role: "MEMBER"
  },
  {
    name: "Olivia Martinez",
    username: "@oliviam",
    role: "MEMBER"
  },
  {
    name: "James Anderson",
    username: "@janderson",
    role: "MEMBER"
  },
  {
    name: "Isabella Thomas",
    username: "@isathomas",
    role: "MEMBER"
  },
  {
    name: "William Jackson",
    username: "@willjack",
    role: "MEMBER"
  },
  {
    name: "Mia Harris",
    username: "@miaharris",
    role: "MEMBER"
  },
  {
    name: "Benjamin Clark",
    username: "@benclark",
    role: "MEMBER"
  },
  {
    name: "Charlotte Lewis",
    username: "@charlotte_l",
    role: "MEMBER"
  },
  {
    name: "Lucas Walker",
    username: "@lucaswalker",
    role: "MEMBER"
  },
  {
    name: "Amelia Hall",
    username: "@ameliah",
    role: "MEMBER"
  },
  {
    name: "Henry Allen",
    username: "@henryallen",
    role: "MEMBER"
  },
  {
    name: "Ava Young",
    username: "@avayoung",
    role: "MEMBER"
  }
];

export default function GroupDetail() {
  return (
    <div className="">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* ================= LEFT SIDEBAR ================= */}
        <Card className="h-fit rounded-2xl border py-0 shadow-sm">
          <CardContent className="space-y-6 p-6">
            <div>
              <h2 className="text-xl font-semibold">{group.name}</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {group.description}
              </p>
            </div>

            <div className="text-muted-foreground space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div title="Members">
                <Users size={16} />
                </div>
                {members.length} members
              </div>

              <div className="flex items-center gap-2">
                <div title="Created">
                <Calendar size={16} />
                </div>
                {group.created}
              </div>

              <div className="flex items-center gap-2">
                <div title="Visibility">
                <Globe size={16}/>
                </div>
                {group.settings.status}
              </div>
            </div>

            <div>
              <div className="space-y-3 pt-2">
                <Button className="w-full rounded-xl bg-yellow-500 text-black hover:bg-yellow-600">
                  Add Member
                </Button>

                <Button variant="outline" className="w-full rounded-xl">
                  <Copy size={16} className="mr-2" />
                  Copy Invite Link
                </Button>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 rounded-xl">
                  <Settings size={16} className="mr-2" />
                  Settings
                </Button>

                <Button variant="outline" className="relative flex-1 rounded-xl">
                  <LogOut size={16} className="mr-2" />
                  Leave
                </Button>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 rounded-xl">
                <Copy size={16} className="mr-2" />
                Copy Link
              </Button>

              <Button variant="outline" className="relative flex-1 rounded-xl">
                <LogOut size={16} className="mr-2" />
                Leave
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ================= RIGHT CONTENT ================= */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="members">
            <div className="mb-4 flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
              </TabsList>
              {group.settings.admins_approval && (
                <Button variant="outline" className="relative rounded-xl">
                  <Bell size={16} className="" />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
              )}
            </div>

            {/* MEMBERS TAB */}
            <TabsContent value="members">
              <div className="grid gap-4 md:grid-cols-2">
                {members.map((member, i) => (
                  <Card key={i} className="rounded-xl border py-0 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-4">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 font-semibold">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>

                          {member.role === "OWNER" && (
                            <Badge className="bg-yellow-100 text-xs text-yellow-700">OWNER</Badge>
                          )}

                          {member.role === "ADMIN" && (
                            <Badge className="bg-blue-100 text-xs text-blue-700">ADMIN</Badge>
                          )}

                          {member.role === "MEMBER" && (
                            <Badge variant="secondary" className="text-xs">
                              MEMBER
                            </Badge>
                          )}
                        </div>

                        <p className="text-muted-foreground text-xs">{member.username}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="text-muted-foreground mt-6 flex items-center justify-between text-sm">
                <p>Showing 6 of 128 members</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                  <Button size="sm">Next</Button>
                </div>
              </div>
            </TabsContent>

            {/* ACTIVITIES TAB */}
            <TabsContent value="activities">
              <Card className="rounded-xl border shadow-sm">
                <CardContent className="text-muted-foreground p-6 text-sm">
                  No recent activities yet.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
