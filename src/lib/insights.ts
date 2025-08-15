/**
 * Insights Service - Generate actionable insights from usage data
 * Reuses existing analytics and tariff engine logic
 */

import { Reading, MonthlyBreakdown } from '../lib/analytics'
import { tariffEngine, getCurrentSlab, DEFAULT_TARIFF } from '../lib/tariffEngine'

export interface UsageInsight {
  id: string
  type: 'warning' | 'success' | 'info' | 'tip'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  impact?: string
  actionable?: boolean
  category: 'cost' | 'usage' | 'efficiency' | 'budget'
}

export interface PeakUsageDay {
  date: string
  usage: number
  cost: number
  dayOfWeek: string
}

export interface BudgetStatus {
  targetKwh?: number
  currentUsage: number
  percentageUsed: number
  daysRemaining: number
  onTrack: boolean
  projectedOverage?: number
}

/** Local helpers */
function getDaysInMonthByDate(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

const efficiencyTips: Array<Pick<UsageInsight, 'id' | 'title' | 'message'>> = [
  {
    id: 'tip-ac',
    title: 'AC Optimization',
    message: 'Set your AC to 26°C instead of 22°C to save up to 20% on cooling costs.'
  },
  {
    id: 'tip-lighting',
    title: 'Smart Lighting',
    message: 'Switch to LED bulbs and use daylight sensors to reduce lighting costs by ~15%.'
  },
  {
    id: 'tip-appliances',
    title: 'Appliance Scheduling',
    message: 'Run high-power appliances during off-peak hours to optimize your electricity costs.'
  }
]

/**
 * Detect peak usage days in current month
 */
export function detectPeakUsageDays(readings: Reading[], topN: number = 3): PeakUsageDay[] {
  if (!readings || readings.length === 0) return []

  const dailyUsage = new Map<string, { usage: number; cost: number }>()

  readings.forEach(reading => {
    const date = new Date(reading.date)
    const dateKey = date.toISOString().split('T')[0]
    const existing = dailyUsage.get(dateKey) || { usage: 0, cost: 0 }

    dailyUsage.set(dateKey, {
      usage: existing.usage + (reading.usage || 0),
      cost: existing.cost + (reading.estimatedCost || 0)
    })
  })

  const peakDays = Array.from(dailyUsage.entries())
    .map(([dateStr, data]) => {
      const date = new Date(dateStr)
      return {
        date: dateStr,
        usage: data.usage,
        cost: data.cost,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' })
      }
    })
    .sort((a, b) => b.usage - a.usage)
    .slice(0, topN)

  return peakDays
}

/**
 * Check budget status against target (projection-based)
 */
export function checkBudgetStatus(
  currentUsage: number,
  targetKwh?: number,
  daysElapsed: number = 1,
  daysInMonth: number = 30
): BudgetStatus {
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 0)
  const projectedUsage = daysElapsed > 0 ? (currentUsage / daysElapsed) * daysInMonth : currentUsage

  if (!targetKwh) {
    return {
      currentUsage,
      percentageUsed: 0,
      daysRemaining,
      onTrack: true
    }
  }

  const percentageUsed = (currentUsage / targetKwh) * 100
  const onTrack = projectedUsage <= targetKwh
  const projectedOverageRaw = projectedUsage - targetKwh
  const projectedOverage =
    onTrack || projectedOverageRaw <= 0 ? undefined : Math.round(projectedOverageRaw * 100) / 100

  return {
    targetKwh,
    currentUsage,
    percentageUsed: Math.round(percentageUsed * 100) / 100,
    daysRemaining,
    onTrack,
    projectedOverage
  }
}

/**
 * Generate usage insights from readings and breakdown
 */
