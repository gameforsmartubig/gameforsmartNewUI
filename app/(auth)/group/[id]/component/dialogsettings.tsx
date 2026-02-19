"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { EyeOff, Globe, Lock, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

interface DialogSettingsProps {
  group: any;
}

export default function DialogSettings({ group }: DialogSettingsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupCategory, setGroupCategory] = useState("");
  const [groupStatus, setGroupStatus] = useState("public");
  const [groupDescription, setGroupDescription] = useState("");
  const [adminsApproval, setAdminsApproval] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group) {
      setGroupName(group.name || "");
      setGroupCategory(group.category || "");
      setGroupDescription(group.description || "");
      setGroupStatus(group.settings?.status || "public");
      setAdminsApproval(group.settings?.admins_approval || false);
    }
  }, [group]);

  const handleSave = async () => {
    if (!groupName || !groupCategory) {
      toast.error("Group Name and Category are required");
      return;
    }

    setLoading(true);

    try {
      const updates = {
        name: groupName,
        category: groupCategory,
        description: groupDescription,
        settings: {
          ...group.settings,
          status: groupStatus,
          admins_approval: adminsApproval
        }
      };

      const { error } = await supabase.from("groups").update(updates).eq("id", group.id);

      if (error) throw error;

      toast.success("Group settings updated successfully");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update group settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1 rounded-xl">
          <Settings size={16} className="mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md min-w-0 gap-0 overflow-hidden rounded-2xl border border-lime-400 bg-white p-0">
        <DialogHeader className="border-b border-lime-200 p-6">
          <DialogTitle className="text-lg font-semibold text-lime-600">Settings</DialogTitle>
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
                    {option.labelEn}
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
          <Field orientation="horizontal" className="">
            <FieldContent>
              <FieldLabel htmlFor="switch-focus-mode">Approval</FieldLabel>
              <FieldDescription>
                If you activate this, you will need to approve anyone who wants to join this group.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="switch-focus-mode"
              checked={adminsApproval}
              onCheckedChange={setAdminsApproval}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-lime-200 p-6">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-gray-500">
            Cancel
          </Button>

          <Button
            className="bg-orange-500 px-6 font-semibold text-white hover:bg-orange-600"
            onClick={handleSave}
            disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
