"use client";

// ============================================================
// notifications/component/client.tsx
// Client orchestrator untuk halaman /notifications.
// Semua logika ada di useNotifications hook.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsTable } from "../component/NotificationsTable";
import type { Notification } from "@/types/notifications";

export default function NotificationsClientPage() {
  const {
    notifications,
    loading,
    actionLoading,
    unreadCount,
    handleAction,
    handleMarkAllAsRead,
    autoReadDisplayed,
  } = useNotifications("page");

  // ── Filter & sort state ─────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [sortOrder,    setSortOrder]    = useState<"newest" | "oldest">("newest");
  const [visibleCount, setVisibleCount] = useState(10);

  // Reset pagination on filter change
  useEffect(() => { setVisibleCount(10); }, [statusFilter, typeFilter, sortOrder]);

  // ── Filter + sort ───────────────────────────────────────────
  const filtered: Notification[] = notifications
    .filter((n) => {
      const matchStatus =
        statusFilter === "all"    ? true
        : statusFilter === "unread" ? (!n.is_read || n.read_in_session)
        : n.is_read;

      const matchType =
        typeFilter === "all"     ? true
        : typeFilter === "session" ? (n.type === "sessionGroup" || n.type === "sessionFriend")
        : n.type === typeFilter;

      return matchStatus && matchType;
    })
    .sort((a, b) => {
      const diff =
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });

  const displayed = filtered.slice(0, visibleCount);

  // ── Auto-read displayed notifications ───────────────────────
  useEffect(() => {
    const ids = displayed.map((n) => n.id);
    autoReadDisplayed(ids);
  }, [displayed]);

  // ── Infinite scroll ─────────────────────────────────────────
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      observer.current?.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && visibleCount < filtered.length) {
          setVisibleCount((prev) => prev + 10);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, visibleCount, filtered.length]
  );

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Notifications</h1>

        {/* Mark all — mobile */}
        <Button className="button-orange sm:hidden" onClick={handleMarkAllAsRead}>
          <Check className="size-4" />
          Mark All as Read
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Mark all — desktop */}
        <Button
          className="button-orange hidden sm:flex shrink-0"
          onClick={handleMarkAllAsRead}
        >
          <Check className="size-4" />
          Mark All as Read {unreadCount > 0 && `(${unreadCount})`}
        </Button>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="input h-9 w-[120px] text-xs font-semibold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="input h-9 w-[120px] text-xs font-semibold">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="session">Session</SelectItem>
              <SelectItem value="group">Group</SelectItem>
              <SelectItem value="admin">System</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="input h-9 w-9 p-0"
            onClick={() =>
              setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))
            }
            title={sortOrder === "newest" ? "Sort Oldest First" : "Sort Newest First"}
          >
            <ArrowUpDown className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="rounded-md border">
        <NotificationsTable
          notifications={displayed}
          loading={loading}
          actionLoading={actionLoading}
          onAction={handleAction}
        />
        {visibleCount < filtered.length && (
          <div ref={sentinelRef} className="h-4 w-full" />
        )}
      </div>

      {/* ── Footer count ───────────────────────────────────── */}
      <div className="text-muted-foreground flex-1 text-sm">
        Showing {displayed.length} of {filtered.length} notification(s)
      </div>
    </div>
  );
}
