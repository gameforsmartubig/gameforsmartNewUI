"use server";

import { createClient } from "@/lib/supabase-server";
import webpush from "web-push";

// Configure VAPID for server-side push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:gameforsmartubig@gmail.com",
  process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export async function createNotification(notification: any) {
  try {
    const supabase = await createClient();

    // Handle both single notification and array of notifications
    const isArray = Array.isArray(notification);
    const notifications = isArray ? notification : [notification];

    const { error } = await supabase.from("notifications").insert(notification);

    if (error) {
      console.error("Supabase notification insert error:", error);
      throw new Error(error.message);
    }

    // Send push notification to each user in background
    for (const notif of notifications) {
      sendPushToUser(notif).catch((err) =>
        console.error("Push notification failed:", err)
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

// Build push payload from notification data
function buildPushPayload(notif: any): { title: string; body: string; url: string } {
  // If content has title/body, use those
  if (notif.content?.title) {
    return {
      title: notif.content.title,
      body: notif.content.body || notif.content.message || "",
      url: notif.content.url || "/notifications",
    };
  }

  // Generate payload based on notification type
  switch (notif.type) {
    case "sessionFriend":
      return {
        title: "Game Invitation",
        body: `${notif.content.sender_name} has invited you to join a game session!`,
        url: "/notifications",
      };
    case "sessionGroup":
      return {
        title: "Game Invitation",
        body: `${notif.content.sender_name} has invited you to join a game session from group ${notif.content.group_name}!`,
        url: "/notifications",
      };
    case "group":
      return {
        title: "Group Invitation",
        body: `${notif.content.sender_name} has invited you to join a group ${notif.content.group_name}!`,
        url: "/notifications",
      };
    case "friend_request":
      return {
        title: "Friend Request 👋",
        body: "Someone sent you a friend request!",
        url: "/notifications",
      };
    default:
      return {
        title: "GameForSmart",
        body: "You have a new notification",
        url: "/notifications",
      };
  }
}

async function sendPushToUser(notif: any) {
  const userId = notif.user_id;
  if (!userId) return;

  try {
    const supabase = await createClient();

    // Get all push subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error || !subscriptions || subscriptions.length === 0) return;

    const pushData = buildPushPayload(notif);

    const payload = JSON.stringify({
      title: pushData.title,
      body: pushData.body,
      icon: "/logo.png",
      data: {
        type: notif.type,
        url: pushData.url,
        entityId: notif.entity_id,
      },
    });

    // Send to all subscriptions
    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          console.log(`✅ Push sent to user ${userId}`);
        } catch (err: any) {
          // Remove expired/invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          console.error(`Push to ${sub.endpoint.slice(0, 50)}... failed:`, err.statusCode || err.message);
        }
      })
    );
  } catch (err) {
    console.error("sendPushToUser error:", err);
  }
}

