"use client";

// ============================================================
// notifications/_hooks/useNotifications.ts
//
// Hook tunggal yang dipakai oleh:
//   - Header bell (Notifications component)
//   - Halaman /notifications (NotificationsClientPage)
//   - Fitur lain yang butuh data/aksi notifikasi
//
// Tidak ada import supabase langsung — semua lewat service.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  updateNotifStatus,
  joinGroupAfterAccept,
  resolveSessionUrl,
  subscribeNotifications,
} from "@/app/(auth)/notifications/service/notificationService";
import type { Notification } from "../types/notifications";

export function useNotifications(channelKey: string = "shared") {
  const { profileId } = useAuth();

  const [notifications,  setNotifications]  = useState<Notification[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [actionLoading,  setActionLoading]  = useState<string | null>(null);

  // ── Load + subscribe ────────────────────────────────────────
  const load = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    const data = await fetchNotifications(profileId);
    setNotifications(data);
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;

    load();

    // Realtime: reload saat ada perubahan di tabel
    const unsubscribe = subscribeNotifications(profileId, channelKey, load);
    return unsubscribe;
  }, [profileId, channelKey, load]);

  // ── Derived ─────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const hasUnread   = unreadCount > 0;

  // ── Mark as read (batch) ────────────────────────────────────
  const handleMarkAsRead = useCallback(async (ids: string[]) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ids.includes(n.id) ? { ...n, is_read: true } : n)
    );
    await markAsRead(ids);
  }, []);

  // ── Mark all as read ────────────────────────────────────────
  const handleMarkAllAsRead = useCallback(async () => {
    if (!profileId || unreadCount === 0) return;

    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    await markAllAsRead(profileId);
  }, [profileId, notifications, unreadCount]);

  // ── Action: accept / decline ────────────────────────────────
  const handleAction = useCallback(
    async (item: Notification, action: "accepted" | "declined") => {
      if (!profileId) return;
      setActionLoading(item.id);

      try {
        // 1. Update status di DB
        await updateNotifStatus(item.id, action);

        // 2. Update state lokal
        setNotifications((prev) =>
          prev.map((n) => n.id === item.id ? { ...n, status: action } : n)
        );

        // 3. Proses lanjutan jika "accepted"
        if (action === "accepted") {
          if (item.type === "group" && item.raw_from_group_id) {
            const { alreadyMember } = await joinGroupAfterAccept(
              profileId,
              item.raw_from_group_id
            );
            if (alreadyMember) {
              toast.info("Anda sudah menjadi anggota grup ini");
            } else {
              toast.success("Berhasil bergabung dengan grup");
            }
          } else if (item.type === "sessionGroup" || item.type === "sessionFriend") {
            const session = item.entity_id as { code?: string; application?: string } | null;
            const code    = session?.code;

            if (!code) {
              toast.error("Kode sesi tidak ditemukan");
              return;
            }

            toast.success("Mengarahkan ke sesi...");

            const { url, openInNewTab } = resolveSessionUrl(
              code,
              session?.application ?? ""
            );

            if (openInNewTab) {
              window.open(url, "_blank");
            } else {
              window.location.href = url;
            }
          }
        } else {
          toast.success("Notifikasi ditolak");
        }
      } catch (error: any) {
        console.error("[useNotifications] handleAction:", error);
        toast.error(error.message || "Terjadi kesalahan");
      } finally {
        setActionLoading(null);
      }
    },
    [profileId]
  );

  // ── Auto-read displayed notifications ───────────────────────
  /**
   * Dipanggil dari halaman notifikasi dengan daftar notif yang
   * sedang ditampilkan. Tandai sebagai dibaca secara optimistik,
   * lalu sync ke DB di background.
   */
  const autoReadDisplayed = useCallback(
    async (displayedIds: string[]) => {
      const unreadInView = notifications
        .filter((n) => displayedIds.includes(n.id) && !n.is_read)
        .map((n) => n.id);

      if (unreadInView.length === 0) return;

      // Optimistic update dengan flag read_in_session
      setNotifications((prev) =>
        prev.map((n) =>
          unreadInView.includes(n.id)
            ? { ...n, is_read: true, read_in_session: true }
            : n
        )
      );

      await markAsRead(unreadInView);
    },
    [notifications]
  );

  // ── On open header dropdown ──────────────────────────────────
  /**
   * Dipanggil saat header dropdown dibuka.
   * Tandai 5 notif teratas yang belum dibaca.
   */
  const handleHeaderOpen = useCallback(
    async (open: boolean) => {
      if (!open) return;
      const top5Unread = notifications.slice(0, 5).filter((n) => !n.is_read);
      if (top5Unread.length === 0) return;

      const ids = top5Unread.map((n) => n.id);
      setNotifications((prev) =>
        prev.map((n) => ids.includes(n.id) ? { ...n, is_read: true } : n)
      );
      await markAsRead(ids);
    },
    [notifications]
  );

  return {
    notifications,
    loading,
    actionLoading,
    unreadCount,
    hasUnread,
    handleAction,
    handleMarkAllAsRead,
    handleMarkAsRead,
    autoReadDisplayed,
    handleHeaderOpen,
    reload: load,
  };
}
