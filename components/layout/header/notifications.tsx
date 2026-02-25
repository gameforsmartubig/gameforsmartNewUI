"use client";

import { BellIcon, ClockIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

const Datas = [
  {
    user_id: "01mdsvf3001000000axm",
    actor_id: "zubai",
    type: "sessionFriend",
    entity_type: "session",
    entity_id: {
      name: "matematika dasar",
      code: "679812"
    },
    from_group_id: null,
    status: "unread",
    created_at: "2023-01-01T00:00:00.000Z"
  },
  {
    user_id: "01mdsvf3001000000axm",
    actor_id: "merlon",
    type: "sessionGroup",
    entity_type: "session",
    entity_id: {
      name: "sejarah islam", //nama diambil dari nama dari quiz nya
      code: "799712" // code diambil dari game_pin
    },
    status: null,
    content: null,
    is_read: false,
    created_at: "2026-02-12 07:32:07.619+00",
    from_group_id: "Belajar bersama" //nama diambil dari id groupnya
  }
];

const getTimeAgo = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `Just now`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const Notifications = () => {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const { profileId } = useAuth();
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (dataItem: any, action: "accepted" | "declined") => {
    if (!profileId) return;
    setActionLoading(dataItem.id);

    try {
      // 1. Update notification status
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ status: action })
        .eq("id", dataItem.id);

      if (updateError) throw updateError;

      // Update UI state
      setDbNotifications((prev) =>
        prev.map((notif) => (notif.id === dataItem.id ? { ...notif, status: action } : notif))
      );

      // 2. Execute logic if accepted
      if (action === "accepted") {
        if (dataItem.type === "group" && dataItem.raw_from_group_id) {
          const groupId = dataItem.raw_from_group_id;
          // Get user's profile to extract name
          const { data: profile } = await supabase
            .from("profiles")
            .select("nickname, fullname")
            .eq("id", profileId)
            .single();

          const userName = profile?.nickname || profile?.fullname || "User";

          // Fetch current group members
          const { data: group } = await supabase
            .from("groups")
            .select("members")
            .eq("id", groupId)
            .single();

          if (group) {
            const members = group.members || [];
            const isAlreadyMember = members.some((m: any) => m.id === profileId);

            if (!isAlreadyMember) {
              const newMember = { id: profileId, name: userName, role: "member" };
              const updatedMembers = [...members, newMember];

              const { error: groupUpdateError } = await supabase
                .from("groups")
                .update({ members: updatedMembers })
                .eq("id", groupId);

              if (groupUpdateError) {
                toast.error("Gagal bergabung grup");
              } else {
                toast.success("Berhasil bergabung dengan grup");
              }
            } else {
              toast.info("Anda sudah menjadi anggota grup ini");
            }
          }
        } else if (dataItem.type === "sessionGroup" || dataItem.type === "sessionFriend") {
          const code = dataItem.entity_id?.code;
          const application = (dataItem.entity_id?.application || "gameforsmartnewui")
            .toLowerCase()
            .trim();

          if (!code) {
            toast.error("Kode sesi tidak ditemukan");
            return;
          }

          toast.success("Mengarahkan ke sesi...");

          let targetUrl = "";
          let openInNewTab = false;

          switch (application) {
            case "crazyrace":
              targetUrl = `https://crazy-race-next.vercel.app/join/${code}`;
              openInNewTab = true;
              break;
            case "memoryquiz":
              targetUrl = `https://memorygame-quiz.vercel.app/join/${code}`;
              openInNewTab = true;
              break;
            case "quizrush":
              targetUrl = `https://quizrun.vercel.app/join/${code}`;
              openInNewTab = true;
              break;
            case "space quiz":
            case "spacequiz":
              targetUrl = `https://spacequizv1.vercel.app/join/${code}`;
              openInNewTab = true;
              break;
            case "axiom":
              targetUrl = `https://axiomay.vercel.app/join/${code}`;
              openInNewTab = true;
              break;
            case "gameforsmartnewui":
            default:
              targetUrl = `https://gameforsmartnewui.vercel.app/join/${code}`;
              openInNewTab = false;
              break;
          }

          if (openInNewTab) {
            window.open(targetUrl, "_blank");
          } else {
            window.location.href = targetUrl;
          }
        }
      } else {
        toast.success("Notifikasi ditolak");
      }
    } catch (error: any) {
      console.error("Action error:", error);
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!profileId) return;

    const fetchDatas = async () => {
      const { data: notifs, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      if (error || !notifs) return;

      const actorIds = [...new Set(notifs.map((n) => n.actor_id).filter(Boolean))];
      const profilesMap: Record<string, any> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nickname, fullname")
          .in("id", actorIds);
        if (profiles) {
          profiles.forEach((p) => {
            profilesMap[p.id] = p;
          });
        }
      }

      const groupIds = [
        ...new Set([
          ...notifs
            .filter((n) => n.type === "group" && n.from_group_id)
            .map((n) => n.from_group_id),
          ...notifs
            .filter((n) => n.type === "sessionGroup" && n.from_group_id)
            .map((n) => n.from_group_id)
        ])
      ];
      const groupsMap: Record<string, any> = {};
      if (groupIds.length > 0) {
        const { data: groups } = await supabase
          .from("groups")
          .select("id, name")
          .in("id", groupIds);
        if (groups) {
          groups.forEach((g) => {
            groupsMap[g.id] = g;
          });
        }
      }

      // Pre-fetch game sessions resolving to quizzes for session types
      const sessionIds = [
        ...new Set(
          notifs
            .filter((n) => (n.type === "sessionGroup" || n.type === "sessionFriend") && n.entity_id)
            .map((n) => n.entity_id)
        )
      ];

      const sessionsMap: Record<string, any> = {};

      if (sessionIds.length > 0) {
        const { data: sessions } = await supabase
          .from("game_sessions")
          .select(`id, game_pin, application, quizzes!game_sessions_quiz_id_fkey(title)`)
          .in("id", sessionIds);

        if (sessions) {
          sessions.forEach((s: any) => {
            const quizData = s.quizzes;
            const title = Array.isArray(quizData) ? quizData[0]?.title : quizData?.title;

            sessionsMap[s.id] = {
              name: title || "Unknown Quiz",
              code: s.game_pin || "N/A",
              application: s.application
            };
          });
        }
      }

      const enriched = notifs.map((n) => {
        const actor = profilesMap[n.actor_id] || {};
        const actorName = actor.nickname || actor.fullname || "User";

        const adapted = {
          id: n.id,
          user_id: n.user_id,
          actor_id: actorName,
          type: n.type,
          entity_type: n.entity_type,
          entity_id: n.entity_id,
          from_group_id: n.from_group_id,
          status: n.status,
          content: n.content,
          is_read: n.is_read || false,
          created_at: n.created_at
        };

        if (n.type === "group") {
          adapted.from_group_id = { name: groupsMap[n.from_group_id]?.name || "Unknown Group" };
        } else if (n.type === "sessionFriend" || n.type === "sessionGroup") {
          adapted.entity_id = sessionsMap[n.entity_id] || {
            name: "Unknown Session",
            code: "N/A",
            application: "N/A"
          };

          if (n.type === "sessionGroup" && n.from_group_id) {
            adapted.from_group_id = groupsMap[n.from_group_id]?.name || "Unknown Group";
          }
        }

        return adapted;
      });

      setDbNotifications(enriched);
    };

    fetchDatas();

    const channel = supabase
      .channel("header-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profileId}`
        },
        () => {
          fetchDatas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  const hasUnread = dbNotifications.some((n) => !n.is_read);

  const handleOpenChange = async (open: boolean) => {
    if (open) {
      const top5Unread = dbNotifications.slice(0, 5).filter((n) => !n.is_read);
      if (top5Unread.length > 0) {
        const ids = top5Unread.map((n) => n.id);

        // Optimistic UI update
        setDbNotifications((prev) =>
          prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
        );

        // Background sync to db
        await supabase.from("notifications").update({ is_read: true }).in("id", ids);
      }
    }
  };

  if (!mounted) {
    return (
      <Button size="icon" variant="ghost" className="relative">
        <BellIcon />
      </Button>
    );
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <>
            <BellIcon className="animate-tada" />
            {hasUnread && (
              <span className="bg-destructive absolute end-0 top-0 block size-2 shrink-0 rounded-full"></span>
            )}
          </>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={isMobile ? "center" : "end"} className="ms-4 w-80 p-0">
        <DropdownMenuLabel className="bg-background dark:bg-muted sticky top-0 z-10 p-0">
          <div className="flex justify-between border-b px-6 py-4">
            <div className="font-medium">Notifications</div>
            <Button variant="link" className="relative h-auto p-0 text-xs" size="sm" asChild>
              <Link href="/notifications">
                View all
                {hasUnread && (
                  <span className="bg-destructive absolute -top-1 -right-2 block size-2 shrink-0 rounded-full"></span>
                )}
              </Link>
            </Button>
          </div>
        </DropdownMenuLabel>

        <ScrollArea className="h-[350px]">
          {dbNotifications.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-sm">No notifications</div>
          ) : (
            dbNotifications.slice(0, 5).map((dataItem, key) => {
              if (dataItem.type === "sessionGroup") {
                return (
                  <DropdownMenuItem
                    key={key}
                    onSelect={(e) => e.preventDefault()}
                    className="group flex cursor-pointer items-start gap-9 rounded-none border-b px-4 py-3">
                    <div className="flex flex-1 items-start gap-2">
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="dark:group-hover:text-default-800 text-sm font-medium">
                          {dataItem.actor_id} invite you from group {dataItem.from_group_id}
                        </div>
                        <div className="dark:group-hover:text-default-700 text-muted-foreground text-xs">
                          to join session "{dataItem.entity_id?.name}" on application{" "}
                          {dataItem.entity_id?.application}
                        </div>
                        {dataItem.status === null ? (
                          <div className="mt-1 flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(dataItem, "accepted")}
                              disabled={actionLoading === dataItem.id}>
                              {actionLoading === dataItem.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Accept"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(dataItem, "declined")}
                              disabled={actionLoading === dataItem.id}>
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold tracking-wider uppercase ${
                                dataItem.status === "accepted"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}>
                              {dataItem.status === "accepted" ? "Accepted" : "Declined"}
                            </span>
                          </div>
                        )}
                        <div className="dark:group-hover:text-default-500 text-muted-foreground flex items-center gap-1 text-xs">
                          <ClockIcon className="size-3!" />
                          {getTimeAgo(dataItem.created_at)}
                        </div>
                      </div>
                    </div>
                    {!dataItem.is_read && (
                      <div className="flex-0">
                        <span className="bg-destructive/80 block size-2 rounded-full border" />
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              }

              if (dataItem.type === "sessionFriend") {
                return (
                  <DropdownMenuItem
                    key={key}
                    onSelect={(e) => e.preventDefault()}
                    className="group flex cursor-pointer items-start gap-9 rounded-none border-b px-4 py-3">
                    <div className="flex flex-1 items-start gap-2">
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="dark:group-hover:text-default-800 text-sm font-medium">
                          {dataItem.actor_id} invite you
                        </div>
                        <div className="dark:group-hover:text-default-700 text-muted-foreground text-xs">
                          to join session "{dataItem.entity_id?.name}" on application{" "}
                          {dataItem.entity_id?.application}
                        </div>
                        {dataItem.status === null ? (
                          <div className="mt-1 flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(dataItem, "accepted")}
                              disabled={actionLoading === dataItem.id}>
                              {actionLoading === dataItem.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Accept"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(dataItem, "declined")}
                              disabled={actionLoading === dataItem.id}>
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold tracking-wider uppercase ${
                                dataItem.status === "accepted"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}>
                              {dataItem.status === "accepted" ? "Accepted" : "Declined"}
                            </span>
                          </div>
                        )}
                        <div className="dark:group-hover:text-default-500 text-muted-foreground flex items-center gap-1 text-xs">
                          <ClockIcon className="size-3!" />
                          {getTimeAgo(dataItem.created_at)}
                        </div>
                      </div>
                    </div>
                    {!dataItem.is_read && (
                      <div className="flex-0">
                        <span className="bg-destructive/80 block size-2 rounded-full border" />
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              }

              if (dataItem.type === "group") {
                return (
                  <DropdownMenuItem
                    key={key}
                    onSelect={(e) => e.preventDefault()}
                    className="group flex cursor-pointer items-start gap-9 rounded-none border-b px-4 py-3">
                    <div className="flex flex-1 items-start gap-2">
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="dark:group-hover:text-default-800 text-sm font-medium">
                          {dataItem.actor_id} invite you
                        </div>
                        <div className="dark:group-hover:text-default-700 text-muted-foreground text-xs">
                          to join group {dataItem.from_group_id?.name}
                        </div>
                        {dataItem.status === null ? (
                          <div className="mt-1 flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(dataItem, "accepted")}
                              disabled={actionLoading === dataItem.id}>
                              {actionLoading === dataItem.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Accept"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(dataItem, "declined")}
                              disabled={actionLoading === dataItem.id}>
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold tracking-wider uppercase ${
                                dataItem.status === "accepted"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}>
                              {dataItem.status === "accepted" ? "Accepted" : "Declined"}
                            </span>
                          </div>
                        )}
                        <div className="dark:group-hover:text-default-500 text-muted-foreground flex items-center gap-1 text-xs">
                          <ClockIcon className="size-3!" />
                          {getTimeAgo(dataItem.created_at)}
                        </div>
                      </div>
                    </div>
                    {!dataItem.is_read && (
                      <div className="flex-0">
                        <span className="bg-destructive/80 block size-2 rounded-full border" />
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              }

              if (dataItem.type === "admin") {
                return (
                  <DropdownMenuItem
                    key={key}
                    onSelect={(e) => e.preventDefault()}
                    className="group flex cursor-pointer items-start gap-9 rounded-none border-b px-4 py-3">
                    <div className="flex flex-1 items-start gap-2">
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="dark:group-hover:text-default-800 text-sm font-medium">
                          {dataItem.content?.title || "System Notification"}
                        </div>
                        <div className="dark:group-hover:text-default-700 text-muted-foreground text-xs leading-relaxed">
                          {dataItem.content?.message || ""}
                        </div>
                        <div className="dark:group-hover:text-default-500 text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                          <ClockIcon className="size-3!" />
                          {getTimeAgo(dataItem.created_at)}
                        </div>
                      </div>
                    </div>
                    {!dataItem.is_read && (
                      <div className="flex-0">
                        <span className="bg-destructive/80 block size-2 rounded-full border" />
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              }

              return null;
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
