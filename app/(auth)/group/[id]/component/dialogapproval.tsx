"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Bell, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DialogApprovalProps {
  groupId: string;
  joinRequests: any[];
}

export default function DialogApproval({ groupId, joinRequests }: DialogApprovalProps) {
  const [open, setOpen] = useState(false);
  const [enhancedRequests, setEnhancedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      fetchProfiles();
    }
  }, [open, joinRequests]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const requests = Array.isArray(joinRequests) ? joinRequests : [];
      const pendingRequests = requests.filter((r: any) => r.status === "pending");

      if (pendingRequests.length === 0) {
        setEnhancedRequests([]);
        return;
      }

      const userIds = pendingRequests.map((r: any) =>
        typeof r.user_id === "string" ? r.user_id : r.user_id?.id
      );

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, fullname, nickname, username, avatar_url")
        .in("id", userIds);

      if (error) throw error;

      const merged = pendingRequests.map((req: any) => {
        const userId = typeof req.user_id === "string" ? req.user_id : req.user_id?.id;
        const profile = profiles?.find((p) => p.id === userId);
        return {
          ...req,
          profile: profile || null
        };
      });

      setEnhancedRequests(merged);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (request: any, decision: "approved" | "rejected") => {
    const userId = typeof request.user_id === "string" ? request.user_id : request.user_id?.id;
    if (!userId) return;

    setActionLoading(userId);

    try {
      // 1. Fetch latest group data to ensure we don't overwrite concurrent changes
      const { data: groupData, error: fetchError } = await supabase
        .from("groups")
        .select("join_requests, members")
        .eq("id", groupId)
        .single();

      if (fetchError) throw fetchError;

      const currentRequests = Array.isArray(groupData.join_requests) ? groupData.join_requests : [];
      const currentMembers = Array.isArray(groupData.members) ? groupData.members : [];

      // 2. Update status in join_requests
      const updatedRequests = currentRequests.map((r: any) => {
        const rId = typeof r.user_id === "string" ? r.user_id : r.user_id?.id;
        if (rId === userId && r.status === "pending") {
          return {
            ...r,
            status: decision
            // updated_at: new Date().toISOString()
          };
        }
        return r;
      });

      // 3. If approved, add to members
      let updatedMembers = currentMembers;
      if (decision === "approved") {
        // Check if already member (collision check)
        const isMember = currentMembers.some((m: any) => {
          const mId = typeof m === "string" ? m : m.user_id || m.id;
          return mId === userId;
        });

        if (!isMember) {
          updatedMembers = [
            ...currentMembers,
            {
              user_id: userId,
              role: "member"
              //   joined_at: new Date().toISOString()
            }
          ];
        }
      }

      // 4. Update Database
      const { error: updateError } = await supabase
        .from("groups")
        .update({
          join_requests: updatedRequests,
          members: updatedMembers
        })
        .eq("id", groupId);

      if (updateError) throw updateError;

      toast.success(`User ${decision} successfully`);

      // Update local state temporarily for snappy UI
      setEnhancedRequests((prev) =>
        prev.filter((r) => {
          const rId = typeof r.user_id === "string" ? r.user_id : r.user_id?.id;
          return rId !== userId;
        })
      );

      router.refresh();

      // If list becomes empty, fetchProfiles logic handles it on next render or we can close
      if (enhancedRequests.length <= 1) {
        // Maybe close dialog? User didn't ask.
      }
    } catch (error: any) {
      console.error("Decision error:", error);
      toast.error(error.message || `Failed to ${decision} user`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative rounded-xl">
          <Bell size={16} />
          {joinRequests?.some((r: any) => r.status === "pending") && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approval</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-4 text-center text-sm text-gray-500">Loading requests...</div>
          ) : enhancedRequests.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No pending requests</div>
          ) : (
            <div className="divide-y">
              {enhancedRequests.map((req, index) => {
                const userId = typeof req.user_id === "string" ? req.user_id : req.user_id?.id;
                const isProcessing = actionLoading === userId;

                return (
                  <div key={index} className="flex items-center gap-3 py-3">
                    <Avatar>
                      <AvatarImage src={req.profile?.avatar_url} />
                      <AvatarFallback>
                        {(
                          req.profile?.nickname?.[0] ||
                          req.profile?.fullname?.[0] ||
                          req.profile?.username?.[0] || // Added username fallback
                          "?"
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">
                        {req.profile?.nickname ||
                          req.profile?.fullname ||
                          req.profile?.username ||
                          "Unknown User"}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {req.requested_at
                          ? new Date(req.requested_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })
                          : "Unknown date"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="button-green-outline"
                        size="icon"
                        onClick={() => handleDecision(req, "approved")}
                        disabled={!!actionLoading}>
                        {isProcessing ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Check size={16} />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl hover:bg-red-50 hover:text-red-600"
                        size="icon"
                        onClick={() => handleDecision(req, "rejected")}
                        disabled={!!actionLoading}>
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
