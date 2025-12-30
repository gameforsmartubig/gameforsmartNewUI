import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get report categories
    const { data: categories, error } = await supabase
      .from('report_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching report categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch report categories' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      categories: categories || []
    })

  } catch (error) {
    console.error('Error in get report categories API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
