/**
 * Central Statistics Service - Single Source of Truth for All Metrics
 * Implements unified metrics strategy with consistent timeframes and calculations
 */

import { tariffEngine, getCurrentSlab, DEFAULT_TARIFF } from './tariffEngine'
import { getBudgetFromStorage } from './budgetManager'
import prisma from './prisma'

// Timezone constant for all calculations
const TIMEZONE = 'Asia/Karachi'

export interface TimeWindow {
  now: Date
  monthStart: Date
  daysElapsed: number
  daysInMonth: number
  tz: string
}

export interface MTDMetrics {
  usage_kwh: number
  cost_pkr: number
  efficiency_score: number
  vs_prev_same_period: {
    delta_kwh: number
    delta_cost: number
    delta_efficiency: number
    pct_kwh: number
    pct_cost: number
    pct_efficiency: number
  }
}

export interface PrevMonthMetrics {
  usage_kwh: number
  cost_pkr: number
  efficiency_score: number
}

export interface ForecastMetrics {
  usage_kwh: number
  cost_pkr: number
  method: 'proportional' | 'profile_scaled' | 'last_month_blend' | 'actual'
  vs_prev_full: {
    delta_kwh: number
    delta_cost: number
    pct_kwh: number
    pct_cost: number
  }
}

export interface BudgetMetrics {
  monthly_pkr: number | null
  prorated_budget_pkr: number
  mtd_vs_budget: {
    delta_pkr: number
    pct_used: number
  }
  forecast_vs_budget: {
    delta_pkr: number
    pct_over: number
  }
  status: 'On Track' | 'At Risk' | 'Over Budget'
  remaining_to_budget_pkr: number
  projected_overrun_pkr: number
}

export interface OptimizationMetrics {
  current_usage_mtd_kwh: number
  projected_cost_pkr: number
  potential_savings_pkr: number
}

export interface DataQuality {
  warnings: string[]
  gaps: Array<{ start: Date; end: Date; days: number }>
  duplicates: number
  outliers: number
}

export interface StatsBundle {
  timeframeLabels: {
    mtd: string
    prevMonthFull: string
    forecast: string
  }
  window: TimeWindow
  mtd: MTDMetrics
  prevMonthFull: PrevMonthMetrics
  forecast: ForecastMetrics
  budget: BudgetMetrics
  optimization: OptimizationMetrics
  data_quality: DataQuality
  calcId: string
}

/**
 * Get current time window in Asia/Karachi timezone
 */
function getCurrentTimeWindow(): TimeWindow {
  const now = new Date()
  
  // Convert to Asia/Karachi timezone
  const karachiTime = new Date(now.toLocaleString("en-US", { timeZone: TIMEZONE }))
  
  const monthStart = new Date(karachiTime.getFullYear(), karachiTime.getMonth(), 1)
  const nextMonthStart = new Date(karachiTime.getFullYear(), karachiTime.getMonth() + 1, 1)
  const daysInMonth = new Date(karachiTime.getFullYear(), karachiTime.getMonth() + 1, 0).getDate()
  
  // Check if we are at the very end of the month (last day completed)
  // For calculation purposes, we consider the day "elapsed" only if it's past
  const daysElapsed = karachiTime.getDate()

  return {
    now: karachiTime,
    monthStart,
    daysElapsed,
    daysInMonth,
    tz: TIMEZONE
  }
}

/**
 * Aggregate readings into usage profile
 */
function aggregateReadings(readings: any[], window: TimeWindow): { totalUsage: number; totalCost: number; profile: any[] } {
  if (!readings || readings.length === 0) {
    return { totalUsage: 0, totalCost: 0, profile: [] }
  }

  const totalUsage = readings.reduce((sum, r) => sum + (r.usage || 0), 0)
  const totalCost = readings.reduce((sum, r) => sum + (r.estimatedCost || 0), 0)
  
  // Create daily profile for advanced forecasting
  const dailyProfile = new Map<string, { usage: number; cost: number }>()
  
  // Initialize all days in month with 0 usage
  for (let d = 1; d <= window.daysInMonth; d++) {
    const dateStr = new Date(window.monthStart.getFullYear(), window.monthStart.getMonth(), d).toISOString().split('T')[0]
    dailyProfile.set(dateStr, { usage: 0, cost: 0 })
  }

  readings.forEach(reading => {
    const dateStr = new Date(reading.date).toISOString().split('T')[0]
    const existing = dailyProfile.get(dateStr) || { usage: 0, cost: 0 }
    dailyProfile.set(dateStr, {
      usage: existing.usage + (reading.usage || 0),
      cost: existing.cost + (reading.estimatedCost || 0)
    })
  })

  const profile = Array.from(dailyProfile.entries())
    .filter(([dateStr]) => {
        const day = new Date(dateStr).getDate()
        return day <= window.daysInMonth
    })
    .map(([date, data]) => ({
      date,
      usage: data.usage,
      cost: data.cost
    }))

  return { totalUsage, totalCost, profile }
}

