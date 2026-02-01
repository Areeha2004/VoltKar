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
    
    const [stats, timeSeries] = await Promise.all([
      computeStatsBundle(session.user.id, meterId || undefined),
      getAnalyticsTimeSeries(session.user.id, meterId || undefined)
    ])

    return NextResponse.json({
      success: true,
      data: {
        costs: {
          actualToDateCost: stats.mtd.cost_pkr,
          projectedCost: stats.forecast.cost_pkr,
          averageDailyCost: Math.round((stats.mtd.cost_pkr / stats.window.daysElapsed) * 100) / 100,
          lastMonthCost: stats.prevMonthFull.cost_pkr,
          costPerKwh: stats.mtd.usage_kwh > 0 ? Math.round((stats.mtd.cost_pkr / stats.mtd.usage_kwh) * 100) / 100 : 0,
          projectedCostPerKwh: stats.forecast.usage_kwh > 0 ? Math.round((stats.forecast.cost_pkr / stats.forecast.usage_kwh) * 100) / 100 : 0
        },
        breakdown: {
          weeklyBreakdown: timeSeries.weeklyBreakdown,
          totalUsage: stats.mtd.usage_kwh,
          projectedUsage: stats.forecast.usage_kwh,
          activeDays: stats.window.daysElapsed,
          daysInMonth: stats.window.daysInMonth
        },
        comparison: {
          vsLastMonth: stats.forecast.vs_prev_full.pct_cost,
          difference: stats.forecast.vs_prev_full.delta_cost
        },
        insights: [], // Keep empty for now as requested
        period: {
          month: stats.window.now.getMonth() + 1,
          year: stats.window.now.getFullYear(),
          meterId: meterId || 'all'
        }
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