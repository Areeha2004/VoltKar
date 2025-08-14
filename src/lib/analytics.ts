/**
 * Analytics Engine - Core analytics and forecasting functions
 * Handles usage breakdowns, forecasting, and statistical calculations
 */

import { tariffEngine } from './tariffEngine'

export interface WeeklyUsage {
  week: number
  usage: number
  cost: number
  readingsCount: number
}

export interface MonthlyBreakdown {
  weeklyBreakdown: WeeklyUsage[]
  monthToDateUsage: number
  monthToDateCost: number
  averageDailyUsage: number
  daysElapsed: number
}

export interface UsageForecast {
  low: number
  expected: number
  high: number
}

export interface BillForecast {
  low: number
  expected: number
  high: number
}

export interface Reading {
  id: string
  date: Date | string
  usage: number
  estimatedCost: number
  week?: number
  month: number
  year: number
}

/**
 * Bucket daily readings into weekly totals
 * @param readings - Array of readings with date, usage, and cost
 * @returns Array of weekly usage summaries
 */
export function bucketDailyUsage(readings: Reading[]): WeeklyUsage[] {
  if (!readings || readings.length === 0) {
    return []
  }

  // Sort readings by date
  const sortedReadings = readings.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  // Group by week
  const weeklyMap = new Map<number, { usage: number; cost: number; count: number }>()

  sortedReadings.forEach(reading => {
    const week = reading.week || getWeekOfMonth(new Date(reading.date))
    const existing = weeklyMap.get(week) || { usage: 0, cost: 0, count: 0 }
    
    weeklyMap.set(week, {
      usage: existing.usage + (reading.usage || 0),
      cost: existing.cost + (reading.estimatedCost || 0),
      count: existing.count + 1
    })
  })

  // Convert to array format
  const weeklyBreakdown: WeeklyUsage[] = []
  for (let week = 1; week <= 5; week++) {
    const data = weeklyMap.get(week) || { usage: 0, cost: 0, count: 0 }
    weeklyBreakdown.push({
      week,
      usage: Math.round(data.usage * 100) / 100,
      cost: Math.round(data.cost * 100) / 100,
      readingsCount: data.count
    })
  }

  return weeklyBreakdown
}

/**
 * Get week number within a month (1-5)
 */
function getWeekOfMonth(date: Date): number {
  const day = date.getDate()
  return Math.ceil(day / 7)
}

/**
 * Get weekly totals for a specific meter and month
 * @param readings - All readings for the meter in the specified month
 * @returns Weekly breakdown with usage and cost totals
 */
export function weeklyTotalsForMonth(readings: Reading[]): WeeklyUsage[] {
  return bucketDailyUsage(readings)
}

/**
 * Compute Month-to-Date totals from readings
 * @param readings - Array of readings for current month
 * @returns MTD usage and cost totals
 */
export function computeMTD(readings: Reading[]): { usage: number; cost: number; daysElapsed: number } {
  if (!readings || readings.length === 0) {
    return { usage: 0, cost: 0, daysElapsed: 0 }
  }

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Filter readings for current month
  const currentMonthReadings = readings.filter(reading => {
    const readingDate = new Date(reading.date)
    return readingDate.getMonth() + 1 === currentMonth && 
           readingDate.getFullYear() === currentYear
  })

  const totalUsage = currentMonthReadings.reduce((sum, reading) => sum + (reading.usage || 0), 0)
  const totalCost = currentMonthReadings.reduce((sum, reading) => sum + (reading.estimatedCost || 0), 0)
  const daysElapsed = currentDate.getDate()

  return {
    usage: Math.round(totalUsage * 100) / 100,
    cost: Math.round(totalCost * 100) / 100,
    daysElapsed
  }
}

/**
 * Forecast monthly usage based on current trend
 * @param mtdUsage - Month-to-date usage
 * @param daysElapsed - Days elapsed in current month
 * @param daysInMonth - Total days in the month
 * @returns Usage forecast with low/expected/high scenarios
 */
export function forecastUsage(mtdUsage: number, daysElapsed: number, daysInMonth: number): UsageForecast {
  if (daysElapsed === 0 || mtdUsage === 0) {
    return { low: 0, expected: 0, high: 0 }
  }

  // Calculate daily average and project for full month
  const dailyAverage = mtdUsage / daysElapsed
  const expected = dailyAverage * daysInMonth

  // Apply variance for low/high scenarios
  const low = expected * 0.9
  const high = expected * 1.1

  return {
    low: Math.round(low),
    expected: Math.round(expected),
    high: Math.round(high)
  }
}

/**
 * Forecast bill amounts for different usage scenarios
 * @param usageProjection - Usage forecast object
 * @returns Bill forecast with cost projections
 */
