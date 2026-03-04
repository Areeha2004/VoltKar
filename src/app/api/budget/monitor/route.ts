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
    const budgetOverride = searchParams.get('budget')

    const stats = await computeStatsBundle(session.user.id, meterId || undefined)

    const parsedOverride = budgetOverride ? Number(budgetOverride) : null
    const effectiveBudget =
      Number.isFinite(parsedOverride) && (parsedOverride as number) > 0
        ? (parsedOverride as number)
        : stats.budget.monthly_budget_pkr

    const spent = stats.mtd.cost_pkr
    const projected = stats.forecast.cost_pkr
    const daysElapsed = stats.window.daysElapsed
    const daysInMonth = stats.window.daysInMonth
    const daysLeft = Math.max(0, daysInMonth - daysElapsed)
    const averageDailyCost = daysElapsed > 0 ? spent / daysElapsed : 0

    const budgetTarget = effectiveBudget || 0
    const dailyBudget = budgetTarget > 0 ? budgetTarget / daysInMonth : 0
    const remainingBudget = budgetTarget > 0 ? Math.max(0, budgetTarget - spent) : 0
    const remainingDaily = daysLeft > 0 ? remainingBudget / daysLeft : 0
    const costEfficiency =
      budgetTarget > 0 ? Math.max(0, Math.min(100, 100 - (projected / budgetTarget - 1) * 100)) : 0

    const alerts: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical'
      title: string
      message: string
      actions?: Array<{ label: string; href: string }>
    }> = []

    if (!budgetTarget) {
      alerts.push({
        severity: 'low',
        title: 'No Budget Set',
        message: 'Set a monthly budget to enable budget monitoring and alerts.',
        actions: [{ label: 'Set Budget', href: '/dashboard' }]
      })
    } else if (projected > budgetTarget) {
      const overrun = round2(projected - budgetTarget)
      alerts.push({
        severity: overrun > budgetTarget * 0.2 ? 'critical' : 'high',
        title: 'Forecast Over Budget',
        message: `Projected month-end bill exceeds budget by Rs ${overrun.toLocaleString()}.`,
        actions: [
          { label: 'Open Optimization', href: '/optimization' },
          { label: 'Open AI Insights', href: '/analytics' }
        ]
      })
    } else if (spent > budgetTarget * 0.85) {
      alerts.push({
        severity: 'medium',
        title: 'High Budget Utilization',
        message: 'More than 85% of budget is already used this month.'
      })
    }

    const adjustments = budgetTarget
      ? {
          recommendedBudget: round2(Math.max(spent, projected) * 1.05),
          adjustmentReason:
            projected > budgetTarget
              ? 'Current usage trend projects an overrun.'
              : 'Current usage trend is within target.',
          alternatives: [
            {
              budget: round2(Math.max(spent, projected) * 0.95),
              description: 'Aggressive savings target'
            },
            {
              budget: round2(Math.max(spent, projected) * 1.1),
              description: 'Conservative realistic target'
            }
          ]
        }
      : null

    const recommendations: string[] = []
    if (!budgetTarget) {
      recommendations.push('Set a monthly budget to track spending against a target.')
    } else {
      if (projected > budgetTarget) {
        const dailyReduction = daysLeft > 0 ? (projected - budgetTarget) / daysLeft : 0
        recommendations.push(
          `Reduce daily spending by about Rs ${Math.round(dailyReduction)} to recover budget.`
        )
        recommendations.push('Open Optimization to get prioritized device-level savings actions.')
        recommendations.push('Open Analytics AI Insights for behavior and timing recommendations.')
      }
      if (averageDailyCost > dailyBudget && dailyBudget > 0) {
        recommendations.push('Your daily average is above budget pace; reduce peak-hour usage.')
      }
      if (recommendations.length === 0) {
        recommendations.push('You are on track. Keep current usage pattern.')
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        timeframeLabels: stats.timeframeLabels,
        budget: {
          target: budgetTarget,
          spent: round2(spent),
          remaining: round2(remainingBudget),
          projected: round2(projected),
          efficiency: round2(costEfficiency),
          grade:
            costEfficiency >= 85 ? 'A' : costEfficiency >= 70 ? 'B' : costEfficiency >= 55 ? 'C' : 'D'
        },
        daily: {
          target: round2(dailyBudget),
          average: round2(averageDailyCost),
          remaining: round2(remainingDaily),
          daysLeft
        },
        alerts,
        adjustments,
        recommendations,
        period: {
          month: stats.window.now.getMonth() + 1,
          year: stats.window.now.getFullYear(),
          daysElapsed,
          daysInMonth,
          meterId: meterId || 'all',
          labels: {
            mtd: stats.timeframeLabels.mtd,
            forecast: stats.timeframeLabels.forecast
          }
        }
      }
    })
  } catch (error) {
    console.error('Error monitoring budget:', error)
    return NextResponse.json(
      { error: 'Failed to monitor budget' },
      { status: 500 }
    )
  }
}
