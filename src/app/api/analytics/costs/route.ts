import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { computeStatsBundle, getAnalyticsTimeSeries } from '@/lib/statService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    
    const stats = await computeStatsBundle(session.user.id, meterId || undefined)
    const timeSeries = await getAnalyticsTimeSeries(session.user.id, meterId || undefined)

    return NextResponse.json({
      success: true,
      data: {
        mtd: stats.mtd,
        forecast: stats.forecast,
        prevMonthFull: stats.prevMonthFull,
        window: stats.window,
        comparison: stats.forecast.vs_prev_full,
        weeklyBreakdown: timeSeries.weeklyBreakdown,
        dailyUsage: timeSeries.dailyUsage
      }
    })

  } catch (error) {
    console.error('Error fetching cost analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost analytics' },
      { status: 500 }
    )
  }
}
