import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { computeStatsBundle } from '@/lib/statService'

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')

    const stats = await computeStatsBundle(session.user.id, meterId || undefined)
    const dailyAverageUsage =
      stats.window.daysElapsed > 0 ? stats.mtd.usage_kwh / stats.window.daysElapsed : 0

    const expectedUsage = stats.forecast.usage_kwh
    const lowUsage =
      stats.forecast.method === 'actual' ? expectedUsage : Math.max(0, expectedUsage * 0.9)
    const highUsage =
      stats.forecast.method === 'actual' ? expectedUsage : expectedUsage * 1.1

    const prevSamePeriodUsage = round2(
      stats.mtd.usage_kwh - stats.mtd.vs_prev_same_period.delta_kwh
    )

    return NextResponse.json({
      success: true,
      data: {
        timeframeLabels: stats.timeframeLabels,
        forecast: {
          low: round2(lowUsage),
          expected: expectedUsage,
          high: round2(highUsage),
          method: stats.forecast.method
        },
        monthToDate: {
          usage: stats.mtd.usage_kwh,
          cost: stats.mtd.cost_pkr,
          daysElapsed: stats.window.daysElapsed,
          averageDailyUsage: round2(dailyAverageUsage)
        },
        comparison: {
          previousMonthSamePeriodUsage: prevSamePeriodUsage,
          vsPreviousMonthSamePeriodPct: stats.mtd.vs_prev_same_period.pct_kwh
        },
        period: {
          month: stats.window.now.getMonth() + 1,
          year: stats.window.now.getFullYear(),
          daysInMonth: stats.window.daysInMonth,
          meterId: meterId || 'all',
          labels: {
            mtd: stats.timeframeLabels.mtd,
            previousSamePeriod: 'Previous Month (Same Day Cutoff)',
            forecast: stats.timeframeLabels.forecast
          }
        }
      }
    })
  } catch (error) {
    console.error('Error generating usage forecast:', error)
    return NextResponse.json(
      { error: 'Failed to generate usage forecast' },
      { status: 500 }
    )
  }
}
