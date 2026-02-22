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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { cn } from "@/lib/utils";
import { EyeOff, Globe, Lock, PlusIcon, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const groupCategoryOptions = [
  {
    value: "Campus",
    labelId: "Kampus",
    labelEn: "Campus"
  },
  {
    value: "Office",
    labelId: "Kantor",
    labelEn: "Office"
  },
  {
    value: "Family",
    labelId: "Keluarga",
    labelEn: "Family"
  },
  {
    value: "Community",
    labelId: "Komunitas",
    labelEn: "Community"
  },
  {
    value: "Mosque",
    labelId: "Masjid/Musholla",
    labelEn: "Mosque"
  },
  {
    value: "Islamic Boarding School",
    labelId: "Pesantren",
    labelEn: "Islamic Boarding School"
  },
  {
    value: "School",
    labelId: "Sekolah",
    labelEn: "School"
  },
  {
    value: "Quran Learning Center",
    labelId: "TPA/TPQ",
    labelEn: "Quran Learning Center"
  },
  {
    value: "General",
    labelId: "Umum",
    labelEn: "General"
  },
  {
    value: "Others",
    labelId: "Lainnya",
    labelEn: "Others"
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
        <Button variant="outline" className="button-green">
          <PlusIcon className="hidden sm:block" />
          <span className="hidden sm:inline">Create Group</span>
          <span className="inline sm:hidden">Create</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog w-full max-w-md min-w-0 gap-0 p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-lg font-semibold text-orange-950">Create Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {/* Group Name */}
          <div className="flex gap-3">
            <div className="w-full space-y-2">
              <Label htmlFor="groupName" className="text-orange-900">
                Name
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="groupName"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="input"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="groupCategory" className="text-orange-900">
                Category
                <span className="text-red-500">*</span>
              </Label>
              <Select value={groupCategory} onValueChange={setGroupCategory}>
                <SelectTrigger id="groupCategory" className="input">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {groupCategoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* status */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-orange-950">
              Group Type
              <span className="ml-1 text-red-500">*</span>
            </Label>

            <RadioGroup
              value={groupStatus}
              onValueChange={setGroupStatus}
              className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Option: Public */}
              <div>
                <RadioGroupItem value="public" id="public" className="peer sr-only" />
                <Label
                  htmlFor="public"
                  className={cn(
                    "border-muted bg-popover hover:text-accent-foreground flex cursor-pointer flex-col items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 peer-data-[state=checked]:border-orange-500 hover:bg-orange-50 [&:has([data-state=checked])]:border-orange-500",
                    groupStatus === "public" ? "border-orange-500 bg-orange-50/50" : ""
                  )}>
                  <Globe
                    className={cn(
                      "mb-3 h-6 w-6 transition-colors",
                      groupStatus === "public" ? "text-emerald-500" : "text-muted-foreground"
                    )}
                  />
                  <div className="space-y-1 text-center">
                    <p className="text-sm leading-none font-medium">Public</p>
                    <p className="text-muted-foreground text-xs">Anyone can join</p>
                  </div>
                </Label>
              </div>

              {/* Option: Private */}
              <div>
                <RadioGroupItem value="private" id="private" className="peer sr-only" />
                <Label
                  htmlFor="private"
                  className={cn(
                    "border-muted bg-popover hover:text-accent-foreground flex cursor-pointer flex-col items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 peer-data-[state=checked]:border-orange-500 hover:bg-orange-50",
                    groupStatus === "private" ? "border-orange-500 bg-orange-50/50" : ""
                  )}>
                  <Lock
                    className={cn(
                      "mb-3 h-6 w-6 transition-colors",
                      groupStatus === "private" ? "text-amber-500" : "text-muted-foreground"
                    )}
                  />
                  <div className="space-y-1 text-center">
                    <p className="text-sm leading-none font-medium">Private</p>
                    <p className="text-muted-foreground text-xs">Request to join</p>
                  </div>
                </Label>
              </div>

              {/* Option: Secret */}
              <div>
                <RadioGroupItem value="secret" id="secret" className="peer sr-only" />
                <Label
                  htmlFor="secret"
                  className={cn(
                    "border-muted bg-popover hover:text-accent-foreground flex cursor-pointer flex-col items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 peer-data-[state=checked]:border-orange-500 hover:bg-orange-50",
                    groupStatus === "secret" ? "border-orange-500 bg-orange-50/50" : ""
                  )}>
                  <EyeOff
                    className={cn(
                      "mb-3 h-6 w-6 transition-colors",
                      groupStatus === "secret" ? "text-red-500" : "text-muted-foreground"
                    )}
                  />
                  <div className="space-y-1 text-center">
                    <p className="text-sm leading-none font-medium">Secret</p>
                    <p className="text-muted-foreground text-xs">Invite only</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="groupDescription" className="text-orange-900">
              Description
            </Label>
            <Textarea
              id="groupDescription"
              placeholder="Enter group description"
              rows={2}
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-6">
          <Button variant="outline" onClick={() => setOpen(false)} className="text-gray-500">
            Cancel
          </Button>

          <Button className="button-orange" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
