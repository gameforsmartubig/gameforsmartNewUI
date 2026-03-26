import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:gameforsmartubig@gmail.com',
  process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Use service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userIds, payload, data } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No user IDs provided' }, { status: 400 });
    }

    // Get push subscriptions for the target users
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return NextResponse.json({ success: false, error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No subscriptions found' });
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: payload?.title || 'GameForSmart',
      body: payload?.body || '',
      icon: payload?.icon || '/gameforsmartlogo.png',
      data: data || {},
    });

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
          await webpush.sendNotification(pushSubscription, notificationPayload);
          return { success: true, userId: sub.user_id };
        } catch (err: any) {
          // If subscription is expired or invalid (410 Gone), remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`Removing expired subscription for user ${sub.user_id}`);
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
          return { success: false, userId: sub.user_id, error: err.message };
        }
      })
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as any).success
    ).length;

    return NextResponse.json({ success: true, sent, total: subscriptions.length });
  } catch (error: any) {
    console.error('Push notification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