/**
 * Calculate efficiency score with baseline comparison
 */
function calculateEfficiencyScore(
  currentUsage: number,
  baselineUsage: number,
  epsilon: number = 0.1
): number {
  if (currentUsage === 0) return 100
  if (baselineUsage === 0) return 100

  const score = 100 * (baselineUsage / Math.max(currentUsage, epsilon))
  return Math.max(0, Math.min(150, score))
}

/**
 * Forecast usage using appropriate method based on data availability
 */
function forecastUsage(
  mtdUsage: number,
  daysElapsed: number,
  daysInMonth: number,
  mtdProfile: any[],
  lastMonthProfile?: any[]
): { usage: number; method: ForecastMetrics['method'] } {
  // Method A: Default proportional
  if (daysElapsed === 0) {
    return { usage: 0, method: 'proportional' }
  }

  // Calculate daily average from actual readings
  // If we have readings, use the average per day elapsed (mtdUsage / daysElapsed) * 30
  // Ensuring we use exactly the proportional logic requested (total / elapsed * 30)
  const projectedUsage = (mtdUsage / daysElapsed) * daysInMonth;

  return {
    usage: projectedUsage,
    method: 'proportional'
  }
}

/**
 * Main function to compute comprehensive stats bundle
 */
export async function computeStatsBundle(userId: string, meterId?: string): Promise<StatsBundle> {
  const calcId = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const window = getCurrentTimeWindow()
  
  try {
    // Build query conditions
    const baseWhere: any = { userId }
    if (meterId) baseWhere.meterId = meterId

    // Fetch current month readings (MTD)
    const mtdReadings = await prisma.meterReading.findMany({
      where: {
        ...baseWhere,
        month: window.monthStart.getMonth() + 1,
        year: window.monthStart.getFullYear()
      },
      include: {
        meter: { select: { id: true, label: true, type: true } }
      },
      orderBy: { date: 'asc' }
    })

    // Fetch previous month readings (full)
    const prevMonth = window.monthStart.getMonth() === 0 ? 12 : window.monthStart.getMonth()
    const prevYear = window.monthStart.getMonth() === 0 ? window.monthStart.getFullYear() - 1 : window.monthStart.getFullYear()
    
    const prevMonthReadings = await prisma.meterReading.findMany({
      where: {
        ...baseWhere,
        month: prevMonth,
        year: prevYear
      },
      orderBy: { date: 'asc' }
    })

    // Fetch previous month same period (for MTD comparison)
    const prevMonthSamePeriodReadings = prevMonthReadings.filter(reading => {
      const readingDay = new Date(reading.date).getDate()
      return readingDay <= window.daysElapsed
    })

    // Aggregate data
    const mtdAgg = aggregateReadings(mtdReadings, window)
    const prevMonthFullAgg = aggregateReadings(prevMonthReadings, { ...window, daysInMonth: 31 }) // Simplified
    const prevMonthSamePeriodAgg = aggregateReadings(prevMonthSamePeriodReadings, window)

    // Recalculate costs using tariff engine for accuracy
    const mtdCostAccurate = mtdAgg.totalUsage > 0 ? tariffEngine(mtdAgg.totalUsage).totalCost : 0
    const prevMonthFullCostAccurate = prevMonthFullAgg.totalUsage > 0 ? tariffEngine(prevMonthFullAgg.totalUsage).totalCost : 0
    const prevMonthSamePeriodCostAccurate = prevMonthSamePeriodAgg.totalUsage > 0 ? tariffEngine(prevMonthSamePeriodAgg.totalUsage).totalCost : 0

    // Calculate efficiency scores
    const mtdEfficiency = calculateEfficiencyScore(mtdAgg.totalUsage, prevMonthSamePeriodAgg.totalUsage)
    const prevMonthEfficiency = calculateEfficiencyScore(
      prevMonthFullAgg.totalUsage,
      prevMonthFullAgg.totalUsage // Use same month as baseline for historical score
    )

    // Check if month ended
    const isMonthEnd = window.daysElapsed === window.daysInMonth

    // Forecast current month
    let forecastResult: { usage: number; method: 'proportional' | 'profile_scaled' | 'last_month_blend' | 'actual' }
    
    if (isMonthEnd) {
      forecastResult = { usage: mtdAgg.totalUsage, method: 'actual' }
    } else {
      const fr = forecastUsage(
        mtdAgg.totalUsage,
        window.daysElapsed,
        window.daysInMonth,
        mtdAgg.profile,
        prevMonthFullAgg.profile
      )
      forecastResult = { ...fr }
    }
    
    const forecastCost = isMonthEnd ? mtdCostAccurate : (forecastResult.usage > 0 ? tariffEngine(forecastResult.usage).totalCost : 0)

    // Budget calculations
    const monthlyBudget = getBudgetFromStorage()
    const proratedBudget = monthlyBudget ? (monthlyBudget * window.daysElapsed) / window.daysInMonth : 0

    // Forecast vs Predicted Status
    const forecastDelta = monthlyBudget ? forecastCost - monthlyBudget : 0
    let forecastStatus: 'below_forecast' | 'on_track' | 'exceeded' = 'on_track'
    let forecastColor: 'green' | 'yellow' | 'red' = 'green'

    if (forecastDelta < -500) {
      forecastStatus = 'below_forecast'
      forecastColor = 'green'
    } else if (forecastDelta > 500) {
      forecastStatus = 'exceeded'
      forecastColor = 'red'
    }

    // Budget Status
    let budgetStatusStr: BudgetMetrics['status'] = 'On Track'
    if (monthlyBudget) {
        if (forecastCost > monthlyBudget) budgetStatusStr = 'Over Budget'
        else if (forecastCost > monthlyBudget * 0.9) budgetStatusStr = 'At Risk'
    }

    // Calculate budget metrics
    const budgetMetrics: BudgetMetrics = {
      monthly_pkr: monthlyBudget,
      prorated_budget_pkr: proratedBudget,
      mtd_vs_budget: {
        delta_pkr: monthlyBudget ? mtdCostAccurate - proratedBudget : 0,
        pct_used: monthlyBudget ? (mtdCostAccurate / monthlyBudget) * 100 : 0
      },
      forecast_vs_budget: {
        delta_pkr: monthlyBudget ? forecastCost - monthlyBudget : 0,
        pct_over: monthlyBudget ? Math.max(0, ((forecastCost - monthlyBudget) / monthlyBudget) * 100) : 0
      },
      status: budgetStatusStr,
      remaining_to_budget_pkr: monthlyBudget ? Math.max(0, monthlyBudget - mtdCostAccurate) : 0,
      projected_overrun_pkr: monthlyBudget ? Math.max(0, forecastCost - monthlyBudget) : 0
    }

    // Calculate optimization potential (simplified)
    const optimizationMetrics: OptimizationMetrics = {
      current_usage_mtd_kwh: mtdAgg.totalUsage,
      projected_cost_pkr: forecastCost,
      potential_savings_pkr: forecastCost * 0.15 // 15% potential savings estimate
    }

    // Data quality assessment
    const dataQuality: DataQuality = {
      warnings: [],
      gaps: [],
      duplicates: 0,
      outliers: 0
    }

    // Add warnings for data quality and budget alerts
    if (mtdReadings.length === 0) {
      dataQuality.warnings.push('No readings found for current month')
    }
    if (window.daysElapsed > 7 && mtdReadings.length < 2) {
      dataQuality.warnings.push('Insufficient readings for accurate forecasting')
    }
    
    // Budget warnings based on forecast
    if (monthlyBudget && forecastCost > monthlyBudget) {
      const overrunPct = Math.round(((forecastCost - monthlyBudget) / monthlyBudget) * 100)
      dataQuality.warnings.push(`Forecasted bill (Rs ${Math.round(forecastCost).toLocaleString()}) is ${overrunPct}% above your budget!`)
    }

    // Build final stats bundle
    const statsBundle: StatsBundle = {
      timeframeLabels: {
        mtd: 'MTD',
        prevMonthFull: 'Last Month (Full)',
        forecast: isMonthEnd ? 'Actual Bill' : 'Forecast (This Month)'
      },
      window,
      mtd: {
        usage_kwh: Math.round(mtdAgg.totalUsage * 100) / 100,
        cost_pkr: Math.round(mtdCostAccurate * 100) / 100,
        efficiency_score: Math.round(mtdEfficiency),
        vs_prev_same_period: {
          delta_kwh: Math.round((mtdAgg.totalUsage - prevMonthSamePeriodAgg.totalUsage) * 100) / 100,
          delta_cost: Math.round((mtdCostAccurate - prevMonthSamePeriodCostAccurate) * 100) / 100,
          delta_efficiency: Math.round(mtdEfficiency - prevMonthEfficiency),
          pct_kwh: prevMonthSamePeriodAgg.totalUsage > 0 ? 
            Math.round(((mtdAgg.totalUsage - prevMonthSamePeriodAgg.totalUsage) / prevMonthSamePeriodAgg.totalUsage) * 100 * 100) / 100 : 0,
          pct_cost: prevMonthSamePeriodCostAccurate > 0 ? 
            Math.round(((mtdCostAccurate - prevMonthSamePeriodCostAccurate) / prevMonthSamePeriodCostAccurate) * 100 * 100) / 100 : 0,
          pct_efficiency: Math.round(((mtdEfficiency - prevMonthEfficiency) / Math.max(prevMonthEfficiency, 1)) * 100 * 100) / 100
        }
      },
      prevMonthFull: {
        usage_kwh: Math.round(prevMonthFullAgg.totalUsage * 100) / 100,
        cost_pkr: Math.round(prevMonthFullCostAccurate * 100) / 100,
        efficiency_score: Math.round(prevMonthEfficiency)
      },
      forecast: {
        usage_kwh: Math.round(forecastResult.usage * 100) / 100,
        cost_pkr: Math.round(forecastCost * 100) / 100,
        method: forecastResult.method,
        vs_prev_full: {
          delta_kwh: Math.round((forecastResult.usage - prevMonthFullAgg.totalUsage) * 100) / 100,
          delta_cost: Math.round((forecastCost - prevMonthFullCostAccurate) * 100) / 100,
          pct_kwh: prevMonthFullAgg.totalUsage > 0 ? 
            Math.round(((forecastResult.usage - prevMonthFullAgg.totalUsage) / prevMonthFullAgg.totalUsage) * 100 * 100) / 100 : 0,
          pct_cost: prevMonthFullCostAccurate > 0 ? 
            Math.round(((forecastCost - prevMonthFullCostAccurate) / prevMonthFullCostAccurate) * 100 * 100) / 100 : 0
        }
      },
      budget: budgetMetrics,
      optimization: optimizationMetrics,
      data_quality: dataQuality,
      calcId
    }

    // Log calculation for traceability
    console.log(`[StatsService] ${calcId}: MTD=${mtdAgg.totalUsage}kWh/Rs${mtdCostAccurate}, Forecast=${forecastResult.usage}kWh/Rs${forecastCost}, Method=${forecastResult.method}`)

    return statsBundle

  } catch (error) {
    console.error(`[StatsService] ${calcId}: Error computing stats:`, error)
    throw error
  }
}

