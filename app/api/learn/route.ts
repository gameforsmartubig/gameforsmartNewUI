import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quiz_id, total_time_minutes, question_limit } = body;

    if (!quiz_id) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    // Get profile ID from auth user ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Create new learn session with profile ID (XID)
    const { data: learnSession, error } = await supabase
      .from('learn_sessions')
      .insert({
        quiz_id,
        user_id: profile.id, // Use profile ID (XID) instead of auth user ID (UUID)
        total_time_minutes: total_time_minutes || 10,
        question_limit: question_limit || 'all',
        status: 'waiting'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating learn session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session: learnSession });
  } catch (error) {
    console.error('Error in learn session creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get profile ID from auth user ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // ✅ Get learn session details with JSONB optimized query
    const { data: learnSession, error } = await supabase
      .from('learn_sessions')
      .select(`
        *,
        quizzes (
          id,
          title,
          description,
          questions
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', profile.id) // Use profile ID (XID) instead of auth user ID (UUID)
      .single();

    if (error) {
      console.error('Error fetching learn session:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ session: learnSession });
  } catch (error) {
    console.error('Error in learn session fetch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

