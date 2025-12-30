/**
 * Utility functions untuk cleanup notifikasi game invite
 */

import { supabase } from "@/lib/supabase";

/**
 * Cleanup notifikasi game invite untuk session tertentu
 * Digunakan ketika host mengakhiri game session
 */
export async function cleanupGameInviteNotificationsForSession(
  sessionId: string
): Promise<{ success: boolean; error?: string; cleanedCount?: number }> {
  try {
    // Call RPC function untuk cleanup (jika tersedia)
    const { data, error } = await supabase.rpc(
      "cleanup_game_invite_for_session",
      {
        p_session_id: sessionId,
      }
    );

    if (error) {
      console.error("Error calling cleanup RPC:", error);
      // Fallback to manual cleanup
      return await manualCleanupGameInviteNotifications(sessionId);
    }

    return {
      success: true,
      cleanedCount: data || 0,
    };
  } catch (error: any) {
    console.error("Error in cleanupGameInviteNotificationsForSession:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Manual cleanup (fallback jika RPC tidak tersedia)
 */
async function manualCleanupGameInviteNotifications(
  sessionId: string
): Promise<{ success: boolean; error?: string; cleanedCount?: number }> {
  try {
    // Get all profiles with notifications
    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("id, auth_user_id, notifications")
      .not("notifications", "is", null);

    if (fetchError) {
      throw fetchError;
    }

    if (!profiles || profiles.length === 0) {
      return { success: true, cleanedCount: 0 };
    }

    let cleanedCount = 0;

    // Update each profile
    for (const profile of profiles) {
      const notifications = profile.notifications || [];

      // Filter out game invite notifications for this session
      const filteredNotifications = notifications.filter(
        (notif: any) =>
          !(
            notif.type === "game_invite" &&
            notif.data?.session_id === sessionId
          )
      );

      // Update jika ada perubahan
      if (filteredNotifications.length < notifications.length) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            notifications: filteredNotifications,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        if (!updateError) {
          cleanedCount += notifications.length - filteredNotifications.length;
        }
      }
    }

    return {
      success: true,
      cleanedCount,
    };
  } catch (error: any) {
    console.error("Error in manualCleanupGameInviteNotifications:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Cleanup notifikasi game invite untuk user tertentu
 * Berguna untuk cleanup di client side
 */
export async function cleanupGameInviteNotificationsForUser(
  userId: string,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user profile
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, notifications")
      .eq("auth_user_id", userId)
      .single();

    if (fetchError || !profile) {
      throw fetchError || new Error("Profile not found");
    }

    const notifications = profile.notifications || [];

    // Filter out game invite notifications for this session
    const filteredNotifications = notifications.filter(
      (notif: any) =>
        !(notif.type === "game_invite" && notif.data?.session_id === sessionId)
    );

    // Update jika ada perubahan
    if (filteredNotifications.length < notifications.length) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          notifications: filteredNotifications,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (updateError) {
        throw updateError;
      }

      console.log(
        `✅ Cleaned up ${notifications.length - filteredNotifications.length} notification(s) for user ${userId}`
      );
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in cleanupGameInviteNotificationsForUser:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Cleanup semua notifikasi yang sudah kadaluarsa
 */
export async function cleanupExpiredNotifications(): Promise<{
  success: boolean;
  error?: string;
  cleanedCount?: number;
}> {
  try {
    const { data, error } = await supabase.rpc("cleanup_expired_notifications");

    if (error) {
      throw error;
    }

    return {
      success: true,
      cleanedCount: data || 0,
    };
  } catch (error: any) {
    console.error("Error in cleanupExpiredNotifications:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Cleanup semua notifikasi game invite untuk session yang sudah berakhir
 */
export async function cleanupAllEndedSessionNotifications(): Promise<{
  success: boolean;
  error?: string;
  cleanedCount?: number;
}> {
  try {
    const { data, error } = await supabase.rpc(
      "cleanup_all_ended_session_notifications"
    );

    if (error) {
      console.error("Error calling cleanup all RPC:", error);
      // Tidak ada fallback untuk fungsi ini karena kompleks
      throw error;
    }

    return {
      success: true,
      cleanedCount: data || 0,
    };
  } catch (error: any) {
    console.error("Error in cleanupAllEndedSessionNotifications:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update game notification status (started/ended/finished) tanpa delete
 */
export async function updateGameNotificationStatus(
  sessionId: string,
  status: "started" | "ended" | "finished"
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all profiles with game invitations for this session
    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("id, auth_user_id, notifications")
      .not("notifications", "is", null);

    if (fetchError) {
      throw fetchError;
    }

    if (!profiles || profiles.length === 0) {
      return { success: true };
    }

    // Update each profile
    for (const profile of profiles) {
      const notifications = profile.notifications || [];

      // Update game invite notifications for this session
      const updatedNotifications = notifications.map((notif: any) => {
        if (
          (notif.type === "game_invitation" ||
            notif.type === "game_invite" ||
            notif.type === "group_quiz_invitation") &&
          notif.data?.session_id === sessionId
        ) {
          return {
            ...notif,
            data: {
              ...notif.data,
              game_status: status,
            },
            ...((status === "ended" || status === "finished") && {
              scheduled_deletion_at: new Date(
                Date.now() + 60 * 60 * 1000
              ).toISOString(),
            }),
          };
        }
        return notif;
      });

      // Update jika ada perubahan
      if (JSON.stringify(updatedNotifications) !== JSON.stringify(notifications)) {
        await supabase
          .from("profiles")
          .update({
            notifications: updatedNotifications,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);
      }
    }

    console.log(
      `✅ Updated game notification status to "${status}" for session ${sessionId}`
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateGameNotificationStatus:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Cleanup expired game notifications (scheduled_deletion_at sudah lewat)
 */
export async function cleanupExpiredGameNotifications(): Promise<{
  success: boolean;
  error?: string;
  cleanedCount?: number;
}> {
  try {
    const { data, error } = await supabase.rpc(
      "cleanup_expired_game_notifications"
    );

    if (error) {
      console.error("Error calling cleanup expired RPC:", error);
      // Fallback to manual cleanup
      return await manualCleanupExpiredGameNotifications();
    }

    console.log(`✅ Cleaned up ${data || 0} expired game notifications`);

    return {
      success: true,
      cleanedCount: data || 0,
    };
  } catch (error: any) {
    console.error("Error in cleanupExpiredGameNotifications:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Manual cleanup expired game notifications (fallback)
 */
async function manualCleanupExpiredGameNotifications(): Promise<{
  success: boolean;
  error?: string;
  cleanedCount?: number;
}> {
  try {
    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("id, notifications")
      .not("notifications", "is", null);

    if (fetchError) {
      throw fetchError;
    }

    if (!profiles || profiles.length === 0) {
      return { success: true, cleanedCount: 0 };
    }

    let cleanedCount = 0;
    const now = new Date();

    for (const profile of profiles) {
      const notifications = profile.notifications || [];

      // Filter out expired game invitations
      const filteredNotifications = notifications.filter((notif: any) => {
        if (
          (notif.type === "game_invitation" ||
            notif.type === "game_invite" ||
            notif.type === "group_quiz_invitation") &&
          notif.scheduled_deletion_at
        ) {
          const deletionTime = new Date(notif.scheduled_deletion_at);
          if (deletionTime <= now) {
            cleanedCount++;
            return false; // Filter out (delete)
          }
        }
        return true; // Keep
      });

      // Update jika ada perubahan
      if (filteredNotifications.length < notifications.length) {
        await supabase
          .from("profiles")
          .update({
            notifications: filteredNotifications,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);
      }
    }

    console.log(`✅ Manual cleanup: Removed ${cleanedCount} expired notifications`);

    return {
      success: true,
      cleanedCount,
    };
  } catch (error: any) {
    console.error("Error in manualCleanupExpiredGameNotifications:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get current game session status
 */
export async function getGameSessionStatus(
  sessionId: string
): Promise<{ status: string | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("game_sessions")
      .select("status")
      .eq("id", sessionId)
      .single();

    if (error) {
      throw error;
    }

    return { status: data?.status || null };
  } catch (error: any) {
    console.error("Error in getGameSessionStatus:", error);
    return {
      status: null,
      error: error.message,
    };
  }
}

