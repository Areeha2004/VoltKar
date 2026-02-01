import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getAnalyticsTimeSeries, computeStatsBundle } from '@/lib/statService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')

    const [timeSeries, stats] = await Promise.all([
      getAnalyticsTimeSeries(session.user.id, meterId || undefined),
      computeStatsBundle(session.user.id, meterId || undefined)
    ])

    return NextResponse.json({
      success: true,
      data: {
        monthToDateUsage: stats.mtd.usage_kwh,
        monthToDateCost: stats.mtd.cost_pkr,
        averageDailyUsage: Math.round((stats.mtd.usage_kwh / stats.window.daysElapsed) * 100) / 100,
        weeklyBreakdown: timeSeries.weeklyBreakdown,
        dailyUsage: timeSeries.dailyUsage,
        budgetProgress: timeSeries.budgetProgress,
        window: stats.window
      }
    })

  } catch (error) {
    console.error('Error fetching usage analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage analytics' },
      { status: 500 }
    )
  }
}