import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:gameforsmartubig@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  vibrate?: number[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, payload, data } = body;

    if (!userIds || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No target users specified' },
        { status: 400 }
      );
    }

    // Get push subscriptions for target users
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      // No subscriptions found, just add in-app notifications
      await addInAppNotifications(userIds, payload, data);
      return NextResponse.json({
        success: true,
        message: 'No push subscriptions, added in-app notifications only',
        stats: { total: 0, success: 0, failed: 0 }
      });
    }

    // Prepare notification payload
    const notificationPayload: PushPayload = {
      title: payload.title || 'GameForSmart',
      body: payload.body || 'You have a new notification',
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      data: { ...data, ...payload.data },
      vibrate: payload.vibrate || [200, 100, 200],
    };

    // Send push notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(notificationPayload)
          );
          return { success: true, userId: sub.user_id };
        } catch (error: any) {
          // Remove expired subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
          return { success: false, userId: sub.user_id, error: error.message };
        }
      })
    );

    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failedCount = results.length - successCount;

    // Add in-app notifications
    await addInAppNotifications(userIds, payload, data);

    return NextResponse.json({
      success: true,
      message: `Push sent: ${successCount} success, ${failedCount} failed`,
      stats: {
        total: subscriptions.length,
        success: successCount,
        failed: failedCount,
      },
    });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function addInAppNotifications(
  userIds: string[],
  payload: any,
  data: any
) {
  for (const userId of userIds) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', userId)
        .single();

      if (profile) {
        const currentNotifications = profile.notifications || [];
        const newNotification = {
          id: crypto.randomUUID(),
          type: data?.type || 'custom',
          title: payload.title,
          message: payload.body,
          is_read: false,
          created_at: new Date().toISOString(),
          data: data || {},
        };

        const updatedNotifications = [
          newNotification,
          ...currentNotifications,
        ].slice(0, 50);

        await supabase
          .from('profiles')
          .update({ notifications: updatedNotifications })
          .eq('id', userId);
      }
    } catch (error) {
      console.error(`Failed to add in-app notification for ${userId}:`, error);
    }
  }
}
