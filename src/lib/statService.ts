/**
 * Central Statistics Service – SINGLE SOURCE OF TRUTH
 * SAFE cumulative-meter handling + strict month isolation
 */

import { tariffEngine } from './tariffEngine'
import { getBudgetFromStorage } from './budgetManager'
import prisma from './prisma'

const TIMEZONE = 'Asia/Karachi'

/* ───────────────── TYPES ───────────────── */

export interface TimeWindow {
  now: Date
  monthStart: Date
  daysElapsed: number
  daysInMonth: number
  tz: string
}

export interface StatsBundle {
  timeframeLabels: {
    mtd: string
    prevMonthFull: string
    forecast: string
  }
  window: TimeWindow
  mtd: {
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
  prevMonthFull: {
    usage_kwh: number
    cost_pkr: number
    efficiency_score: number
  }
  forecast: {
    usage_kwh: number
    cost_pkr: number
    method: 'actual' | 'proportional' | 'early_estimate'
    vs_prev_full: {
      delta_kwh: number
      delta_cost: number
      pct_kwh: number
      pct_cost: number
    }
  }
  budget: any
  optimization: any
  data_quality: any
  calcId: string
}

/* ───────────────── TIME WINDOW ───────────────── */

function getCurrentTimeWindow(): TimeWindow {
  const now = new Date()
  const local = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const monthStart = new Date(local.getFullYear(), local.getMonth(), 1)
  const daysInMonth = new Date(local.getFullYear(), local.getMonth() + 1, 0).getDate()

  return {
    now: local,
    monthStart,
    daysElapsed: local.getDate(),
    daysInMonth,
    tz: TIMEZONE
  }
}

function getMonthRange(year: number, month: number) {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59, 999)
  }
}

/* ───────────────── HELPERS ───────────────── */

function efficiency(current: number, baseline: number): number {
  if (current <= 0 || baseline <= 0) return 100
  return Math.max(50, Math.min(150, (baseline / current) * 100))
}

/* ───────────────── PREVIOUS MONTH ───────────────── */

async function getPreviousMonthStats(userId: string, meterId?: string, window?: TimeWindow) {
  window ||= getCurrentTimeWindow()

  const prevMonth = window.monthStart.getMonth() === 0 ? 11 : window.monthStart.getMonth() - 1
  const prevYear =
    window.monthStart.getMonth() === 0
      ? window.monthStart.getFullYear() - 1
      : window.monthStart.getFullYear()

  const { start, end } = getMonthRange(prevYear, prevMonth)

  const base: any = { userId }
  if (meterId) base.meterId = meterId

  const baseline = await prisma.meterReading.findFirst({
    where: { ...base, date: { lt: start } },
    orderBy: { date: 'desc' }
  })

  const readings = await prisma.meterReading.findMany({
    where: { ...base, date: { gte: start, lte: end } },
    orderBy: { date: 'asc' }
  })

  // FALLBACK: If current user only has very sparse data (like just 2 readings total), 
  // don't force it into calendar months if it's the ONLY data they have.
  if (!baseline || readings.length === 0) {
    return { usage_kwh: 0, cost_pkr: 0 }
  }

  const usage = Math.max(0, readings.at(-1)!.reading - baseline.reading)
  const cost = tariffEngine(usage).totalCost

  return {
    usage_kwh: Math.round(usage * 100) / 100,
    cost_pkr: Math.round(cost * 100) / 100
  }
}

/* ───────────────── CURRENT MONTH ───────────────── */

async function getCurrentMonthStats(
  userId: string,
  meterId?: string,
  window?: TimeWindow
): Promise<{
  mtdUsage: number
  mtdCost: number
  forecastUsage: number
  method: 'actual' | 'proportional' | 'early_estimate'
}> {
  window ||= getCurrentTimeWindow()

  const { start, end } = getMonthRange(
    window.monthStart.getFullYear(),
    window.monthStart.getMonth()
  )

  const base: any = { userId }
  if (meterId) base.meterId = meterId

  // THE FIX: If there is NO reading before the current month start, 
  // we take the first reading OF the current month as the baseline.
  let baseline = await prisma.meterReading.findFirst({
    where: { ...base, date: { lt: start } },
    orderBy: { date: 'desc' }
  })

  const readings = await prisma.meterReading.findMany({
    where: { ...base, date: { gte: start, lte: end } },
    orderBy: { date: 'asc' }
  })

  if (readings.length === 0) {
    return { mtdUsage: 0, mtdCost: 0, forecastUsage: 0, method: 'early_estimate' }
  }

  // If no reading exists before this month, use the first reading of this month as baseline
  if (!baseline) {
    baseline = readings[0]
  }

  const latest = readings.at(-1)!
  const mtdUsage = Math.max(0, latest.reading - baseline.reading)
  const mtdCost = tariffEngine(mtdUsage).totalCost

  // Forecast Logic
  if (window.daysElapsed < 3 || mtdUsage <= 0) {
    return {
      mtdUsage,
      mtdCost,
      forecastUsage: mtdUsage,
      method: 'early_estimate'
    }
  }

  const dailyAvg = mtdUsage / window.daysElapsed
  const forecastUsage = dailyAvg * window.daysInMonth

  return {
    mtdUsage,
    mtdCost,
    forecastUsage,
    method: window.daysElapsed >= window.daysInMonth ? 'actual' : 'proportional'
  }
}