export function forecastBill(usageProjection: UsageForecast): BillForecast {
  const lowCost = usageProjection.low > 0 ? tariffEngine(usageProjection.low).totalCost : 0
  const expectedCost = usageProjection.expected > 0 ? tariffEngine(usageProjection.expected).totalCost : 0
  const highCost = usageProjection.high > 0 ? tariffEngine(usageProjection.high).totalCost : 0

  return {
    low: Math.round(lowCost),
    expected: Math.round(expectedCost),
    high: Math.round(highCost)
  }
}

/**
 * Generate comprehensive monthly breakdown with analytics
 * @param readings - All readings for the month
 * @returns Complete monthly analytics breakdown
 */
export function generateMonthlyBreakdown(readings: Reading[]): MonthlyBreakdown {
  const weeklyBreakdown = bucketDailyUsage(readings)
  const mtd = computeMTD(readings)
  
  const averageDailyUsage = mtd.daysElapsed > 0 ? mtd.usage / mtd.daysElapsed : 0

  return {
    weeklyBreakdown,
    monthToDateUsage: mtd.usage,
    monthToDateCost: mtd.cost,
    averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
    daysElapsed: mtd.daysElapsed
  }
}

/**
 * Calculate efficiency score based on usage patterns
 * @param currentUsage - Current month usage
 * @param previousUsage - Previous month usage for comparison
 * @param targetUsage - Target usage goal
 * @returns Efficiency score (0-100)
 */
export function calculateEfficiencyScore(
  currentUsage: number, 
  previousUsage: number = 0, 
  targetUsage: number = 0
): number {
  if (currentUsage === 0) return 100

  let score = 100

  // Compare with previous month (if available)
  if (previousUsage > 0) {
    const changePercent = ((currentUsage - previousUsage) / previousUsage) * 100
    if (changePercent > 0) {
      score -= Math.min(changePercent * 2, 30) // Penalty for increase
    } else {
      score += Math.min(Math.abs(changePercent), 20) // Bonus for decrease
    }
  }

  // Compare with target (if set)
  if (targetUsage > 0) {
    const targetDiff = ((currentUsage - targetUsage) / targetUsage) * 100
    if (targetDiff > 0) {
      score -= Math.min(targetDiff * 1.5, 25) // Penalty for exceeding target
    } else {
      score += Math.min(Math.abs(targetDiff) * 0.5, 15) // Bonus for staying under target
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Generate usage insights and recommendations
 * @param breakdown - Monthly breakdown data
 * @param forecast - Usage forecast
 * @returns Array of insights and recommendations
 */
export function generateUsageInsights(breakdown: MonthlyBreakdown, forecast: UsageForecast) {
  const insights = []

  // Weekly trend analysis
  const weeks = breakdown.weeklyBreakdown.filter(w => w.usage > 0)
  if (weeks.length >= 2) {
    const lastWeek = weeks[weeks.length - 1]
    const previousWeek = weeks[weeks.length - 2]
    const weeklyChange = ((lastWeek.usage - previousWeek.usage) / previousWeek.usage) * 100

    if (weeklyChange > 20) {
      insights.push({
        type: 'warning',
        title: 'Usage Spike Detected',
        message: `Your usage increased by ${Math.round(weeklyChange)}% this week. Consider checking for unusual appliance usage.`,
        priority: 'high'
      })
    } else if (weeklyChange < -15) {
      insights.push({
        type: 'success',
        title: 'Great Progress!',
        message: `You've reduced usage by ${Math.round(Math.abs(weeklyChange))}% this week. Keep up the good work!`,
        priority: 'low'
      })
    }
  }

  // Monthly projection insights
  if (forecast.expected > 0) {
    const projectedCost = tariffEngine(forecast.expected).totalCost
    if (projectedCost > 15000) {
      insights.push({
        type: 'warning',
        title: 'High Bill Projection',
        message: `Your projected monthly bill is Rs ${projectedCost.toLocaleString()}. Consider energy-saving measures.`,
        priority: 'high'
      })
    }
  }

  // Daily average insights
  if (breakdown.averageDailyUsage > 30) {
    insights.push({
      type: 'info',
      title: 'Above Average Usage',
      message: `Your daily average of ${breakdown.averageDailyUsage} kWh is above typical household consumption.`,
      priority: 'medium'
    })
  }

  return insights
}

/**
 * Recompute analytics after reading changes
 * This function can be called after POST, PUT, DELETE operations on readings
 * @param userId - User ID to recompute analytics for
 * @param meterId - Optional meter ID to limit recomputation scope
 */
export async function recomputeAnalytics(userId: string, meterId?: string): Promise<void> {
  // For now, this is a placeholder for future cache invalidation
  // In a production system, this would:
  // 1. Invalidate cached analytics data
  // 2. Trigger background recalculation
  // 3. Update any materialized views
  
  console.log(`Analytics recomputation triggered for user ${userId}${meterId ? `, meter ${meterId}` : ''}`)
}