export function generateUsageInsights(
  breakdown: MonthlyBreakdown,
  readings: Reading[],
  targetKwh?: number
): UsageInsight[] {
  const insights: UsageInsight[] = []
  const now = new Date()
  const daysInMonth = getDaysInMonthByDate(now)

  // --- Budget insights ---
  if (!targetKwh) {
    insights.push({
      id: 'set-budget-tip',
      type: 'tip',
      title: 'Set Your Monthly Budget',
      message: 'Set a monthly energy usage target to track spending and avoid bill shocks.',
      priority: 'low',
      actionable: true,
      category: 'budget'
    })
  } else {
    const budgetStatus = checkBudgetStatus(
      breakdown.monthToDateUsage,
      targetKwh,
      breakdown.daysElapsed,
      daysInMonth
    )

    if (!budgetStatus.onTrack && budgetStatus.projectedOverage) {
      insights.push({
        id: 'budget-warning',
        type: 'warning',
        title: 'Budget Alert',
        message: `You’re projected to exceed your ${targetKwh} kWh target by ${budgetStatus.projectedOverage} kWh this month.`,
        priority: 'high',
        impact: `Potential extra cost: Rs ${Math.round(tariffEngine(budgetStatus.projectedOverage).totalCost)}`,
        actionable: true,
        category: 'budget'
      })
    } else if (budgetStatus.percentageUsed >= 80) {
      insights.push({
        id: 'budget-caution',
        type: 'warning',
        title: 'Approaching Budget Limit',
        message: `You’ve used ${budgetStatus.percentageUsed}% of your budget with ${budgetStatus.daysRemaining} days remaining.`,
        priority: 'medium',
        actionable: true,
        category: 'budget'
      })
    } else if (budgetStatus.onTrack) {
      // Always add a positive signal when on track
      insights.push({
        id: 'budget-success',
        type: 'success',
        title: 'On Track',
        message: `You’re on track to stay within your monthly budget of ${targetKwh} kWh.`,
        priority: 'low',
        category: 'budget'
      })
    }
  }

  // --- Peak usage insights ---
  const peakDays = detectPeakUsageDays(readings, 2)
  if (peakDays.length > 0) {
    const topPeakDay = peakDays[0]
    insights.push({
      id: 'peak-usage',
      type: 'info',
      title: 'Peak Usage Day Detected',
      message: `Highest usage was ${topPeakDay.usage} kWh on ${topPeakDay.dayOfWeek}, ${new Date(topPeakDay.date).toLocaleDateString()}.`,
      priority: 'medium',
      impact: `Cost: Rs ${Math.round(topPeakDay.cost)}`,
      category: 'usage'
    })
  }

  // --- Weekly trend insights ---
  const activeWeeks = (breakdown.weeklyBreakdown || []).filter(w => (w?.usage ?? 0) > 0)
  if (activeWeeks.length >= 2) {
    const lastWeek = activeWeeks[activeWeeks.length - 1]
    const previousWeek = activeWeeks[activeWeeks.length - 2]
    if (previousWeek.usage > 0) {
      const weeklyChange = ((lastWeek.usage - previousWeek.usage) / previousWeek.usage) * 100

      if (weeklyChange > 25) {
        insights.push({
          id: 'usage-spike',
          type: 'warning',
          title: 'Usage Spike Detected',
          message: `Your usage increased by ${Math.round(weeklyChange)}% this week compared to last week.`,
          priority: 'high',
          impact: `Extra cost: Rs ${Math.round(lastWeek.cost - previousWeek.cost)}`,
          actionable: true,
          category: 'usage'
        })
      } else if (weeklyChange < -15) {
        insights.push({
          id: 'usage-improvement',
          type: 'success',
          title: 'Usage Reduction Success',
          message: `Excellent! You reduced usage by ${Math.round(Math.abs(weeklyChange))}% this week.`,
          priority: 'low',
          impact: `Savings: Rs ${Math.round(previousWeek.cost - lastWeek.cost)}`,
          category: 'efficiency'
        })
      }
    }
  }

  // --- Slab efficiency insights ---
  const currentSlabInfo = getCurrentSlab(breakdown.monthToDateUsage)
  if (currentSlabInfo) {
    const { slab, index } = currentSlabInfo
    const nextSlab = DEFAULT_TARIFF.slabs[index + 1]
    if (nextSlab) {
      const unitsToNextSlab = nextSlab.min - breakdown.monthToDateUsage
      const projectedMonthlyUsage =
        breakdown.daysElapsed > 0
          ? (breakdown.monthToDateUsage / breakdown.daysElapsed) * daysInMonth
          : breakdown.monthToDateUsage

      if (projectedMonthlyUsage > nextSlab.min) {
        insights.push({
          id: 'slab-warning',
          type: 'warning',
          title: 'Higher Tariff Slab Alert',
          message: `You’re projected to reach the Rs ${nextSlab.rate}/kWh slab this month.`,
          priority: 'high',
          impact: `Potential extra cost: Rs ${Math.round((projectedMonthlyUsage - nextSlab.min) * (nextSlab.rate - slab.rate))}`,
          actionable: true,
          category: 'cost'
        })
      } else if (unitsToNextSlab <= 50 && unitsToNextSlab > 0) {
        insights.push({
          id: 'slab-caution',
          type: 'warning',
          title: 'Approaching Higher Slab',
          message: `You’re ${Math.round(unitsToNextSlab)} kWh away from the next tariff slab (Rs ${nextSlab.rate}/kWh).`,
          priority: 'medium',
          actionable: true,
          category: 'cost'
        })
      }
    }
  }

  // --- Daily usage vs budget-derived daily target (if budget exists) ---
  if (targetKwh) {
    const targetDaily = targetKwh / daysInMonth
    if (breakdown.averageDailyUsage > targetDaily * 1.1) {
      insights.push({
        id: 'high-daily-usage',
        type: 'warning',
        title: 'High Daily Usage',
        message: `Your average daily usage (${breakdown.averageDailyUsage.toFixed(2)} kWh) is above the daily target (${targetDaily.toFixed(2)} kWh).`,
        priority: 'medium',
        category: 'usage'
      })
    }
  }

  // --- Add an efficiency tip if insights are sparse (deterministic in tests) ---
  if (insights.length < 3) {
    const tip =
      process.env.NODE_ENV === 'test'
        ? efficiencyTips[0]
        : efficiencyTips[Math.floor(Math.random() * efficiencyTips.length)]
    insights.push({
      id: tip.id,
      type: 'tip',
      title: tip.title,
      message: tip.message,
      priority: 'low',
      category: 'efficiency'
    })
  }

  // Sort by priority (high > medium > low)
  const priorityOrder: Record<UsageInsight['priority'], number> = { high: 3, medium: 2, low: 1 }
  return insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
}

