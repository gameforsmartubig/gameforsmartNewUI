"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { Calendar, Copy, EllipsisVertical, Globe, Users } from "lucide-react";
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
import DialogSettings from "./dialogsettings";
import DialogLeave from "./dialogleave";
import DialogApproval from "./dialogapproval";
import DialogAdd from "./dialogadd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface GroupDetailProps {
  group: any;
  members: any[];
}

export default function GroupDetail({ group, members }: GroupDetailProps) {
  const { profileId } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 14;

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
                <BreadcrumbLink
                  href="/group"
                  className="hover:text-orange-600 dark:hover:text-orange-400">
                  Group
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Detail</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Card
            className="card h-fit py-0"
            style={{ "--card-border-w": "1px", "--border-color": "var(--border)" }}>
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {group.name}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">{group.description}</p>
              </div>

              <div className="text-muted-foreground space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div title="Members" className="text-orange-500 dark:text-orange-700">
                    <Users size={16} />
                  </div>
                  {members.length} members
                </div>

                <div className="flex items-center gap-2">
                  <div title="Created" className="text-yellow-500 dark:text-yellow-700">
                    <Calendar size={16} />
                  </div>
                  {createdAt}
                </div>

                <div className="flex items-center gap-2">
                  <div title="Visibility" className="text-green-500 dark:text-green-700">
                    <Globe size={16} />
                  </div>
                  {status}
                </div>
              </div>

              {/* Owner & Admin Actions */}
              {(userRole === "owner" || userRole === "admin") && (
                <div>
                  <div className="space-y-3 pt-2">
                    <DialogAdd groupId={group.id} />

                    <Button variant="outline" className="button-green-outline w-full">
                      <Copy size={16} className="mr-2" />
                      Copy Invite Link
                    </Button>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <DialogSettings group={group} />

                    <DialogLeave groupId={group.id} currentMembers={group.members} />
                  </div>
                </div>
              )}

              {/* Member Actions */}
              {userRole === "member" && (
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="button-green-outline flex-1">
                    <Copy size={16} className="mr-2" />
                    Copy Link
                  </Button>

                  <DialogLeave groupId={group.id} currentMembers={group.members} />
                </div>
              )}

              {/* Non-Member Actions (Visitor) */}
              {!userRole && (
                <div className="pt-4">
                  <Button className="button-green w-full">Join Group</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT CONTENT ================= */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="members">
            <div className="mb-2 flex items-center justify-between">
              <TabsList className="bg-transparent">
                {[
                  { value: "members", label: "Members" },
                  { value: "activities", label: "Activities" }
                ].map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="tabs-trigger">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {(userRole === "admin" || userRole === "owner") && approval === true && (
                <DialogApproval groupId={group.id} joinRequests={group.join_requests} />
              )}
            </div>

            {/* MEMBERS TAB */}
            <TabsContent value="members">
              <div className="grid gap-4 md:grid-cols-2">
                {currentMembers.map((member: any, i: number) => {
                  const role = member.role?.toLowerCase();
                  return (
                    <Card
                      key={i}
                      className="border-card rounded-xl py-0 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="vertical-line" />
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback className="rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                              {(member.name || "?").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                                {member.name}
                              </p>

                              {role === "owner" && (
                                <Badge className="border-none bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500">
                                  Owner
                                </Badge>
                              )}

                              {role === "admin" && (
                                <Badge className="border-none bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
                                  Admin
                                </Badge>
                              )}

                              {role === "member" && (
                                <Badge
                                  variant="secondary"
                                  className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                  Member
                                </Badge>
                              )}
                            </div>

                            <p className="text-muted-foreground truncate text-xs">
                              {member.username}
                            </p>
                          </div>
                        </div>
                        {((userRole === "owner" && (role === "admin" || role === "member")) ||
                          (userRole === "admin" && role === "member")) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                <EllipsisVertical />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="dark:border-zinc-800 dark:bg-zinc-900">
                              <DropdownMenuItem className="focus:text-red-600 dark:focus:text-red-400">
                                Kick
                              </DropdownMenuItem>
                              <DropdownMenuItem className="focus:text-green-600 dark:focus:text-green-400">
                                Promote to Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem className="focus:text-orange-600 dark:focus:text-orange-400">
                                Demote to Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="text-muted-foreground mt-4 flex items-center justify-center gap-4 text-sm">
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
              <Card className="rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
