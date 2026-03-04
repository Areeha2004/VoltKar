import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getAnalyticsTimeSeries, computeStatsBundle } from '@/lib/statService'

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
        timeframeLabels: stats.timeframeLabels,
        mtd: stats.mtd,
        forecast: stats.forecast,
        prevMonthFull: stats.prevMonthFull,
        window: stats.window,
        weeklyBreakdown: timeSeries.weeklyBreakdown,
        dailyUsage: timeSeries.dailyUsage,
        budgetProgress: timeSeries.budgetProgress,
        usage: {
          actualToDateKwh: stats.mtd.usage_kwh,
          projectedKwh: stats.forecast.usage_kwh,
          averageDailyKwh:
            stats.window.daysElapsed > 0 ? Math.round((stats.mtd.usage_kwh / stats.window.daysElapsed) * 100) / 100 : 0
        },
        period: {
          month: stats.window.now.getMonth() + 1,
          year: stats.window.now.getFullYear(),
          labels: {
            mtd: stats.timeframeLabels.mtd,
            previousMonth: stats.timeframeLabels.prevMonthFull,
            forecast: stats.timeframeLabels.forecast
          }
        }
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

