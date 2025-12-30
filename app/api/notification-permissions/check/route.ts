import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Check if user has permission to send notification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const senderId = searchParams.get('senderId');
    const receiverId = searchParams.get('receiverId');

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: 'senderId and receiverId required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notification_permissions')
      .select('status')
      .eq('requester_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('status', 'accepted')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      hasPermission: !!data,
      status: data?.status || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Batch check permissions for multiple receivers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverIds } = body;

    if (!senderId || !receiverIds || !Array.isArray(receiverIds)) {
      return NextResponse.json(
        { error: 'senderId and receiverIds array required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notification_permissions')
      .select('receiver_id')
      .eq('requester_id', senderId)
      .in('receiver_id', receiverIds)
      .eq('status', 'accepted');

    if (error) throw error;

    const allowedReceivers = data?.map((d) => d.receiver_id) || [];

    return NextResponse.json({ allowedReceivers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
