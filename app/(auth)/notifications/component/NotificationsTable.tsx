"use client";

// ============================================================
// notifications/_components/NotificationsTable.tsx
// Tabel notifikasi untuk halaman /notifications.
// Menggunakan komponen shared dari NotificationItem.tsx.
// ============================================================

import { Loader2, ClockIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  NotificationTitle,
  NotificationDescription,
  ActionButtons,
  getTimeAgo,
} from "../../../../components/NotificationItem";
import type { Notification } from "@/types/notifications";

interface NotificationsTableProps {
  notifications: Notification[];
  loading:       boolean;
  actionLoading: string | null;
  onAction:      (item: Notification, action: "accepted" | "declined") => void;
}

export function NotificationsTable({
  notifications, loading, actionLoading, onAction,
}: NotificationsTableProps) {
  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="text-orange-500 mx-auto h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-zinc-500 p-12 text-center font-medium">
        Belum ada notifikasi
      </div>
    );
  }

  return (
    <Table>
      <TableBody>
        {notifications.map((item) => (
          <TableRow
            key={item.id}
            className={cn(
              "transition-all duration-300 group relative overflow-hidden",
              !item.is_read
                ? "bg-orange-50/50 hover:bg-orange-50 dark:bg-orange-950/20 dark:hover:bg-orange-950/30"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
            )}
          >
            {/* Unread indicator strip */}
            <TableCell className="p-0 w-1">
              <div
                className={cn(
                  "w-1 h-20 transition-all",
                  !item.is_read
                    ? "bg-orange-500"
                    : "bg-transparent group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
                )}
              />
            </TableCell>

            {/* Main content */}
            <TableCell className="p-4 align-middle">
              <div className="flex flex-col gap-1">
                <NotificationTitle item={item} />
                <NotificationDescription item={item} />
                <ActionButtons
                  item={item}
                  actionLoading={actionLoading}
                  onAction={onAction}
                  variant="page"
                />
              </div>
            </TableCell>

            {/* Time */}
            <TableCell className="p-4 text-right align-middle shrink-0">
              <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                <ClockIcon className="size-3" />
                {getTimeAgo(item.created_at)}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