/* ───────────────── MAIN BUNDLE ───────────────── */

export async function computeStatsBundle(userId: string, meterId?: string): Promise<StatsBundle> {
  const calcId = `calc_${Date.now()}`
  const window = getCurrentTimeWindow()

  const prev = await getPreviousMonthStats(userId, meterId, window)
  const cur = await getCurrentMonthStats(userId, meterId, window)

  // Forecast Capping logic
  const cappedForecastUsage =
    prev.usage_kwh > 0
      ? Math.min(cur.forecastUsage, prev.usage_kwh * 1.4)
      : cur.forecastUsage

  const forecastCost =
    cur.method === 'actual'
      ? cur.mtdCost
      : tariffEngine(cappedForecastUsage).totalCost

  const budget = getBudgetFromStorage()
  const prorated = budget ? (budget * window.daysElapsed) / window.daysInMonth : 0

  return {
    timeframeLabels: {
      mtd: 'Month to Date',
      prevMonthFull: 'Last Month',
      forecast: cur.method === 'actual' ? 'Actual Bill' : 'Forecast'
    },
    window,
    mtd: {
      usage_kwh: cur.mtdUsage,
      cost_pkr: Math.round(cur.mtdCost * 100) / 100,
      efficiency_score: Math.round(efficiency(cur.mtdUsage, prev.usage_kwh)),
      vs_prev_same_period: {
        delta_kwh: 0, delta_cost: 0, delta_efficiency: 0, pct_kwh: 0, pct_cost: 0, pct_efficiency: 0
      }
    },
    prevMonthFull: {
      ...prev,
      efficiency_score: 100
    },
    forecast: {
      usage_kwh: Math.round(cappedForecastUsage * 100) / 100,
      cost_pkr: Math.round(forecastCost * 100) / 100,
      method: cur.method,
      vs_prev_full: {
        delta_kwh: Math.round((cappedForecastUsage - prev.usage_kwh) * 100) / 100,
        delta_cost: Math.round((forecastCost - prev.cost_pkr) * 100) / 100,
        pct_kwh: prev.usage_kwh ? Math.round(((cappedForecastUsage - prev.usage_kwh) / prev.usage_kwh) * 10000) / 100 : 0,
        pct_cost: prev.cost_pkr ? Math.round(((forecastCost - prev.cost_pkr) / prev.cost_pkr) * 10000) / 100 : 0
      }
    },
    budget: {
      monthly_pkr: budget,
      prorated_budget_pkr: prorated,
      mtd_vs_budget: {
        delta_pkr: budget ? cur.mtdCost - prorated : 0,
        pct_used: budget ? (cur.mtdCost / budget) * 100 : 0
      },
      forecast_vs_budget: {
        delta_pkr: budget ? forecastCost - budget : 0,
        pct_over: budget ? Math.max(0, ((forecastCost - budget) / budget) * 100) : 0
      },
      status: !budget ? 'On Track' : forecastCost > budget ? 'Over Budget' : forecastCost > budget * 0.9 ? 'At Risk' : 'On Track'
    },
    optimization: {
      current_usage_mtd_kwh: cur.mtdUsage,
      projected_cost_pkr: Math.round(forecastCost * 100) / 100,
      potential_savings_pkr: Math.round(forecastCost * 0.15 * 100) / 100
    },
    data_quality: {
      warnings: cur.method === 'early_estimate' ? ['Insufficient data for accurate forecast'] : [],
      gaps: [], duplicates: 0, outliers: 0
    },
    calcId
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
      date: {
        gte: window.monthStart,
        lte: new Date(window.monthStart.getFullYear(), window.monthStart.getMonth() + 1, 0, 23, 59, 59, 999)
      }
    },
    orderBy: { date: 'asc' }
  })

  // Daily usage series
  const dailyUsageMap = new Map<string, { usage: number; cost: number }>()
  readings.forEach(reading => {
    const date = new Date(reading.date).toISOString().split('T')[0]
    const existing = dailyUsageMap.get(date) || { usage: 0, cost: 0 }
    dailyUsageMap.set(date, {
      usage: existing.usage + (reading.usage || 0),
      cost: existing.cost + (reading.estimatedCost || 0)
    })
  })

  const dailySeries = Array.from(dailyUsageMap.entries()).map(([date, data]) => ({
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

  // Budget progress
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
