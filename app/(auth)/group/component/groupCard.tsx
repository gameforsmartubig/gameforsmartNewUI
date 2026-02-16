"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Calendar, EyeOff, Lock, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type GroupData = {
  id: string;
  name: string;
  category: string | null;
  members: any[]; // JSONB
  join_requests: any[]; // JSONB
  settings: any; // JSONB
  created_at: string | null;
  creator: {
    fullname: string | null;
    nickname: string | null;
    username: string | null;
    avatar_url?: string | null;
    city?: { name: string } | null;
    state?: { name: string } | null;
  } | null;
};

export default function GroupCard({
  groups,
  isMyGroup = false
}: {
  groups: GroupData[];
  isMyGroup?: boolean;
}) {
  const { profileId } = useAuth();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Optimistic UI state: keys are group IDs, values are 'pending' or 'none'
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, "pending" | "none">>({});

  const handleJoin = async (groupId: string, currentMembers: any[]) => {
    if (!profileId) {
      toast.error("You must be logged in to join");
      return;
    }

    setLoadingId(groupId);

    try {
      const newMember = {
        role: "member",
        user_id: profileId
      };

      const members = Array.isArray(currentMembers) ? currentMembers : [];
      const isAlreadyMember = members.some(
        (m: any) => m.user_id === profileId || m.id === profileId
      );

      if (isAlreadyMember) {
        toast.info("You are already a member");
        setLoadingId(null);
        return;
      }

      const updatedMembers = [...members, newMember];

      const { error } = await supabase
        .from("groups")
        .update({ members: updatedMembers })
        .eq("id", groupId);

      if (error) throw error;

      toast.success("Successfully joined the group!");
      router.refresh(); // Refresh server data without full reload
    } catch (error: any) {
      console.error("Join error:", error);
      toast.error(error.message || "Failed to join group");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRequestJoin = async (groupId: string, currentRequests: any[]) => {
    if (!profileId) {
      toast.error("You must be logged in to request join");
      return;
    }

    setLoadingId(groupId);

    try {
      const requests = Array.isArray(currentRequests) ? currentRequests : [];

      const alreadyRequested = requests.some(
        (r: any) => r.user_id === profileId && r.status === "pending"
      );
      if (alreadyRequested) {
        toast.info("You have already sent a request");
        setLoadingId(null);
        return;
      }

      const newRequest = {
        status: "pending",
        user_id: profileId,
        requested_at: new Date().toISOString()
      };

      const updatedRequests = [...requests, newRequest];

      const { error } = await supabase
        .from("groups")
        .update({ join_requests: updatedRequests })
        .eq("id", groupId);

      if (error) throw error;

      // Optimistic update
      setOptimisticStatus((prev) => ({ ...prev, [groupId]: "pending" }));
      toast.success("Join request sent!");
      router.refresh();
    } catch (error: any) {
      console.error("Request join error:", error);
      toast.error(error.message || "Failed to send request");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancelRequest = async (groupId: string, currentRequests: any[]) => {
    if (!profileId) return;

    setLoadingId(groupId);

    try {
      const requests = Array.isArray(currentRequests) ? currentRequests : [];

      const updatedRequests = requests.filter(
        (r: any) => !(r.user_id === profileId && r.status === "pending")
      );

      const { error } = await supabase
        .from("groups")
        .update({ join_requests: updatedRequests })
        .eq("id", groupId);

      if (error) throw error;

      // Optimistic update
      setOptimisticStatus((prev) => ({ ...prev, [groupId]: "none" }));
      toast.success("Request cancelled");
      router.refresh();
    } catch (error: any) {
      console.error("Cancel request error:", error);
      toast.error(error.message || "Failed to cancel request");
    } finally {
      setLoadingId(null);
    }
  };

  if (!groups || groups.length === 0) {
    return <div className="py-10 text-center text-gray-500">No groups found</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => {
        const memberCount = Array.isArray(group.members) ? group.members.length : 0;
        const status = group.settings?.status || "public";
        const adminsApproval = group.settings?.admins_approval || false;

        // Check if user already requested (with optimistic override)
        let isPending = false;
        if (optimisticStatus[group.id]) {
          isPending = optimisticStatus[group.id] === "pending";
        } else {
          isPending =
            Array.isArray(group.join_requests) &&
            group.join_requests.some((r: any) => r.user_id === profileId && r.status === "pending");
        }

        const createdDate = group.created_at
          ? new Date(group.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })
          : "-";

        return (
          <Card key={group.id} className="rounded-2xl border shadow-sm">
            <CardContent className="space-y-5 px-6">
              <div className="flex items-center justify-between">
                {/* Category */}
                <Badge className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-200">
                  {group.category || "General"}
                </Badge>

                <div className="flex items-center gap-2 text-gray-500">
                  {status === "private" ? (
                    <Lock size={16} />
                  ) : status === "secret" ? (
                    <EyeOff size={16} />
                  ) : null}
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="line-clamp-1 text-lg font-semibold" title={group.name}>
                  {group.name}
                </h3>
              </div>

              {/* Stats */}
              <div className="text-muted-foreground flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  {memberCount.toLocaleString()} members
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  {createdDate}
                </div>
              </div>

              {/* Owner */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-lime-400">
                  <AvatarImage src={group.creator?.avatar_url || ""} />
                  <AvatarFallback className="bg-lime-400 text-white">
                    {(
                      group.creator?.nickname?.[0] ||
                      group.creator?.fullname?.[0] ||
                      group.creator?.username?.[0] ||
                      "?"
                    ).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-medium">
                    {[group.creator?.nickname, group.creator?.fullname]
                      .filter(Boolean)
                      .join(" - ") || ""}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {[
                      group.creator?.username ? `@${group.creator.username}` : null,
                      [group.creator?.state?.name, group.creator?.city?.name]
                        .filter(Boolean)
                        .join(", ")
                    ]
                      .filter(Boolean)
                      .join(" - ") || ""}
                  </p>
                </div>
              </div>

              {/* Button */}
              {isMyGroup ? (
                <Button onClick={() => router.push(`/group/${group.id}`)} variant="secondary" className="w-full rounded-xl">
                  Detail
                </Button>
              ) : adminsApproval ? (
                isPending ? (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleCancelRequest(group.id, group.join_requests)}
                    disabled={loadingId === group.id}>
                    {loadingId === group.id ? "Cancelling..." : "Cancel Request"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => handleRequestJoin(group.id, group.join_requests)}
                    disabled={loadingId === group.id}>
                    {loadingId === group.id ? "Requesting..." : "Request to Join"}
                  </Button>
                )
              ) : (
                <Button
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => handleJoin(group.id, group.members)}
                  disabled={loadingId === group.id}>
                  {loadingId === group.id ? "Joining..." : "Join"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
