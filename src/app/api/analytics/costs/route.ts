import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
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
        timeframeLabels: stats.timeframeLabels,
        mtd: stats.mtd,
        forecast: stats.forecast,
        prevMonthFull: stats.prevMonthFull,
        window: stats.window,
        comparison: stats.forecast.vs_prev_full,
        weeklyBreakdown: timeSeries.weeklyBreakdown,
        dailyUsage: timeSeries.dailyUsage,
        costs: {
          actualToDateCost: stats.mtd.cost_pkr,
          projectedCost: stats.forecast.cost_pkr,
          averageDailyCost:
            stats.window.daysElapsed > 0 ? Math.round((stats.mtd.cost_pkr / stats.window.daysElapsed) * 100) / 100 : 0
        },
        period: {
          from: stats.window.monthStart.toISOString().split('T')[0],
          to: stats.window.now.toISOString().split('T')[0],
          month: stats.window.now.getMonth() + 1,
          year: stats.window.now.getFullYear(),
          labels: {
            mtd: stats.timeframeLabels.mtd,
            previousMonth: stats.timeframeLabels.prevMonthFull,
            forecast: stats.timeframeLabels.forecast
          }
        },
        insights: [
          {
            type: stats.forecast.vs_prev_full.pct_cost > 0 ? 'warning' : 'success',
            title: 'Forecast vs Last Month',
            message:
              stats.forecast.vs_prev_full.pct_cost > 0
                ? `Forecast is ${stats.forecast.vs_prev_full.pct_cost}% above last month full cost.`
                : `Forecast is ${Math.abs(stats.forecast.vs_prev_full.pct_cost)}% below last month full cost.`
          }
        ]
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

