"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ArrowUp01, ArrowDown10 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import TableContent from "./component/tablecontent";

export default function NotificationsPage() {
  const { profileId } = useAuth();
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [visibleCount, setVisibleCount] = useState(10);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setVisibleCount(10);
  }, [statusFilter, typeFilter, sortOrder]);

  useEffect(() => {
    if (!profileId) return;

    const fetchDatas = async () => {
      setLoading(true);
      const { data: notifs, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      if (error || !notifs) {
        setLoading(false);
        return;
      }

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
          raw_from_group_id: n.from_group_id,
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
      setLoading(false);
    };

    fetchDatas();

    const channel = supabase
      .channel("page-notifications")
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

  const handleAction = async (dataItem: any, action: "accepted" | "declined") => {
    if (!profileId) return;
    setActionLoading(dataItem.id);

    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ status: action })
        .eq("id", dataItem.id);

      if (updateError) throw updateError;

      setDbNotifications((prev) =>
        prev.map((notif) => (notif.id === dataItem.id ? { ...notif, status: action } : notif))
      );

      if (action === "accepted") {
        if (dataItem.type === "group" && dataItem.raw_from_group_id) {
          const groupId = dataItem.raw_from_group_id;
          const { data: profile } = await supabase
            .from("profiles")
            .select("nickname, fullname")
            .eq("id", profileId)
            .single();

          const userName = profile?.nickname || profile?.fullname || "User";

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

  const handleMarkAllAsRead = async () => {
    const unreadIds = dbNotifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setDbNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
  };

  const filteredNotifications = dbNotifications
    .filter((n) => {
      let matchStatus = true;
      let matchType = true;
      if (statusFilter === "unread") matchStatus = !n.is_read;
      if (statusFilter === "read") matchStatus = n.is_read;
      if (typeFilter !== "all") {
        if (typeFilter === "session")
          matchType = n.type === "sessionGroup" || n.type === "sessionFriend";
        else matchType = n.type === typeFilter;
      }
      return matchStatus && matchType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const displayedNotifications = filteredNotifications.slice(0, visibleCount);

  useEffect(() => {
    const unreadDisplayed = displayedNotifications.filter((n) => !n.is_read);

    if (unreadDisplayed.length > 0) {
      const unreadIds = unreadDisplayed.map((n) => n.id);

      // Optimistic upate local state immediately
      setDbNotifications((prev) =>
        prev.map((n) => (unreadIds.includes(n.id) ? { ...n, is_read: true } : n))
      );

      // Background update sync database
      supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds)
        .then(({ error }) => {
          if (error) console.error("Error auto-reading notifications:", error);
        });
    }
  }, [displayedNotifications]);

  const lastNotificationElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredNotifications.length) {
          setVisibleCount((prev) => prev + 10);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, visibleCount, filteredNotifications.length]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Notifications</h1>

        <Button className="sm:hidden" onClick={handleMarkAllAsRead}>
          <Check className="size-4" />
          Mark All as Read
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <Button className="hidden sm:flex" onClick={handleMarkAllAsRead}>
          <Check className="size-4" />
          Mark All as Read
        </Button>
        {/* Filters */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="session">Session</SelectItem>
              <SelectItem value="group">Group</SelectItem>
              <SelectItem value="admin">System</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={"outline"}
            onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
            title={sortOrder === "newest" ? "Sort Oldest First" : "Sort Newest First"}>
            {sortOrder === "newest" ? <ArrowUp01 /> : <ArrowDown10 />}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <TableContent
          dbNotifications={displayedNotifications}
          loading={loading}
          actionLoading={actionLoading}
          handleAction={handleAction}
        />
        {visibleCount < filteredNotifications.length && (
          <div ref={lastNotificationElementRef} className="h-4 w-full" />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between space-x-2">
        <div className="text-muted-foreground flex-1 text-sm">
          Showing {displayedNotifications.length} of {filteredNotifications.length} notification(s)
        </div>
      </div>
    </div>
  );
}
