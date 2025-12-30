import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties (Next.js 15+ requirement)
    const { id: reportId } = await params

    // Get the current user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('auth_user_id', user.id)
      .single()

    const isAdmin = profile?.is_admin || ['admin', 'moderator'].includes(profile?.role)

    // Build query with proper access control
    let query = supabase
      .from('reports')
      .select(`
        id,
        reporter_id,
        reported_user_id,
        reported_content_type,
        reported_content_id,
        report_type,
        title,
        description,
        evidence_url,
        status,
        admin_notes,
        resolved_by,
        resolved_at,
        created_at,
        updated_at,
        reporter:reporter_id(id, username, avatar_url, email),
        reported_user:reported_user_id(id, username, avatar_url, email),
        resolver:resolved_by(id, username)
      `)
      .eq('id', reportId)

    // Apply access control
    if (!isAdmin) {
      query = query.eq('reporter_id', user.id)
    }

    const { data: report, error: queryError } = await query.single()

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Report not found or access denied' },
          { status: 404 }
        )
      }
      console.error('Error fetching report:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      report
    })

  } catch (error) {
    console.error('Error in get report API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties (Next.js 15+ requirement)
    const { id: reportId } = await params
    const body = await request.json()
    const { 
      status, 
      adminNotes, 
      createViolation, 
      violationType, 
      violationReason, 
      violationSeverity = 'low' 
    } = body

    // Get the current user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.is_admin && !['admin', 'moderator'].includes(profile?.role)) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'investigating', 'resolved', 'dismissed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Use the resolve_report function if resolving
    if (status && ['resolved', 'dismissed'].includes(status)) {
      const { error: resolveError } = await supabase.rpc('resolve_report', {
        report_id: reportId,
        new_status: status,
        admin_notes_param: adminNotes || null,
        create_violation: createViolation || false,
        violation_type_param: violationType || null,
        violation_reason: violationReason || null,
        violation_severity: violationSeverity
      })

      if (resolveError) {
        console.error('Error resolving report:', resolveError)
        return NextResponse.json(
          { error: 'Failed to resolve report' },
          { status: 500 }
        )
      }
    } else {
      // Simple status update
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: status || undefined,
          admin_notes: adminNotes || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (updateError) {
        console.error('Error updating report:', updateError)
        return NextResponse.json(
          { error: 'Failed to update report' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully'
    })

  } catch (error) {
    console.error('Error in update report API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
