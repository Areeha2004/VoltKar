/**
 * Central Statistics Service - Single Source of Truth for All Metrics
 * Implements unified metrics strategy with consistent timeframes and calculations
 */

import { tariffEngine } from './tariffEngine'
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
  method: 'proportional' | 'profile_scaled' | 'last_month_blend' | 'actual' | 'early_estimate' | 'blended'
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
  const karachiTime = new Date(now.toLocaleString("en-US", { timeZone: TIMEZONE }))
  const monthStart = new Date(karachiTime.getFullYear(), karachiTime.getMonth(), 1)
  const daysInMonth = new Date(karachiTime.getFullYear(), karachiTime.getMonth() + 1, 0).getDate()
  const daysElapsed = karachiTime.getDate()

  return {
    now: karachiTime,
    monthStart,
    daysElapsed,
    daysInMonth,
    tz: TIMEZONE
  }
}

function getCurrentMonthRange(window: TimeWindow) {
  const startDate = new Date(window.monthStart)
  const endDate = new Date(window.monthStart.getFullYear(), window.monthStart.getMonth() + 1, 0, 23, 59, 59, 999)
  return { startDate, endDate }
}

function getPreviousMonthRange(window: TimeWindow) {
  const prevMonth = window.monthStart.getMonth() === 0 ? 11 : window.monthStart.getMonth() - 1
  const prevYear = window.monthStart.getMonth() === 0 ? window.monthStart.getFullYear() - 1 : window.monthStart.getFullYear()
  const startDate = new Date(prevYear, prevMonth, 1)
  const endDate = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59, 999)
  return { startDate, endDate }
}

function calculateEfficiencyScore(currentUsage: number, baselineUsage: number): number {
  if (currentUsage === 0 || baselineUsage === 0) return 100
  const score = 100 * (baselineUsage / currentUsage)
  return Math.max(0, Math.min(150, score))
}

/**
 * Independent Statistics Pipelines
 */
async function getPreviousMonthStats(userId: string, meterId?: string, window?: TimeWindow) {
  if (!window) window = getCurrentTimeWindow()
  const range = getPreviousMonthRange(window)
  const baseWhere: any = { userId }
  if (meterId) baseWhere.meterId = meterId

  const readings = await prisma.meterReading.findMany({
    where: { ...baseWhere, date: { gte: range.startDate, lte: range.endDate } },
    orderBy: { date: 'asc' }
  })

  let usage = 0
  if (readings.length >= 2) {
    usage = (readings[readings.length - 1].reading || 0) - (readings[0].reading || 0)
  }

  const cost = usage > 0 ? tariffEngine(usage).totalCost : 0
  return { usage_kwh: Math.round(usage * 100) / 100, cost_pkr: Math.round(cost * 100) / 100 }
}

async function getCurrentMonthStats(userId: string, meterId?: string, window?: TimeWindow) {
  if (!window) window = getCurrentTimeWindow()
  const range = getCurrentMonthRange(window)
  const baseWhere: any = { userId }
  if (meterId) baseWhere.meterId = meterId

  const readings = await prisma.meterReading.findMany({
    where: { ...baseWhere, date: { gte: range.startDate, lte: range.endDate } },
    orderBy: { date: 'asc' }
  })

  const bridgeReading = await prisma.meterReading.findFirst({
    where: { ...baseWhere, date: { lt: range.startDate } },
    orderBy: { date: 'desc' }
  })

  let mtdUsage = 0
  if (readings.length > 0) {
    const latest = readings[readings.length - 1]
    const baseline = bridgeReading || readings[0]
    mtdUsage = (latest.reading || 0) - (baseline.reading || 0)
  }

  const mtdCost = mtdUsage > 0 ? tariffEngine(mtdUsage).totalCost : 0
  
  const daysElapsed = window.daysElapsed
  const daysInMonth = window.daysInMonth
  const isMonthEnd = daysElapsed >= daysInMonth

  let forecastUsage = mtdUsage
  let method: ForecastMetrics['method'] = 'actual'

  if (!isMonthEnd) {
    const dailyAvg = mtdUsage / Math.max(daysElapsed, 1)
    let projected = dailyAvg * daysInMonth
    method = 'proportional'

    if (daysElapsed < 3) {
      projected = projected * 0.5 
      method = 'early_estimate'
    }

    forecastUsage = projected
    console.log(`[Forecast] dailyAvg: ${dailyAvg}, forecast: ${forecastUsage}, method: ${method}`)
  }

  return {
    mtd: { usage_kwh: Math.round(mtdUsage * 100) / 100, cost_pkr: Math.round(mtdCost * 100) / 100 },
    forecast: { usage_kwh: forecastUsage, method },
    readings
  }
}

