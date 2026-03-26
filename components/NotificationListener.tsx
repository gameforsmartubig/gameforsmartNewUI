"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { usePushNotification } from "@/hooks/usePushNotification";
import { toast } from "sonner";

/**
 * Component that listens for new notifications via Supabase Realtime
 * and manages push notification subscription.
 * Should be placed in the auth layout.
 */
export function NotificationListener() {
  const { profileId } = useAuth();
  const { isSupported, isSubscribed, subscribe, permission } = usePushNotification(profileId);
  const hasAskedPermission = useRef(false);

  // Ask for notification permission on first visit (once per session)
  useEffect(() => {
    if (
      !profileId ||
      !isSupported ||
      isSubscribed ||
      hasAskedPermission.current ||
      permission === "denied"
    ) {
      return;
    }

    // Only ask if permission is "default" (not yet decided)
    if (permission === "default") {
      hasAskedPermission.current = true;
      // Small delay to not interrupt initial page load
      const timer = setTimeout(() => {
        subscribe();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profileId, isSupported, isSubscribed, permission, subscribe]);

  // Subscribe to Supabase Realtime for new notifications
  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profileId}`,
        },
        (payload) => {
          const notification = payload.new as any;
          const content = notification.content || {};

          // Show in-app toast notification
          toast(content.title || "Notifikasi baru", {
            description: content.body || content.message || "",
            action: content.url
              ? {
                  label: "Lihat",
                  onClick: () => {
                    window.location.href = content.url;
                  },
                }
              : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  // This component doesn't render anything visible
  return null;
}
