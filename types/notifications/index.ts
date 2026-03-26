// ============================================================
// notifications/_types/index.ts
// Domain types untuk sistem notifikasi.
// Dipakai oleh header bell, halaman notifikasi,
// dan fitur lain yang perlu membaca/mengaksi notifikasi.
// ============================================================

export type NotificationType = "sessionGroup" | "sessionFriend" | "group" | "admin";
export type NotificationStatus = "accepted" | "declined" | null;

/** Shape yang dikembalikan dari enrichNotifications() */
export interface Notification {
  id: string;
  user_id: string;
  /** Nama aktor (sudah di-resolve dari profiles) */
  actor_id: string;
  type: NotificationType;
  entity_type: string | null;
  /**
   * Untuk type session*: { name, code, application }
   * Untuk type lain: string asli entity_id
   */
  entity_id: SessionEntity | string | null;
  /**
   * Untuk type group:    { name: string }
   * Untuk sessionGroup:  string nama grup
   * Untuk lain:          string raw id
   */
  from_group_id: GroupEntity | string | null;
  /** Raw group id sebelum di-enrich (dibutuhkan handleAction) */
  raw_from_group_id: string | null;
  status: NotificationStatus;
  content: AdminContent | null;
  is_read: boolean;
  /** Flag sementara — sudah dibaca dalam sesi ini tapi belum di-sync */
  read_in_session?: boolean;
  created_at: string;
}

export interface SessionEntity {
  name: string;
  code: string;
  application: string;
}

export interface GroupEntity {
  name: string;
}

export interface AdminContent {
  title?: string;
  message?: string;
}

/** Payload untuk handleAction */
export interface ActionPayload {
  notificationId: string;
  type: NotificationType;
  status: "accepted" | "declined";
  /** Untuk type group */
  raw_from_group_id?: string | null;
  /** Untuk type session */
  entity_id?: SessionEntity | string | null;
}
