"use client";

import { useState, useEffect } from "react";
import { createNotification } from "@/app/actions/notification";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Share2, Users, X, Loader2, RefreshCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface InviteFriendProps {
  sessionId?: string;
  gamePin?: string;
  quizTitle?: string;
  hostName?: string;
}

export function InviteFriend({
  sessionId = "",
  gamePin = "",
  quizTitle = "",
  hostName = ""
}: InviteFriendProps) {
  const [open, setOpen] = useState(false);
  const { profileId } = useAuth();
  const [isSending, setIsSending] = useState(false);

  type Friend = {
    id: string;
    fullname: string | null;
    username: string;
    avatar_url?: string | null;
  };

  const [selected, setSelected] = useState<Friend[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchFriends = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const { data: following } = await supabase
        .from("friendships")
        .select("addressee_id")
        .eq("requester_id", profileId);

      const { data: followers } = await supabase
        .from("friendships")
        .select("requester_id")
        .eq("addressee_id", profileId);

      const followingIds = following?.map((f) => f.addressee_id) || [];
      const followerIds = followers?.map((f) => f.requester_id) || [];

      const mutualIds = followingIds.filter((id) => followerIds.includes(id));

      if (mutualIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, nickname, fullname, avatar_url")
          .in("id", mutualIds);

        const mapped = (profiles || []).map((p: any) => ({
          id: p.id,
          username: p.username,
          fullname: p.fullname || p.nickname || p.username,
          avatar_url: p.avatar_url
        }));
        setFriends(mapped);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFriends();
      setSelected([]);
      setSearchTerm("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profileId]);

  const toggleSelect = (friend: Friend) => {
    setSelected((prev) => {
      const exists = prev.find((g) => g.id === friend.id);
      if (exists) return prev.filter((g) => g.id !== friend.id);
      return [...prev, friend];
    });
  };

  const filtered = friends.filter((f) => {
    const search = searchTerm.toLowerCase();
    return (
      f.username?.toLowerCase().includes(search) ||
      (f.fullname && f.fullname.toLowerCase().includes(search))
    );
  });

  const handleSendInvites = async () => {
    if (!profileId || selected.length === 0) return;

    setIsSending(true);
    try {
      const timestamp = new Date().toISOString();

      const notifications = selected.map((friend) => ({
        id: crypto.randomUUID(),
        user_id: friend.id,
        actor_id: profileId,
        type: "sessionFriend",
        entity_type: "session",
        entity_id: sessionId,
        status: null,
        content: null,
        is_read: false,
        created_at: timestamp
      }));

      await createNotification(notifications);

      toast.success(`Invites sent to ${selected.length} friends!`);
      setOpen(false);
      setSelected([]);
    } catch (error) {
      console.error("Error sending invites:", error);
      toast.error("Failed to send invites");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full text-xs">
          <Share2 className="mr-2 size-3" /> Invite Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md min-w-0 gap-0 overflow-hidden rounded-2xl border border-lime-400 bg-white p-0">
        <DialogHeader className="border-b border-lime-200 p-6">
          <DialogTitle className="text-lg font-semibold text-lime-600">Invite Friends</DialogTitle>
        </DialogHeader>

        <div className="max-w-full min-w-0 space-y-5 p-6">
          <Input
            placeholder="Search by name or username..."
            className="border-lime-300 focus-visible:ring-lime-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {selected.length > 0 && (
            <div className="w-full">
              <p className="mb-2 text-xs font-medium text-orange-500">
                SELECTED ({selected.length})
              </p>
              <div className="max-h-20 w-full overflow-x-auto">
                <div className="flex gap-2 py-2">
                  {selected.map((friend) => (
                    <div key={friend.id} className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10 border-2 border-lime-400">
                        <AvatarImage src={friend.avatar_url || ""} />
                        <AvatarFallback className="bg-lime-400 text-white">
                          {(friend.fullname?.[0] || friend.username?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <button
                        onClick={() => toggleSelect(friend)}
                        className="absolute -top-1 -right-1 rounded-full bg-orange-500 p-1 text-white hover:bg-orange-600">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center py-4 text-lime-600">
                <Loader2 className="animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                {searchTerm ? "No friends found matching search." : "No mutual friends found."}
              </p>
            ) : (
              filtered.map((friend) => {
                const isSelected = selected.some((f) => f.id === friend.id);

                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between border-b border-lime-200 py-1.5 last:border-0">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.avatar_url || ""} />
                        <AvatarFallback className="bg-lime-400 text-white">
                          {(friend.fullname?.[0] || friend.username?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{friend.fullname}</p>
                        <p className="text-xs text-gray-500">@{friend.username}</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => toggleSelect(friend)}
                      className={
                        isSelected
                          ? "bg-lime-500 text-white hover:bg-lime-600"
                          : "bg-orange-500 text-white hover:bg-orange-600"
                      }>
                      {isSelected ? "Added" : "Add"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-lime-200 p-6">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-gray-500">
            Cancel
          </Button>

          <div className="flex items-center gap-4">
            <RefreshCcw
              className={`size-5 cursor-pointer text-orange-500 hover:text-orange-600 focus:outline-none ${isSending ? "pointer-events-none opacity-50" : ""}`}
              onClick={() => !isSending && setSelected([])}
              role="button"
              aria-label="Refresh selection"
            />
            <Button
              className="bg-orange-500 px-6 font-semibold text-white hover:bg-orange-600"
              onClick={handleSendInvites}
              disabled={selected.length === 0 || isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                `Send Invites (${selected.length})`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InviteGroup() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Group[]>([]);

  type Group = {
    id: number;
    name: string;
    members: number;
  };

  const dummyGroups: Group[] = [
    { id: 1, name: "Math Masters", members: 24 },
    { id: 2, name: "Science Squad", members: 18 },
    { id: 3, name: "History Heroes", members: 12 },
    { id: 4, name: "Coding Club", members: 30 },
    { id: 5, name: "Quiz Warriors", members: 15 },
    { id: 6, name: "Math Masters", members: 24 },
    { id: 7, name: "Science Squad", members: 18 },
    { id: 8, name: "History Heroes", members: 12 },
    { id: 9, name: "Coding Club", members: 30 },
    { id: 10, name: "Quiz Warriors", members: 15 },
    { id: 11, name: "Math Masters", members: 24 },
    { id: 12, name: "Science Squad", members: 18 },
    { id: 13, name: "History Heroes", members: 12 },
    { id: 14, name: "Coding Club", members: 30 },
    { id: 15, name: "Quiz Warriors", members: 15 }
  ];

  const toggleSelect = (group: Group) => {
    setSelected((prev) => {
      const exists = prev.find((g) => g.id === group.id);

      if (exists) {
        return prev.filter((g) => g.id !== group.id);
      }

      return [...prev, group];
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" className="w-full text-xs">
          <Users className="mr-2 size-3" /> Invite Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border border-lime-400 bg-white p-0">
        <DialogHeader className="border-b border-lime-200 p-6">
          <DialogTitle className="text-lg font-semibold text-lime-600">Invite Groups</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-6">
          <Input
            placeholder="Search group..."
            className="border-lime-300 focus-visible:ring-lime-400"
          />

          <div>
            <p className="mb-2 text-xs font-medium text-orange-500">SELECTED ({selected.length})</p>

            <div className="flex max-h-20 flex-wrap gap-2 overflow-y-auto">
              {selected.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-2 rounded-full border-b-2 bg-lime-400 px-3 py-1 text-xs font-medium text-white">
                  {group.name}
                  <button
                    onClick={() => toggleSelect(group)}
                    className="text-white hover:text-orange-600">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto pr-2">
            {dummyGroups.map((group) => {
              const isSelected = selected.some((g) => g.id === group.id);

              return (
                <div
                  key={group.id}
                  className="flex items-center justify-between border-b border-lime-200 py-1.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{group.name}</p>
                    <p className="text-xs text-gray-500">{group.members} members</p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => toggleSelect(group)}
                    className={
                      isSelected
                        ? "bg-lime-500 text-white hover:bg-lime-600"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }>
                    {isSelected ? "Added" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-lime-200 p-6">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-gray-500">
            Cancel
          </Button>

          <Button className="bg-lime-500 px-6 font-semibold text-white hover:bg-lime-600">
            Send Invites ({selected.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
