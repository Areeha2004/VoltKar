import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { computeStatsBundle, getAnalyticsTimeSeries } from '@/lib/statService'

interface PeriodData {
  usage: number
  cost: number
  averageDaily: number
  readingsCount: number
  period: string
}

interface ComparisonResult {
  comparisonType: 'MoM' | 'YoY' | 'Rolling28'
  currentPeriod: PeriodData
  previousPeriod: PeriodData
  percentageChange: {
    usage: number
    cost: number
  }
  absoluteChange: {
    usage: number
    cost: number
  }
  trend: 'increasing' | 'decreasing' | 'stable'
  labels?: {
    current: string
    previous: string
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function percentageChange(current: number, previous: number): number {
  if (previous <= 0) return 0
  return round2(((current - previous) / previous) * 100)
}

function trend(current: number, previous: number): 'increasing' | 'decreasing' | 'stable' {
  const pct = percentageChange(current, previous)
  if (pct > 5) return 'increasing'
  if (pct < -5) return 'decreasing'
  return 'stable'
}

function buildComparison(
  comparisonType: 'MoM' | 'YoY' | 'Rolling28',
  current: PeriodData,
  previous: PeriodData,
  labels?: { current: string; previous: string }
): ComparisonResult {
  return {
    comparisonType,
    currentPeriod: current,
    previousPeriod: previous,
    percentageChange: {
      usage: percentageChange(current.usage, previous.usage),
      cost: percentageChange(current.cost, previous.cost)
    },
    absoluteChange: {
      usage: round2(current.usage - previous.usage),
      cost: round2(current.cost - previous.cost)
    },
    trend: trend(current.usage, previous.usage),
    labels
  }
}

function generateComparisonInsights(comparisons: ComparisonResult[]) {
  const insights: Array<{
    type: 'warning' | 'success' | 'info'
    title: string
    message: string
    priority: 'high' | 'medium' | 'low'
    comparisonType: string
  }> = []

  for (const comp of comparisons) {
    const usagePct = comp.percentageChange.usage
    const costPct = comp.percentageChange.cost

    if (Math.abs(usagePct) >= 15) {
      insights.push({
        type: usagePct > 0 ? 'warning' : 'success',
        title: `${comp.comparisonType} Usage ${usagePct > 0 ? 'Increase' : 'Decrease'}`,
        message: `Usage changed by ${Math.abs(usagePct).toFixed(1)}% between compared periods.`,
        priority: Math.abs(usagePct) > 30 ? 'high' : 'medium',
        comparisonType: comp.comparisonType
      })
    }

    if (Math.abs(costPct) >= 15) {
      insights.push({
        type: costPct > 0 ? 'warning' : 'success',
        title: `${comp.comparisonType} Cost ${costPct > 0 ? 'Increase' : 'Savings'}`,
        message: `Cost changed by ${Math.abs(costPct).toFixed(1)}% between compared periods.`,
        priority: Math.abs(costPct) > 30 ? 'high' : 'medium',
        comparisonType: comp.comparisonType
      })
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Stable Consumption Pattern',
      message: 'No major variance detected across selected comparison windows.',
      priority: 'low',
      comparisonType: 'overall'
    })
  }

  return insights
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const comparisonType = (searchParams.get('type') || 'MoM') as 'MoM' | 'YoY' | 'Rolling28' | 'all'
    const meterId = searchParams.get('meterId')

    const stats = await computeStatsBundle(session.user.id, meterId || undefined)
    const timeSeries = await getAnalyticsTimeSeries(session.user.id, meterId || undefined)

    const prevSameUsage = round2(
      stats.mtd.usage_kwh - stats.mtd.vs_prev_same_period.delta_kwh
    )
    const prevSameCost = round2(
      stats.mtd.cost_pkr - stats.mtd.vs_prev_same_period.delta_cost
    )

    const mom = buildComparison(
      'MoM',
      {
        usage: stats.mtd.usage_kwh,
        cost: stats.mtd.cost_pkr,
        averageDaily: round2(stats.mtd.usage_kwh / Math.max(1, stats.window.daysElapsed)),
        readingsCount: timeSeries.dailyUsage.length,
        period: stats.timeframeLabels.mtd
      },
      {
        usage: prevSameUsage,
        cost: prevSameCost,
        averageDaily: round2(prevSameUsage / Math.max(1, stats.window.daysElapsed)),
        readingsCount: Math.max(0, timeSeries.dailyUsage.length - 1),
        period: 'Previous Month (Same Day Cutoff)'
      },
      {
        current: stats.timeframeLabels.mtd,
        previous: 'Previous Month (Same Day Cutoff)'
      }
    )

    // YoY fallback: until YoY service is added, return same-period MoM numbers with explicit label.
    const yoy = buildComparison(
      'YoY',
      {
        ...mom.currentPeriod,
        period: `${stats.timeframeLabels.mtd} (Current Year)`
      },
      {
        ...mom.previousPeriod,
        period: `${mom.previousPeriod.period} (YoY proxy)`
      },
      {
        current: `${stats.timeframeLabels.mtd} (Current Year)`,
        previous: `${mom.previousPeriod.period} (YoY proxy)`
      }
    )

    const last28 = timeSeries.dailyUsage.slice(-28)
    const previous28 = timeSeries.dailyUsage.slice(
      Math.max(0, timeSeries.dailyUsage.length - 56),
      Math.max(0, timeSeries.dailyUsage.length - 28)
    )

    const rollingCurrentUsage = round2(last28.reduce((s, d) => s + d.usage, 0))
    const rollingCurrentCost = round2(last28.reduce((s, d) => s + d.cost, 0))
    const rollingPreviousUsage =
      previous28.length > 0 ? round2(previous28.reduce((s, d) => s + d.usage, 0)) : prevSameUsage
    const rollingPreviousCost =
      previous28.length > 0 ? round2(previous28.reduce((s, d) => s + d.cost, 0)) : prevSameCost

    const rolling28 = buildComparison(
      'Rolling28',
      {
        usage: rollingCurrentUsage,
        cost: rollingCurrentCost,
        averageDaily: round2(rollingCurrentUsage / Math.max(1, last28.length)),
        readingsCount: last28.length,
        period: 'Last 28 Days'
      },
      {
        usage: rollingPreviousUsage,
        cost: rollingPreviousCost,
        averageDaily: round2(rollingPreviousUsage / Math.max(1, previous28.length || 28)),
        readingsCount: previous28.length || 28,
        period: previous28.length > 0 ? 'Previous 28 Days' : 'Previous Month (Same Day Cutoff)'
      },
      {
        current: 'Last 28 Days',
        previous: previous28.length > 0 ? 'Previous 28 Days' : 'Previous Month (Same Day Cutoff)'
      }
    )

    const comparisons =
      comparisonType === 'all'
        ? [mom, yoy, rolling28]
        : comparisonType === 'YoY'
          ? yoy
          : comparisonType === 'Rolling28'
            ? rolling28
            : mom

    const comparisonList = Array.isArray(comparisons) ? comparisons : [comparisons]
    const insights = generateComparisonInsights(comparisonList)

    return NextResponse.json({
      success: true,
      data: {
        timeframeLabels: stats.timeframeLabels,
        comparisons,
        insights,
        metadata: {
          generatedAt: new Date().toISOString(),
          meterId: meterId || 'all',
          comparisonType,
          notes: ['MoM uses MTD vs previous month same-day cutoff from unified stats service.']
        }
      }
    })
  } catch (error) {
    console.error('Error fetching comparison analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comparison analytics' },
      { status: 500 }
    )
  }
}
