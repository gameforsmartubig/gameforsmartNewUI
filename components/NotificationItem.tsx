"use client";

// ============================================================
// notifications/_components/NotificationItem.tsx
//
// Komponen item notifikasi yang dipakai BERSAMA oleh:
//   - Header bell dropdown
//   - Halaman notifikasi (tabel)
//
// Props `variant`:
//   "dropdown" → tampilan compact untuk header dropdown
//   "row"      → tampilan baris tabel untuk halaman notifikasi
// ============================================================

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notifications";

// ── Utility ──────────────────────────────────────────────────

export function getTimeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)} m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

// ── Title renderer ────────────────────────────────────────────

export function NotificationTitle({ item }: { item: Notification }) {
  if (item.type === "sessionGroup") {
    return (
      <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
        {item.actor_id}{" "}
        <span className="font-normal text-zinc-500">dari grup</span>{" "}
        {typeof item.from_group_id === "string" ? item.from_group_id : (item.from_group_id as any)?.name}
      </span>
    );
  }
  if (item.type === "sessionFriend" || item.type === "group") {
    return <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{item.actor_id}</span>;
  }
  if (item.type === "admin") {
    return (
      <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
        {item.content?.title || "System Notification"}
      </span>
    );
  }
  return <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Pemberitahuan</span>;
}

// ── Description renderer ──────────────────────────────────────

export function NotificationDescription({ item }: { item: Notification }) {
  if (item.type === "sessionGroup" || item.type === "sessionFriend") {
    const session = item.entity_id as any;
    return (
      <span className="text-zinc-500 dark:text-zinc-400 text-xs">
        mengundang bergabung di sesi &ldquo;{session?.name}&rdquo; ({session?.application})
      </span>
    );
  }
  if (item.type === "group") {
    const group = item.from_group_id as any;
    return (
      <span className="text-zinc-500 dark:text-zinc-400 text-xs">
        mengundang bergabung ke grup{" "}
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          {group?.name ?? group}
        </span>
      </span>
    );
  }
  if (item.type === "admin") {
    return (
      <span className="text-zinc-500 dark:text-zinc-400 text-xs line-clamp-2">
        {item.content?.message || ""}
      </span>
    );
  }
  return <span className="text-zinc-500 dark:text-zinc-400 text-xs">Tindakan diperlukan</span>;
}

// ── Status badge ──────────────────────────────────────────────

export function StatusBadge({ status }: { status: "accepted" | "declined" }) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        status === "accepted"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
      )}
    >
      {status === "accepted" ? "Diterima" : "Ditolak"}
    </span>
  );
}

// ── Action buttons ────────────────────────────────────────────

interface ActionButtonsProps {
  item:          Notification;
  actionLoading: string | null;
  onAction:      (item: Notification, action: "accepted" | "declined") => void;
  /** "page" = button-orange style, "dropdown" = outline/destructive style */
  variant?:      "page" | "dropdown";
}

export function ActionButtons({
  item, actionLoading, onAction, variant = "page",
}: ActionButtonsProps) {
  const isLoading = actionLoading === item.id;

  if (item.status !== null) {
    return <StatusBadge status={item.status} />;
  }

  if (item.type === "admin") return null;

  if (variant === "dropdown") {
    return (
      <div className="mt-1 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-3 text-[11px]"
          onClick={() => onAction(item, "accepted")}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-6 px-3 text-[11px]"
          onClick={() => onAction(item, "declined")}
          disabled={isLoading}
        >
          Decline
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Button
        size="sm"
        className="button-orange h-7 px-4 text-[11px]"
        onClick={() => onAction(item, "accepted")}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Terima"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-3 text-[11px] font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        onClick={() => onAction(item, "declined")}
        disabled={isLoading}
      >
        Tolak
      </Button>
    </div>
  );
}
