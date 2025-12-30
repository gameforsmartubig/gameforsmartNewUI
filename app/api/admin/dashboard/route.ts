import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { detectSuspiciousActivity } from '@/lib/security-validation'

export async function GET(request: NextRequest) {
  try {
    // Security check for suspicious activity
      const suspiciousCheck = detectSuspiciousActivity(request)
      if (suspiciousCheck.isSuspicious) {
        console.warn('Suspicious admin dashboard access attempt:', {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent'),
          reasons: suspiciousCheck.reasons
        })
      }

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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'moderator'].includes(profile?.role)) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    // Get dashboard statistics
    const [
      { data: pendingReports },
      { data: totalReports },
      { data: totalUsers },
      { data: activeViolations },
      { data: recentReports },
      { data: reportsByType },
      { data: reportsByStatus }
    ] = await Promise.all([
      // Pending reports count
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Total reports count
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true }),

      // Total users count
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),

      // Active violations count from JSONB violations in profiles
      supabase
        .from('profiles')
        .select('violations')
        .not('violations', 'eq', '[]'),

      // Recent reports (last 5)
      supabase
        .from('reports')
        .select(`
          id,
          title,
          report_type,
          status,
          created_at,
          reporter:reporter_id(username),
          reported_user:reported_user_id(username)
        `)
        .order('created_at', { ascending: false })
        .limit(5),

      // Reports by type
      supabase
        .from('reports')
        .select('report_type')
        .not('report_type', 'is', null),

      // Reports by status
      supabase
        .from('reports')
        .select('status')
        .not('status', 'is', null)
    ])

    // Process reports by type
    const reportTypeStats = (reportsByType || []).reduce((acc: Record<string, number>, report: any) => {
      acc[report.report_type] = (acc[report.report_type] || 0) + 1
      return acc
    }, {})

    // Process reports by status
    const reportStatusStats = (reportsByStatus || []).reduce((acc: Record<string, number>, report: any) => {
      acc[report.status] = (acc[report.status] || 0) + 1
      return acc
    }, {})

    // Count active violations from JSONB data
    let activeViolationsCount = 0;
    if (activeViolations) {
      activeViolationsCount = activeViolations.reduce((count: number, profile: any) => {
        const violations = profile.violations || [];
        const activeViols = violations.filter((v: any) => 
          !v.expires_at || new Date(v.expires_at) > new Date()
        );
        return count + activeViols.length;
      }, 0);
    }

    return NextResponse.json({
      success: true,
      stats: {
        pendingReports: pendingReports?.length || 0,
        totalReports: totalReports?.length || 0,
        totalUsers: totalUsers?.length || 0,
        activeViolations: activeViolationsCount
      },
      recentReports: recentReports || [],
      charts: {
        reportsByType: Object.entries(reportTypeStats).map(([type, count]) => ({
          type,
          count
        })),
        reportsByStatus: Object.entries(reportStatusStats).map(([status, count]) => ({
          status,
          count
        }))
      }
    })

  } catch (error) {
    console.error('Error in admin dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
