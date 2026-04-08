// ============================================================
// notifications/_services/notificationService.ts
//
// Semua operasi Supabase untuk sistem notifikasi.
// Dipanggil dari hook, TIDAK pernah langsung dari komponen.
//
// Fungsi yang tersedia (bisa dipanggil dari fitur lain):
//   fetchNotifications     – ambil + enrich notifikasi user
//   markAsRead             – tandai satu/banyak notif sebagai dibaca
//   markAllAsRead          – tandai semua notif user sebagai dibaca
//   updateNotifStatus      – ubah status notif (accepted/declined)
//   joinGroupAfterAccept   – proses bergabung ke grup
//   resolveSessionUrl      – resolve URL join session berdasar aplikasi
//   subscribeNotifications – realtime subscription (mengembalikan unsubscribe fn)
// ============================================================

import { supabase } from "@/lib/supabase";
import type { Notification, SessionEntity } from "@/types/notifications";
import { logGroupActivity } from "@/app/service/group/group.service";

// ─── fetchNotifications ──────────────────────────────────────

/**
 * Mengambil semua notifikasi milik user, lalu enrich dengan
 * data aktor (profiles), grup, dan session secara batch.
 *
 * Dapat dipakai dari: header bell, halaman notifikasi,
 * badge count di sidebar, dll.
 */
export async function fetchNotifications(profileId: string): Promise<Notification[]> {
  const { data: notifs, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });

  if (error || !notifs) return [];

  // ── Batch fetch actors ────────────────────────────────────
  const actorIds = [...new Set(notifs.map((n) => n.actor_id).filter(Boolean))];
  const profilesMap: Record<string, any> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nickname, fullname")
      .in("id", actorIds);
    profiles?.forEach((p) => { profilesMap[p.id] = p; });
  }

  // ── Batch fetch groups ────────────────────────────────────
  const groupIds = [
    ...new Set([
      ...notifs.filter((n) => n.type === "group"         && n.from_group_id).map((n) => n.from_group_id),
      ...notifs.filter((n) => n.type === "sessionGroup"  && n.from_group_id).map((n) => n.from_group_id),
    ]),
  ];
  const groupsMap: Record<string, any> = {};
  if (groupIds.length > 0) {
    const { data: groups } = await supabase
      .from("groups")
      .select("id, name")
      .in("id", groupIds);
    groups?.forEach((g) => { groupsMap[g.id] = g; });
  }

  // ── Batch fetch sessions ──────────────────────────────────
  const sessionIds = [
    ...new Set(
      notifs
        .filter((n) => (n.type === "sessionGroup" || n.type === "sessionFriend") && n.entity_id)
        .map((n) => n.entity_id)
    ),
  ];
  const sessionsMap: Record<string, SessionEntity> = {};
  if (sessionIds.length > 0) {
    const { data: sessions } = await supabase
      .from("game_sessions")
      .select("id, game_pin, application, quizzes!game_sessions_quiz_id_fkey(title)")
      .in("id", sessionIds);
    sessions?.forEach((s: any) => {
      const quizData = s.quizzes;
      const title    = Array.isArray(quizData) ? quizData[0]?.title : quizData?.title;
      sessionsMap[s.id] = {
        name:        title || "Unknown Quiz",
        code:        s.game_pin || "N/A",
        application: s.application || "N/A",
      };
    });
  }

  // ── Enrich ────────────────────────────────────────────────
  return notifs.map((n): Notification => {
    const actor     = profilesMap[n.actor_id] || {};
    const actorName = actor.nickname || actor.fullname || "User";

    const base: Notification = {
      id:                n.id,
      user_id:           n.user_id,
      actor_id:          actorName,
      type:              n.type,
      entity_type:       n.entity_type,
      entity_id:         n.entity_id,
      from_group_id:     n.from_group_id,
      raw_from_group_id: n.from_group_id,
      status:            n.status,
      content:           n.content,
      is_read:           n.is_read || false,
      created_at:        n.created_at,
    };

    if (n.type === "group") {
      base.from_group_id = { name: groupsMap[n.from_group_id]?.name || "Unknown Group" };
    } else if (n.type === "sessionFriend" || n.type === "sessionGroup") {
      base.entity_id = sessionsMap[n.entity_id] ?? {
        name: "Unknown Session", code: "N/A", application: "N/A",
      };
      if (n.type === "sessionGroup" && n.from_group_id) {
        base.from_group_id = groupsMap[n.from_group_id]?.name || "Unknown Group";
      }
    }

    return base;
  });
}

