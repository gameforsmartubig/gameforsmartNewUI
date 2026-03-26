"use client";

import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface UsePushNotificationReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | "default";
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export function usePushNotification(userId: string | null): UsePushNotificationReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "default">("default");

  // Check support and existing subscription on mount
  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      setPermission(Notification.permission);

      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        // Check existing subscription
        const existingSub = await registration.pushManager.getSubscription();
        setIsSubscribed(!!existingSub);
      } catch (err) {
        console.error("Service worker registration error:", err);
      }

      setIsLoading(false);
    };

    checkSupport();
  }, []);

  // Auto-subscribe when user logs in and has granted permission
  useEffect(() => {
    if (!userId || !isSupported || isLoading) return;
    if (Notification.permission === "granted" && !isSubscribed) {
      subscribe();
    }
  }, [userId, isSupported, isLoading]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !userId) return false;

    try {
      setIsLoading(true);

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey as any,
      });

      const subJson = subscription.toJSON();

      // Send subscription to server
      const response = await fetch("/api/push-notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subscription: {
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          },
          userAgent: navigator.userAgent,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubscribed(true);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (err) {
      console.error("Push subscription error:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, userId]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  };
}