/**
 * Generate cost-specific insights
 */
export function generateCostInsights(
  actualCost: number,
  projectedCost: number,
  averageDailyCost: number,
  lastMonthCost?: number
): UsageInsight[] {
  const insights: UsageInsight[] = []

  // High cost warning
  if (projectedCost > 15000) {
    insights.push({
      id: 'high-cost-warning',
      type: 'warning',
      title: 'High Bill Projection',
      message: `Your projected monthly bill is Rs ${projectedCost.toLocaleString()}. Consider energy-saving measures.`,
      priority: 'high',
      actionable: true,
      category: 'cost'
    })
  }

  // Month-over-month comparison
  if (lastMonthCost && lastMonthCost > 0) {
    const monthlyChange = ((projectedCost - lastMonthCost) / lastMonthCost) * 100

    if (monthlyChange > 20) {
      insights.push({
        id: 'cost-increase',
        type: 'warning',
        title: 'Significant Cost Increase',
        message: `Your projected bill is ${Math.round(monthlyChange)}% higher than last month.`,
        priority: 'high',
        impact: `Extra cost: Rs ${Math.round(projectedCost - lastMonthCost)}`,
        actionable: true,
        category: 'cost'
      })
    } else if (monthlyChange < -10) {
      insights.push({
        id: 'cost-savings',
        type: 'success',
        title: 'Great Cost Savings',
        message: `You’re saving ${Math.round(Math.abs(monthlyChange))}% compared to last month!`,
        priority: 'low',
        impact: `Savings: Rs ${Math.round(lastMonthCost - projectedCost)}`,
        category: 'cost'
      })
    }
  }

  // Daily cost insights
  if (averageDailyCost > 500) {
    insights.push({
      id: 'high-daily-cost',
      type: 'info',
      title: 'Above Average Daily Cost',
      message: `Your daily average of Rs ${Math.round(averageDailyCost)} is above typical household costs.`,
      priority: 'medium',
      category: 'cost'
    })
  }

  return insights
}