// ─── markAsRead ───────────────────────────────────────────────

/** Tandai array notif ID sebagai dibaca */
export async function markAsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await supabase.from("notifications").update({ is_read: true }).in("id", ids);
}

/** Tandai SEMUA notif milik user sebagai dibaca */
export async function markAllAsRead(profileId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", profileId)
    .eq("is_read", false);
}

// ─── updateNotifStatus ────────────────────────────────────────

/** Update status satu notifikasi (accepted / declined) */
export async function updateNotifStatus(
  id: string,
  status: "accepted" | "declined"
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

// ─── joinGroupAfterAccept ─────────────────────────────────────

/**
 * Tambahkan user sebagai member grup setelah menerima undangan.
 * Dapat dipanggil dari fitur lain yang perlu join grup.
 */
export async function joinGroupAfterAccept(
  profileId: string,
  groupId:   string
): Promise<{ alreadyMember: boolean }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, fullname")
    .eq("id", profileId)
    .single();

  const userName = profile?.nickname || profile?.fullname || "User";

  const { data: group } = await supabase
    .from("groups")
    .select("members")
    .eq("id", groupId)
    .single();

  if (!group) throw new Error("Group not found");

  const members = group.members || [];
  const alreadyMember = members.some((m: any) => m.id === profileId);

  if (!alreadyMember) {
    const { error } = await supabase
      .from("groups")
      .update({ members: [...members, { id: profileId, name: userName, role: "member" }] })
      .eq("id", groupId);
    if (error) throw error;

    // Log "join" activity
    await logGroupActivity(groupId, profileId, profileId, "join");
  }

  return { alreadyMember };
}

// ─── resolveSessionUrl ────────────────────────────────────────

/**
 * Resolve URL join session berdasarkan nama aplikasi.
 * Mengembalikan { url, openInNewTab }.
 * Dapat dipanggil dari fitur lain (mis. tombol join di halaman lain).
 */
export function resolveSessionUrl(
  code: string,
  application: string
): { url: string; openInNewTab: boolean } {
  const app = application.toLowerCase().trim();
  switch (app) {
    case "crazyrace":
      return { url: `https://crazyrace.gameforsmart.com/join/${code}`, openInNewTab: true };
    case "memoryquiz":
      return { url: `https://memoryquiz.gameforsmart.com/join/${code}`, openInNewTab: true };
    case "quizrush":
      return { url: `https://quizrush.gameforsmart.com/join/${code}`, openInNewTab: true };
    case "space quiz":
    case "spacequiz":
      return { url: `https://spacequiz.gameforsmart.com/join/${code}`, openInNewTab: true };
    case "axiom":
      return { url: `https://axiom.gameforsmart.com/join/${code}`, openInNewTab: true };
    case "zigma":
      return { url: `https://zigma.gameforsmart.com/join/${code}`, openInNewTab: true };
    default:
      return { url: `https://app.gameforsmart.com/join/${code}`, openInNewTab: false };
  }
}


// ─── subscribeNotifications ───────────────────────────────────

/**
 * Membuat realtime subscription Supabase untuk notifikasi user.
 * Mengembalikan fungsi unsubscribe — panggil di cleanup effect.
 *
 * @param profileId  – ID profile yang dimonitor
 * @param channelKey – nama unik channel (mis. "header" / "page")
 * @param onChange   – callback dipanggil saat ada perubahan
 */
export function subscribeNotifications(
  profileId:  string,
  channelKey: string,
  onChange:   () => void
): () => void {
  const channel = supabase
    .channel(`notifications-${channelKey}`)
    .on(
      "postgres_changes",
      {
        event:  "*",
        schema: "public",
        table:  "notifications",
        filter: `user_id=eq.${profileId}`,
      },
      onChange
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
