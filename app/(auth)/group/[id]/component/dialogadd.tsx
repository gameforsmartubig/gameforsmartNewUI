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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DialogAddProps {
  groupId: string;
}

export default function DialogAdd({ groupId }: DialogAddProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const { profileId } = useAuth();

  const handleSearch = async () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    // Clear previous results to avoid confusion
    setSearchResults([]);

    try {
      const searchTerm = `%${inputValue}%`;
      const { data, error } = await supabase
        .from("profiles")
        .select("*, state:states(name), city:cities(name)")
        .or(
          `nickname.ilike.${searchTerm},fullname.ilike.${searchTerm},username.ilike.${searchTerm}`
        )
        .limit(20);

      // Simple fallback logic if relations fail (same as before)
      if (error) {
        console.warn("Relation fetch failed, retrying without relations", error);
        const { data: retryData, error: retryError } = await supabase
          .from("profiles")
          .select("*")
          .or(
            `nickname.ilike.${searchTerm},fullname.ilike.${searchTerm},username.ilike.${searchTerm}`
          )
          .limit(20);

        if (retryError) throw retryError;
        setSearchResults(retryData || []);
      } else {
        setSearchResults(data || []);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId: string) => {
    if (!profileId) {
      toast.error("You must be logged in to invite users");
      return;
    }

    // Determine current group ID from prop
    if (!groupId) {
      toast.error("Group ID is missing");
      return;
    }

    setInvitingId(userId);

    try {
      // Check if already invited? (Optional, but good UX. Skipping for now to follow strict instructions)
      // Check if already member? (Optional)

      const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        actor_id: profileId,
        type: "group",
        entity_type: "group",
        entity_id: groupId,
        is_read: false,
        status: null, // As requested
        content: null // As requested
      });

      if (error) throw error;

      toast.success("Invitation sent successfully");

      // Optionally remove from list or mark as invited
      // For now, we just keep it
    } catch (error: any) {
      console.error("Invite error:", error);
      toast.error("Failed to send invitation");
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="button-orange w-full">Add Member</Button>
      </DialogTrigger>
      <DialogContent className="dialog w-full max-w-md min-w-0 gap-0 p-0">
        <DialogHeader className="border-b border-orange-100 p-6">
          <DialogTitle className="text-lg font-semibold text-orange-900">Add Member</DialogTitle>
        </DialogHeader>

        <div className="max-w-full min-w-0 space-y-5 p-6">
          <div className="relative">
            <Input
              placeholder="Search by nickname, fullname, or username..."
              className="input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Button
              variant="default"
              className="button-orange absolute top-1 right-1 h-7 w-7 p-2"
              onClick={handleSearch}
              disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={20} />}
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center py-4 text-orange-500">
                <Loader2 className="animate-spin" />
              </div>
            ) : hasSearched && searchResults.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">No users found.</div>
            ) : (
              searchResults.map((profile) => {
                const isInviting = invitingId === profile.id;

                // Exclude self from list?
                if (profile.id === profileId) return null;

                return (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between border-b border-orange-50 py-1.5 last:border-0">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback className="bg-green-500 font-bold text-white">
                          {(
                            profile.fullname?.[0] ||
                            profile.username?.[0] ||
                            profile.nickname?.[0] ||
                            "?"
                          ).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-medium">
                          {[profile.nickname, profile.fullname].filter(Boolean).join(" - ") ||
                            "Unknown User"}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {[
                            profile.username ? `@${profile.username}` : null,
                            [profile.state?.name, profile.city?.name].filter(Boolean).join(", ")
                          ]
                            .filter(Boolean)
                            .join(" - ") || ""}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={"outline"}
                      className="button-orange"
                      onClick={() => handleInvite(profile.id)}
                      disabled={isInviting || loading}>
                      {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "invite"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
