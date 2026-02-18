"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { Bell, Calendar, Copy, Globe, LogOut, Settings, Users } from "lucide-react";
import { useState } from "react";
import { PaginationControl } from "./pagination-control";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface GroupDetailProps {
  group: any;
  members: any[];
}

export default function GroupDetail({ group, members }: GroupDetailProps) {
  const { profileId } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  if (!group) return <div>Loading...</div>;

  const createdAt = group.created_at
    ? new Date(group.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "-";

  const status = group.settings?.status || "public";
  const approval = group.settings?.admins_approval;

  // Determine current user role (ensure case-insensitive check if needed, but assuming lowercase from DB)
  const currentUser = members.find((m) => m.id === profileId);
  const userRole = currentUser?.role?.toLowerCase();

  // Pagination Logic
  const totalItems = members.length;
  const currentMembers = members.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* ================= LEFT SIDEBAR ================= */}
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/group">Group</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Detail</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Card className="h-fit rounded-2xl border py-0 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="text-xl font-semibold">{group.name}</h2>
                <p className="text-muted-foreground mt-2 text-sm">{group.description}</p>
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
                  {createdAt}
                </div>

                <div className="flex items-center gap-2">
                  <div title="Visibility">
                  <Globe size={16} />
                  </div>
                  {status}
                </div>
              </div>

              {/* Owner & Admin Actions */}
              {(userRole === "owner" || userRole === "admin") && (
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
              )}

              {/* Member Actions */}
              {userRole === "member" && (
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
              )}

              {/* Non-Member Actions (Visitor) */}
              {!userRole && (
                <div className="pt-4">
                  <Button className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
                    Join Group
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT CONTENT ================= */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="members">
            <div className="mb-2 flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
              </TabsList>
              {(userRole === "admin" || userRole === "owner") && approval === true && (
                <Button variant="outline" className="relative rounded-xl">
                  <Bell size={16} />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
              )}
            </div>

            {/* MEMBERS TAB */}
            <TabsContent value="members">
              <div className="grid gap-4 md:grid-cols-2">
                {currentMembers.map((member: any, i: number) => {
                  const role = member.role?.toLowerCase();
                  return (
                    <Card key={i} className="rounded-xl border py-0 shadow-sm">
                      <CardContent className="flex items-center gap-4 p-4">
                        {/* Avatar */}
                        <Avatar>
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="rounded-lg">
                            {(member.name || "?").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium">{member.name}</p>

                            {role === "owner" && (
                              <Badge className="bg-yellow-100 text-xs text-yellow-700">Owner</Badge>
                            )}

                            {role === "admin" && (
                              <Badge className="bg-blue-100 text-xs text-blue-700">Admin</Badge>
                            )}

                            {role === "member" && (
                              <Badge variant="secondary" className="text-xs">
                                Member
                              </Badge>
                            )}
                          </div>

                          <p className="text-muted-foreground truncate text-xs">
                            {member.username}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="text-muted-foreground mt-4 flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
                <p>
                  Showing {Math.min(ITEMS_PER_PAGE * (currentPage - 1) + 1, totalItems)} -{" "}
                  {Math.min(ITEMS_PER_PAGE * currentPage, totalItems)} of {totalItems} members
                </p>
                <PaginationControl
                  totalItems={totalItems}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
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
