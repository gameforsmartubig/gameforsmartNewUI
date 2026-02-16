"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { EyeOff, Globe, Lock, PlusIcon, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const groupCategoryOptions = [
  {
    value: "Campus",
    labelId: "Kampus",
    labelEn: "Campus",
    icon: <Users className="h-4 w-4 text-indigo-500" />
  },
  {
    value: "Office",
    labelId: "Kantor",
    labelEn: "Office",
    icon: <Users className="h-4 w-4 text-gray-500" />
  },
  {
    value: "Family",
    labelId: "Keluarga",
    labelEn: "Family",
    icon: <Users className="h-4 w-4 text-pink-500" />
  },
  {
    value: "Community",
    labelId: "Komunitas",
    labelEn: "Community",
    icon: <Users className="h-4 w-4 text-green-500" />
  },
  {
    value: "Mosque",
    labelId: "Masjid/Musholla",
    labelEn: "Mosque",
    icon: <Users className="h-4 w-4 text-teal-500" />
  },
  {
    value: "Islamic Boarding School",
    labelId: "Pesantren",
    labelEn: "Islamic Boarding School",
    icon: <Users className="h-4 w-4 text-purple-500" />
  },
  {
    value: "School",
    labelId: "Sekolah",
    labelEn: "School",
    icon: <Users className="h-4 w-4 text-blue-500" />
  },
  {
    value: "Quran Learning Center",
    labelId: "TPA/TPQ",
    labelEn: "Quran Learning Center",
    icon: <Users className="h-4 w-4 text-emerald-500" />
  },
  {
    value: "General",
    labelId: "Umum",
    labelEn: "General",
    icon: <Users className="h-4 w-4 text-gray-500" />
  },
  {
    value: "Others",
    labelId: "Lainnya",
    labelEn: "Others",
    icon: <Users className="h-4 w-4 text-orange-500" />
  }
];

export default function DialogCreate() {
  const [open, setOpen] = useState(false);
  const { profileId } = useAuth();

  const [groupName, setGroupName] = useState("");
  const [groupCategory, setGroupCategory] = useState("");
  const [groupStatus, setGroupStatus] = useState("public"); // public, private, secret
  const [groupDescription, setGroupDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!profileId) {
      toast.error("You must be logged in to create a group");
      return;
    }

    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (!groupCategory) {
      toast.error("Category is required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: groupName,
        category: groupCategory,
        description: groupDescription.trim() || null,
        creator_id: profileId,
        members: [{ role: "owner", user_id: profileId }],
        settings: {
          status: groupStatus,
          admins_approval: groupStatus !== "public" // false if public, true otherwise
        }
      };

      const { error } = await supabase.from("groups").insert(payload);

      if (error) throw error;

      toast.success("Group created successfully!");
      setOpen(false);

      // Reset form
      setGroupName("");
      setGroupCategory("");
      setGroupStatus("public");
      setGroupDescription("");

      // Refresh page to show new group?
      // Typically router.refresh() or manual state update.
      // For now just close dialog.
      window.location.reload();
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast.error(error.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="">
          <PlusIcon className="hidden sm:block" />
          <span className="hidden sm:inline">Create Group</span>
          <span className="inline sm:hidden">Create</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md min-w-0 gap-0 overflow-hidden rounded-2xl border border-lime-400 bg-white p-0">
        <DialogHeader className="border-b border-lime-200 p-6">
          <DialogTitle className="text-lg font-semibold text-lime-600">Create Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName">
              Name
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="groupName"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="groupCategory">
              Category
              <span className="text-red-500">*</span>
            </Label>
            <Select value={groupCategory} onValueChange={setGroupCategory}>
              <SelectTrigger id="groupCategory">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {groupCategoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span>{option.labelEn}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* status */}
          <div className="space-y-2">
            <Label>
              Type
              <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2 flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="groupType"
                  value="public"
                  checked={groupStatus === "public"}
                  onChange={() => setGroupStatus("public")}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Globe className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">Public</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="groupType"
                  value="private"
                  checked={groupStatus === "private"}
                  onChange={() => setGroupStatus("private")}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Lock className="h-4 w-4 text-amber-500" />
                <span className="text-sm">Private</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="groupType"
                  value="secret"
                  checked={groupStatus === "secret"}
                  onChange={() => setGroupStatus("secret")}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <EyeOff className="h-4 w-4 text-red-500" />
                <span className="text-sm">Secret</span>
              </label>
            </div>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="groupDescription">Description</Label>
            <Textarea
              id="groupDescription"
              placeholder="Enter group description"
              rows={2}
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-lime-200 p-6">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-gray-500">
            Cancel
          </Button>

          <Button
            className="bg-orange-500 px-6 font-semibold text-white hover:bg-orange-600"
            onClick={handleCreate}
            disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
