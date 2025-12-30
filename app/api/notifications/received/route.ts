import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const filter = searchParams.get('filter') || 'all';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build query for received notifications
    let query = supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        message,
        data,
        is_read,
        created_at,
        sender:profiles!notifications_sender_id_fkey (
          id,
          username,
          fullname,
          avatar_url
        )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Apply filters
    if (filter === 'unread') {
      query = query.eq('is_read', false);
    } else if (filter === 'read') {
      query = query.eq('is_read', true);
    } else if (filter === 'game_invites') {
      query = query.eq('type', 'game_invite');
    } else if (filter === 'friend_requests') {
      query = query.eq('type', 'friend_request');
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching received notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { notificationId, action } = await request.json();

    if (!notificationId || !action) {
      return NextResponse.json({ error: 'Notification ID and action are required' }, { status: 400 });
    }

    // Mark notification as read
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (updateError) {
      console.error('Error updating notification:', updateError);
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }

    // Handle specific actions (accept/decline)
    // This can be expanded based on notification type
    if (action === 'accept') {
      // Handle accept logic based on notification type
      // For example: accept friend request, join game, etc.
    } else if (action === 'decline') {
      // Handle decline logic
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
