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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { cn } from "@/lib/utils";
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
        <Button variant="outline" className="button-yellow-outline flex-1">
          <Settings size={16} className="mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog w-full max-w-md min-w-0 gap-0">
        <DialogHeader className="">
          <DialogTitle className="text-lg font-semibold text-orange-900">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {/* Group Name */}
          <div className="space-y-2">
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

          {/* status */}
          <div className="space-y-3">
            {/* Label Utama menggunakan Shadcn Label */}
            <Label className="text-base font-semibold text-orange-950">
              Type
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
                    "flex cursor-pointer flex-col items-center justify-between rounded-xl border-2 p-4 transition-all duration-200",
                    "border-muted bg-popover hover:text-accent-foreground hover:bg-orange-50",
                    "peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50/50",
                    "dark:peer-data-[state=checked]:border-orange-600 dark:peer-data-[state=checked]:bg-orange-900/20"
                  )}>
                  <Globe
                    className={cn(
                      "mb-3 h-6 w-6 transition-colors",
                      groupStatus === "public" ? "text-green-500" : "text-muted-foreground"
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
                    "flex cursor-pointer flex-col items-center justify-between rounded-xl border-2 p-4 transition-all duration-200",
                    "border-muted bg-popover hover:text-accent-foreground hover:bg-orange-50",
                    "peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50/50",
                    "dark:peer-data-[state=checked]:border-orange-600 dark:peer-data-[state=checked]:bg-orange-900/20"
                  )}>
                  <Lock
                    className={cn(
                      "mb-3 h-6 w-6 transition-colors",
                      groupStatus === "private" ? "text-yellow-500" : "text-muted-foreground"
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
                    "flex cursor-pointer flex-col items-center justify-between rounded-xl border-2 p-4 transition-all duration-200",
                    "border-muted bg-popover hover:text-accent-foreground hover:bg-orange-50",
                    "peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50/50",
                    "dark:peer-data-[state=checked]:border-orange-600 dark:peer-data-[state=checked]:bg-orange-900/20"
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
          <Field orientation="horizontal" className="">
            <FieldContent>
              <FieldLabel htmlFor="switch-focus-mode" className="text-orange-900">
                Approval
              </FieldLabel>
              <FieldDescription>
                If you activate this, you will need to approve anyone who wants to join this group.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="switch-focus-mode"
              className="data-[state=unchecked]:bg-input data-[state=checked]:bg-green-500"
              checked={adminsApproval}
              onCheckedChange={setAdminsApproval}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3">
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