export async function computeStatsBundle(userId: string, meterId?: string): Promise<StatsBundle> {
  const calcId = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const window = getCurrentTimeWindow()
  
  try {
    const prevStats = await getPreviousMonthStats(userId, meterId, window)
    const currentStats = await getCurrentMonthStats(userId, meterId, window)
    
    let finalForecastUsage = currentStats.forecast.usage_kwh
    if (prevStats.usage_kwh > 0) {
      const lowerCap = prevStats.usage_kwh * 0.6
      const upperCap = prevStats.usage_kwh * 1.4
      if (finalForecastUsage > upperCap) finalForecastUsage = upperCap
      if (finalForecastUsage < lowerCap && currentStats.forecast.method !== 'early_estimate') {
         finalForecastUsage = lowerCap
      }
    }

    const forecastCost = currentStats.forecast.method === 'actual' 
      ? currentStats.mtd.cost_pkr 
      : (finalForecastUsage > 0 ? tariffEngine(finalForecastUsage).totalCost : 0)

    const monthlyBudget = getBudgetFromStorage()
    const proratedBudget = monthlyBudget ? (monthlyBudget * window.daysElapsed) / window.daysInMonth : 0

    const effectiveForecastCost = currentStats.forecast.method === 'early_estimate' && prevStats.cost_pkr > 0
      ? prevStats.cost_pkr
      : forecastCost

    let budgetStatusStr: BudgetMetrics['status'] = 'On Track'
    if (monthlyBudget) {
        if (effectiveForecastCost > monthlyBudget) budgetStatusStr = 'Over Budget'
        else if (effectiveForecastCost > monthlyBudget * 0.9) budgetStatusStr = 'At Risk'
    }

    const budgetMetrics: BudgetMetrics = {
      monthly_pkr: monthlyBudget,
      prorated_budget_pkr: proratedBudget,
      mtd_vs_budget: {
        delta_pkr: monthlyBudget ? currentStats.mtd.cost_pkr - proratedBudget : 0,
        pct_used: monthlyBudget ? (currentStats.mtd.cost_pkr / monthlyBudget) * 100 : 0
      },
      forecast_vs_budget: {
        delta_pkr: monthlyBudget ? effectiveForecastCost - monthlyBudget : 0,
        pct_over: monthlyBudget ? Math.max(0, ((effectiveForecastCost - monthlyBudget) / monthlyBudget) * 100) : 0
      },
      status: budgetStatusStr,
      remaining_to_budget_pkr: monthlyBudget ? Math.max(0, monthlyBudget - currentStats.mtd.cost_pkr) : 0,
      projected_overrun_pkr: monthlyBudget ? Math.max(0, effectiveForecastCost - monthlyBudget) : 0
    }

    return {
      timeframeLabels: {
        mtd: 'MTD',
        prevMonthFull: 'Last Month',
        forecast: currentStats.forecast.method === 'actual' ? 'Actual Bill' : 'Forecast'
      },
      window,
      mtd: {
        ...currentStats.mtd,
        efficiency_score: Math.round(calculateEfficiencyScore(currentStats.mtd.usage_kwh, prevStats.usage_kwh)),
        vs_prev_same_period: {
          delta_kwh: 0, delta_cost: 0, delta_efficiency: 0, pct_kwh: 0, pct_cost: 0, pct_efficiency: 0
        }
      },
      prevMonthFull: {
        ...prevStats,
        efficiency_score: 100
      },
      forecast: {
        usage_kwh: Math.round(finalForecastUsage * 100) / 100,
        cost_pkr: Math.round(forecastCost * 100) / 100,
        method: currentStats.forecast.method,
        vs_prev_full: {
          delta_kwh: Math.round((finalForecastUsage - prevStats.usage_kwh) * 100) / 100,
          delta_cost: Math.round((forecastCost - prevStats.cost_pkr) * 100) / 100,
          pct_kwh: prevStats.usage_kwh > 0 ? Math.round(((finalForecastUsage - prevStats.usage_kwh) / prevStats.usage_kwh) * 10000) / 100 : 0,
          pct_cost: prevStats.cost_pkr > 0 ? Math.round(((forecastCost - prevStats.cost_pkr) / prevStats.cost_pkr) * 10000) / 100 : 0
        }
      },
      budget: budgetMetrics,
      optimization: {
        current_usage_mtd_kwh: currentStats.mtd.usage_kwh,
        projected_cost_pkr: Math.round(forecastCost * 100) / 100,
        potential_savings_pkr: Math.round(forecastCost * 0.15 * 100) / 100
      },
      data_quality: { warnings: [], gaps: [], duplicates: 0, outliers: 0 },
      calcId
    }
  } catch (error) {
    console.error(`[StatsService] Error computing stats:`, error)
    throw error
  }
}