/**
 * Validate invariants and data quality
 */
export async function validateInvariants(userId: string): Promise<{
  valid: boolean
  violations: string[]
  deviceReconciliation?: {
    deviceSum: number
    totalUsage: number
    variance: number
    withinTolerance: boolean
  }
}> {
  const violations: string[] = []
  
  try {
    // Get current month readings
    const window = getCurrentTimeWindow()
    const readings = await prisma.meterReading.findMany({
      where: {
        userId,
        month: window.monthStart.getMonth() + 1,
        year: window.monthStart.getFullYear()
      }
    })

    // Get user appliances
    const appliances = await prisma.appliance.findMany({
      where: { userId }
    })

    // Validate device reconciliation
    const totalUsageMTD = readings.reduce((sum, r) => sum + (r.usage || 0), 0)
    const deviceSumMTD = appliances.reduce((sum, app) => sum + (app.estimatedKwh || 0), 0)
    
    const variance = totalUsageMTD > 0 ? Math.abs((deviceSumMTD - totalUsageMTD) / totalUsageMTD) * 100 : 0
    const withinTolerance = variance <= 2 // 2% tolerance

    if (!withinTolerance && totalUsageMTD > 0) {
      violations.push(`Device usage sum (${deviceSumMTD} kWh) differs from total usage (${totalUsageMTD} kWh) by ${variance.toFixed(1)}%`)
    }

    // Validate cost calculations
    for (const reading of readings) {
      if ((reading.usage ??0) > 0) {
        const expectedCost = tariffEngine((reading.usage ??0) ).totalCost
        const actualCost = reading.estimatedCost || 0
        const costVariance = Math.abs((actualCost - expectedCost) / expectedCost) * 100
        
        if (costVariance > 5) { // 5% tolerance for cost calculations
          violations.push(`Reading ${reading.id}: Cost variance ${costVariance.toFixed(1)}% (expected: Rs${expectedCost}, actual: Rs${actualCost})`)
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      deviceReconciliation: {
        deviceSum: deviceSumMTD,
        totalUsage: totalUsageMTD,
        variance,
        withinTolerance
      }
    }

  } catch (error) {
    violations.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { valid: false, violations }
  }
}

/**
 * Get analytics time series data for charts
 */
export async function getAnalyticsTimeSeries(userId: string, meterId?: string): Promise<{
  dailyUsage: Array<{ date: string; usage: number; cost: number }>
  weeklyBreakdown: Array<{ week: number; usage: number; cost: number }>
  budgetProgress: Array<{ day: number; spent: number; budget: number }>
}> {
  const window = getCurrentTimeWindow()
  const baseWhere: any = { userId }
  if (meterId) baseWhere.meterId = meterId

  const readings = await prisma.meterReading.findMany({
    where: {
      ...baseWhere,
      month: window.monthStart.getMonth() + 1,
      year: window.monthStart.getFullYear()
    },
    orderBy: { date: 'asc' }
  })

  // Daily usage series
  const dailyUsage = new Map<string, { usage: number; cost: number }>()
  readings.forEach(reading => {
    const date = new Date(reading.date).toISOString().split('T')[0]
    const existing = dailyUsage.get(date) || { usage: 0, cost: 0 }
    dailyUsage.set(date, {
      usage: existing.usage + (reading.usage || 0),
      cost: existing.cost + (reading.estimatedCost || 0)
    })
  })

  const dailySeries = Array.from(dailyUsage.entries()).map(([date, data]) => ({
    date,
    usage: Math.round(data.usage * 100) / 100,
    cost: Math.round(data.cost * 100) / 100
  }))

  // Weekly breakdown
  const weeklyBreakdown = []
  for (let week = 1; week <= 5; week++) {
    const weekReadings = readings.filter(r => r.week === week)
    const weekUsage = weekReadings.reduce((sum, r) => sum + (r.usage || 0), 0)
    const weekCost = weekReadings.reduce((sum, r) => sum + (r.estimatedCost || 0), 0)
    
    weeklyBreakdown.push({
      week,
      usage: Math.round(weekUsage * 100) / 100,
      cost: Math.round(weekCost * 100) / 100
    })
  }

  // Budget progress (if budget exists)
  const monthlyBudget = getBudgetFromStorage()
  const budgetProgress = []
  
  if (monthlyBudget) {
    let cumulativeCost = 0
    for (let day = 1; day <= window.daysElapsed; day++) {
      const dayReadings = readings.filter(r => new Date(r.date).getDate() === day)
      const dayCost = dayReadings.reduce((sum, r) => sum + (r.estimatedCost || 0), 0)
      cumulativeCost += dayCost
      
      budgetProgress.push({
        day,
        spent: Math.round(cumulativeCost * 100) / 100,
        budget: Math.round((monthlyBudget * day) / window.daysInMonth * 100) / 100
      })
    }
  }

  return {
    dailyUsage: dailySeries,
    weeklyBreakdown,
    budgetProgress
  }
}