import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Initialize Supabase client for server operations
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

// POST - Leave current group
export async function POST(request: NextRequest) {
  try {
    // Get auth token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current group membership
    const { data: membership, error: membershipError } = await supabaseServer
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id)
      .single();

    if (membershipError) {
      console.error('Error getting membership:', membershipError);
      return NextResponse.json({ error: 'You are not in any group' }, { status: 400 });
    }

    const groupId = membership.group_id;
    const userRole = membership.role;

    // Count remaining members
    const { count: memberCount, error: countError } = await supabaseServer
      .from('group_members')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId);

    if (countError) {
      console.error('Error counting members:', countError);
      return NextResponse.json({ error: 'Failed to process leave request' }, { status: 500 });
    }

    // If user is owner/admin and there are other members, transfer ownership/admin to another member
    if ((userRole === 'owner' || userRole === 'admin') && (memberCount || 0) > 1) {
      const { data: nextMember, error: nextMemberError } = await supabaseServer
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .neq('user_id', user.id)
        .eq('role', 'member')
        .order('joined_at', { ascending: true })
        .limit(1)
        .single();

      if (!nextMemberError && nextMember) {
        // Transfer to admin (or owner if original user was owner)
        const newRole = userRole === 'owner' ? 'owner' : 'admin';
        await supabaseServer
          .from('group_members')
          .update({ role: newRole })
          .eq('id', nextMember.id);
      }
    }

    // Remove user from group
    const { error: leaveError } = await supabaseServer
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (leaveError) {
      console.error('Error leaving group:', leaveError);
      return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
    }

    // If user was the last member, deactivate the group
    if ((memberCount || 0) === 1) {
      await supabaseServer
        .from('groups')
        .update({ is_active: false })
        .eq('id', groupId);
    }

    return NextResponse.json({ 
      message: 'Successfully left group'
    }, { status: 200 });

  } catch (error) {
    console.error('Error in POST /api/groups/leave:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
