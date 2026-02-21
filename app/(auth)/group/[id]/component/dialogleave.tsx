"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface DialogLeaveProps {
  groupId: string;
  currentMembers: any[];
}

export default function DialogLeave({ groupId, currentMembers }: DialogLeaveProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { profileId } = useAuth();
  const router = useRouter();

  const handleLeave = async () => {
    if (!profileId) return;

    setLoading(true);

    try {
      const members = Array.isArray(currentMembers) ? currentMembers : [];

      // Filter out the current user
      const updatedMembers = members.filter((m: any) => {
        const memberId = typeof m === "string" ? m : m.user_id || m.id;
        return memberId !== profileId;
      });

      const { error } = await supabase
        .from("groups")
        .update({ members: updatedMembers })
        .eq("id", groupId);

      if (error) throw error;

      toast.success("You have left the group");
      setOpen(false);
      router.push("/group");
      router.refresh();
    } catch (error: any) {
      console.error("Leave error:", error);
      toast.error(error.message || "Failed to leave group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="button-orange-outline relative flex-1">
          <LogOut size={16} className="mr-2" />
          Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog">
        <DialogHeader>
          <DialogTitle className="text-orange-900">Leave Group</DialogTitle>
        </DialogHeader>
        <DialogDescription>Are you sure you want to leave this group?</DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLeave} disabled={loading}>
            {loading ? "Leaving..." : "Leave"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
