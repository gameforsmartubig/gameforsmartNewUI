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

    const { data: insertedRows, error } = await supabase
      .from("notifications")
      .insert(notification)
      .select("id, user_id, actor_id, type, entity_type, entity_id, from_group_id, content");

    if (error) {
      console.error("Supabase notification insert error:", error);
      throw new Error(error.message);
    }

    // Send push notification using inserted rows (which have DB-generated IDs)
    const rowsToSend = insertedRows || notifications;
    for (const notif of rowsToSend) {
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

// ── Resolve session URL (matching notificationService.ts logic) ──
function resolveSessionUrl(
  code: string,
  application: string
): { url: string; openInNewTab: boolean } {
  const app = (application || "").toLowerCase().trim();
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
    case "nitroquiz":
      return { url: `https://nitroquiz.gameforsmart.com/join/${code}`, openInNewTab: true };
    default:
      return { url: `https://app.gameforsmart.com/join/${code}`, openInNewTab: false };
  }
}

// ── Enrich & build push payload matching NotificationItem templates ──
async function buildPushPayload(notif: any): Promise<{
  title: string;
  body: string;
  url: string;
  actions: { action: string; title: string }[];
  notifId: string;
  notifType: string;
  entityId: string | null;
  groupId: string | null;
  sessionCode: string | null;
  sessionApp: string | null;
}> {
  const supabase = await createClient();

  // Default result
  const result = {
    title: "GameForSmart",
    body: "You have a new notification",
    url: "/notifications",
    actions: [] as { action: string; title: string }[],
    notifId: notif.id || "",
    notifType: notif.type || "",
    entityId: notif.entity_id || null,
    groupId: notif.from_group_id || null,
    sessionCode: null as string | null,
    sessionApp: null as string | null,
  };

  // If content has title/body, use those directly
  if (notif.content?.title) {
    result.title = notif.content.title;
    result.body = notif.content.body || notif.content.message || "";
    result.url = notif.content.url || "/notifications";
    return result;
  }

  // ── Fetch actor name ──
  let actorName = "Someone";
  if (notif.actor_id) {
    const { data: actor } = await supabase
      .from("profiles")
      .select("nickname, fullname, username")
      .eq("id", notif.actor_id)
      .single();
    if (actor) {
      actorName = actor.nickname || actor.fullname || actor.username || "Someone";
    }
  }

  // ── Build per notification type (matching NotificationItem.tsx) ──
  switch (notif.type) {
    case "sessionFriend": {
      // Fetch session info
      let sessionName = "a game session";
      let sessionApp = "";
      if (notif.entity_id) {
        const { data: session } = await supabase
          .from("game_sessions")
          .select("game_pin, application, quizzes!game_sessions_quiz_id_fkey(title)")
          .eq("id", notif.entity_id)
          .single();
        if (session) {
          const quizData = (session as any).quizzes;
          const title = Array.isArray(quizData) ? quizData[0]?.title : quizData?.title;
          sessionName = title || "a game session";
          sessionApp = session.application || "";
          result.sessionCode = session.game_pin || null;
          result.sessionApp = sessionApp;

          if (session.game_pin) {
            const resolved = resolveSessionUrl(session.game_pin, sessionApp);
            result.url = resolved.url;
          }
        }
      }

      result.title = `Game Invitation 🎮`;
      result.body = `${actorName} invite you to join session "${sessionName}"`;
      result.actions = [
        { action: "accept", title: "✅ Accept" },
        { action: "decline", title: "❌ Decline" },
      ];
      break;
    }

    case "sessionGroup": {
      // Fetch group name
      let groupName = "a group";
      if (notif.from_group_id) {
        const { data: group } = await supabase
          .from("groups")
          .select("name")
          .eq("id", notif.from_group_id)
          .single();
        if (group) groupName = group.name;
      }

      // Fetch session info
      let sessionName = "a game session";
      let sessionApp = "";
      if (notif.entity_id) {
        const { data: session } = await supabase
          .from("game_sessions")
          .select("game_pin, application, quizzes!game_sessions_quiz_id_fkey(title)")
          .eq("id", notif.entity_id)
          .single();
        if (session) {
          const quizData = (session as any).quizzes;
          const title = Array.isArray(quizData) ? quizData[0]?.title : quizData?.title;
          sessionName = title || "a game session";
          sessionApp = session.application || "";
          result.sessionCode = session.game_pin || null;
          result.sessionApp = sessionApp;

          if (session.game_pin) {
            const resolved = resolveSessionUrl(session.game_pin, sessionApp);
            result.url = resolved.url;
          }
        }
      }

      result.title = `Game Invitation 🎮`;
      result.body = `${actorName} from group ${groupName} invite you to join session "${sessionName}"`;
      result.actions = [
        { action: "accept", title: "✅ Accept" },
        { action: "decline", title: "❌ Decline" },
      ];
      break;
    }

    case "group": {
      let groupName = "a group";
      if (notif.from_group_id) {
        const { data: group } = await supabase
          .from("groups")
          .select("name")
          .eq("id", notif.from_group_id)
          .single();
        if (group) groupName = group.name;
      }

      result.title = `Group Invitation 👥`;
      result.body = `${actorName} invite you to join group "${groupName}"`;
      result.url = "/notifications";
      // result.actions = [
      //   { action: "accept", title: "✅ Accept" },
      //   { action: "decline", title: "❌ Decline" },
      // ];
      break;
    }

    case "friend_request": {
      result.title = `Friend Request 👋`;
      result.body = `${actorName} sent you a friend request!`;
      result.url = "/notifications";
      break;
    }

    case "admin": {
      result.title = notif.content?.title || "System Notification";
      result.body = notif.content?.message || "";
      result.url = "/notifications";
      break;
    }

    default: {
      result.title = "GameForSmart";
      result.body = "You have a new notification";
      result.url = "/notifications";
    }
  }

  return result;
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

    const pushData = await buildPushPayload(notif);

    const payload = JSON.stringify({
      title: pushData.title,
      body: pushData.body,
      icon: "/logo.png",
      tag: `notif-${pushData.notifType}-${pushData.notifId || Date.now()}`,
      actions: pushData.actions,
      data: {
        type: pushData.notifType,
        url: pushData.url,
        notifId: pushData.notifId,
        entityId: pushData.entityId,
        groupId: pushData.groupId,
        sessionCode: pushData.sessionCode,
        sessionApp: pushData.sessionApp,
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

