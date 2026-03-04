import { tariffEngine } from './tariffEngine'
import { getMonthlyBudgetPkr } from './budgetStore'
import prisma from './prisma'

const TIMEZONE = 'Asia/Karachi'

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

interface UsageCostStats {
  usage_kwh: number
  cost_pkr: number
  meter_count: number
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function dayOfMonthInTimeZone(date: Date, timeZone: string): number {
  const local = new Date(date.toLocaleString('en-US', { timeZone }))
  return local.getDate()
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  )
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

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

function getPreviousMonthWindow(window: TimeWindow) {
  const prevMonth = window.monthStart.getMonth() === 0 ? 11 : window.monthStart.getMonth() - 1
  const prevYear =
    window.monthStart.getMonth() === 0
      ? window.monthStart.getFullYear() - 1
      : window.monthStart.getFullYear()

  return { prevYear, prevMonth, ...getMonthRange(prevYear, prevMonth) }
}

function efficiency(current: number, baseline: number): number {
  if (current <= 0 || baseline <= 0) return 100
  return Math.max(50, Math.min(150, (baseline / current) * 100))
}

function pctDelta(current: number, previous: number): number {
  if (previous <= 0) return 0
  return round2(((current - previous) / previous) * 100)
}

async function resolveMeterIds(userId: string, meterId?: string): Promise<string[]> {
  if (meterId) return [meterId]

  const meters = await prisma.meter.findMany({
    where: { userId },
    select: { id: true }
  })

  return meters.map(m => m.id)
}

async function computeMeterUsageInRange(
  meterId: string,
  start: Date,
  end: Date
): Promise<{
  usage: number
  hasData: boolean
  latestReadingDate: Date | null
  latestIsOfficialEndOfMonth: boolean
}> {
  const readings = await prisma.meterReading.findMany({
    where: {
      meterId,
      date: { gte: start, lte: end }
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { reading: true, date: true, isOfficialEndOfMonth: true }
  })

  if (readings.length === 0) {
    return {
      usage: 0,
      hasData: false,
      latestReadingDate: null,
      latestIsOfficialEndOfMonth: false
    }
  }

  const baseline = await prisma.meterReading.findFirst({
    where: { meterId, date: { lt: start } },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    select: { reading: true }
  })

  const baselineReading = baseline?.reading ?? readings[0].reading
  const latestReadingEntry = readings[readings.length - 1]
  const latestReading = latestReadingEntry.reading
  const usage = Math.max(0, latestReading - baselineReading)

  return {
    usage,
    hasData: true,
    latestReadingDate: latestReadingEntry.date,
    latestIsOfficialEndOfMonth: Boolean(latestReadingEntry.isOfficialEndOfMonth)
  }
}

async function aggregateUsageAndCostByMeters(
  meterIds: string[],
  start: Date,
  end: Date
): Promise<UsageCostStats> {
  if (meterIds.length === 0) {
    return { usage_kwh: 0, cost_pkr: 0, meter_count: 0 }
  }

  let totalUsage = 0
  let totalCost = 0
  let meterCount = 0

  for (const id of meterIds) {
    const meterStats = await computeMeterUsageInRange(id, start, end)
    if (!meterStats.hasData) continue

    meterCount += 1
    totalUsage += meterStats.usage
    totalCost += tariffEngine(meterStats.usage).totalCost
  }

  return {
    usage_kwh: round2(totalUsage),
    cost_pkr: round2(totalCost),
    meter_count: meterCount
  }
}

async function getPreviousMonthStats(userId: string, meterId?: string, window?: TimeWindow) {
  const safeWindow = window || getCurrentTimeWindow()
  const meterIds = await resolveMeterIds(userId, meterId)
  const { start, end } = getPreviousMonthWindow(safeWindow)

  return aggregateUsageAndCostByMeters(meterIds, start, end)
}

async function getPreviousSamePeriodStats(userId: string, meterId?: string, window?: TimeWindow) {
  const safeWindow = window || getCurrentTimeWindow()
  const meterIds = await resolveMeterIds(userId, meterId)
  const { prevYear, prevMonth, start } = getPreviousMonthWindow(safeWindow)
  const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate()
  const samePeriodEndDay = Math.min(safeWindow.daysElapsed, prevMonthDays)
  const end = new Date(prevYear, prevMonth, samePeriodEndDay, 23, 59, 59, 999)

  return aggregateUsageAndCostByMeters(meterIds, start, end)
}

async function getCurrentMonthStats(
  userId: string,
  meterId?: string,
  window?: TimeWindow
): Promise<{
  mtdUsage: number
  mtdCost: number
  forecastUsage: number
  forecastCost: number
  method: 'actual' | 'proportional' | 'early_estimate'
  metersWithData: number
}> {
  const safeWindow = window || getCurrentTimeWindow()
  const meterIds = await resolveMeterIds(userId, meterId)
  if (meterIds.length === 0) {
    return {
      mtdUsage: 0,
      mtdCost: 0,
      forecastUsage: 0,
      forecastCost: 0,
      method: 'early_estimate',
      metersWithData: 0
    }
  }

  const currentRange = getMonthRange(
    safeWindow.monthStart.getFullYear(),
    safeWindow.monthStart.getMonth()
  )
  const mtdEnd = endOfDay(safeWindow.now)
  const previousRange = getPreviousMonthWindow(safeWindow)

  let mtdUsage = 0
  let mtdCost = 0
  let forecastUsage = 0
  let forecastCost = 0
  let metersWithData = 0
  let metersMonthComplete = 0

  for (const id of meterIds) {
    const currentStats = await computeMeterUsageInRange(id, currentRange.start, mtdEnd)
    if (!currentStats.hasData) continue

    metersWithData += 1
    mtdUsage += currentStats.usage

    const meterMtdCost = tariffEngine(currentStats.usage).totalCost
    mtdCost += meterMtdCost

    const latestReadingDay = currentStats.latestReadingDate
      ? dayOfMonthInTimeZone(new Date(currentStats.latestReadingDate), TIMEZONE)
      : safeWindow.daysElapsed
    const meterObservedDays = Math.max(1, Math.min(safeWindow.daysElapsed, latestReadingDay))
    const meterHasMonthCompleteReading =
      currentStats.latestIsOfficialEndOfMonth || latestReadingDay >= safeWindow.daysInMonth

    if (meterHasMonthCompleteReading) {
      metersMonthComplete += 1
    }

    let meterForecastUsage = currentStats.usage
    if (meterObservedDays >= 3 && currentStats.usage > 0) {
      meterForecastUsage = (currentStats.usage / meterObservedDays) * safeWindow.daysInMonth
    }

    const prevStats = await computeMeterUsageInRange(id, previousRange.start, previousRange.end)
    const cappedForecastUsage =
      prevStats.hasData && prevStats.usage > 0
        ? Math.min(meterForecastUsage, prevStats.usage * 1.4)
        : meterForecastUsage

    forecastUsage += cappedForecastUsage
    forecastCost +=
      safeWindow.daysElapsed >= safeWindow.daysInMonth && meterHasMonthCompleteReading
        ? meterMtdCost
        : tariffEngine(cappedForecastUsage).totalCost
  }

  const method: 'actual' | 'proportional' | 'early_estimate' =
    metersWithData === 0 || safeWindow.daysElapsed < 3 || mtdUsage <= 0
      ? 'early_estimate'
      : safeWindow.daysElapsed >= safeWindow.daysInMonth &&
          metersMonthComplete === metersWithData
        ? 'actual'
        : 'proportional'

  if (method === 'actual') {
    forecastUsage = mtdUsage
    forecastCost = mtdCost
  }

  return {
    mtdUsage: round2(mtdUsage),
    mtdCost: round2(mtdCost),
    forecastUsage: round2(forecastUsage),
    forecastCost: round2(forecastCost),
    method,
    metersWithData
  }
}

export async function computeStatsBundle(userId: string, meterId?: string): Promise<StatsBundle> {
  const calcId = `calc_${Date.now()}`
  const window = getCurrentTimeWindow()

  const prev = await getPreviousMonthStats(userId, meterId, window)
  const prevSamePeriod = await getPreviousSamePeriodStats(userId, meterId, window)
  const cur = await getCurrentMonthStats(userId, meterId, window)
  const budget = await getMonthlyBudgetPkr(userId)

  const mtdEfficiency = round2(efficiency(cur.mtdUsage, prev.usage_kwh))
  const prevSamePeriodEfficiency = round2(efficiency(prevSamePeriod.usage_kwh, prev.usage_kwh))

  const proratedBudget = budget ? (budget * window.daysElapsed) / window.daysInMonth : 0
  const projectedOverrun = budget ? Math.max(0, cur.forecastCost - budget) : 0
  const remainingToBudget = budget ? Math.max(0, budget - cur.mtdCost) : 0

  return {
    timeframeLabels: {
      mtd: 'Month to Date',
      prevMonthFull: 'Last Month',
      forecast: cur.method === 'actual' ? 'Actual Bill' : 'Forecast'
    },
    window,
    mtd: {
      usage_kwh: cur.mtdUsage,
      cost_pkr: cur.mtdCost,
      efficiency_score: mtdEfficiency,
      vs_prev_same_period: {
        delta_kwh: round2(cur.mtdUsage - prevSamePeriod.usage_kwh),
        delta_cost: round2(cur.mtdCost - prevSamePeriod.cost_pkr),
        delta_efficiency: round2(mtdEfficiency - prevSamePeriodEfficiency),
        pct_kwh: pctDelta(cur.mtdUsage, prevSamePeriod.usage_kwh),
        pct_cost: pctDelta(cur.mtdCost, prevSamePeriod.cost_pkr),
        pct_efficiency: pctDelta(mtdEfficiency, prevSamePeriodEfficiency)
      }
    },
    prevMonthFull: {
      usage_kwh: prev.usage_kwh,
      cost_pkr: prev.cost_pkr,
      efficiency_score: 100
    },
    forecast: {
      usage_kwh: cur.forecastUsage,
      cost_pkr: cur.forecastCost,
      method: cur.method,
      vs_prev_full: {
        delta_kwh: round2(cur.forecastUsage - prev.usage_kwh),
        delta_cost: round2(cur.forecastCost - prev.cost_pkr),
        pct_kwh: pctDelta(cur.forecastUsage, prev.usage_kwh),
        pct_cost: pctDelta(cur.forecastCost, prev.cost_pkr)
      }
    },
    budget: {
      monthly_pkr: budget,
      monthly_budget_pkr: budget,
      prorated_budget_pkr: round2(proratedBudget),
      mtd_vs_budget: {
        delta_pkr: budget ? round2(cur.mtdCost - proratedBudget) : 0,
        pct_used: budget ? round2((cur.mtdCost / budget) * 100) : 0
      },
      forecast_vs_budget: {
        delta_pkr: budget ? round2(cur.forecastCost - budget) : 0,
        pct_over: budget ? round2(Math.max(0, ((cur.forecastCost - budget) / budget) * 100)) : 0
      },
      projected_overrun_pkr: round2(projectedOverrun),
      remaining_to_budget_pkr: round2(remainingToBudget),
      status:
        !budget
          ? 'On Track'
          : cur.forecastCost > budget
            ? 'Over Budget'
            : cur.forecastCost > budget * 0.9
              ? 'At Risk'
              : 'On Track'
    },
    optimization: {
      current_usage_mtd_kwh: cur.mtdUsage,
      projected_cost_pkr: cur.forecastCost,
      potential_savings_pkr: round2(cur.forecastCost * 0.15)
    },
    data_quality: {
      warnings:
        cur.method === 'early_estimate'
          ? ['Insufficient data for accurate forecast']
          : [],
      gaps: [],
      duplicates: 0,
      outliers: 0
    },
    calcId
  }
}

export async function getAnalyticsTimeSeries(userId: string, meterId?: string): Promise<{
  dailyUsage: Array<{ date: string; usage: number; cost: number }>
  weeklyBreakdown: Array<{ week: number; usage: number; cost: number }>
  budgetProgress: Array<{ day: number; spent: number; budget: number }>
}> {
  const window = getCurrentTimeWindow()
  const meterIds = await resolveMeterIds(userId, meterId)
  if (meterIds.length === 0) {
    return {
      dailyUsage: [],
      weeklyBreakdown: [
        { week: 1, usage: 0, cost: 0 },
        { week: 2, usage: 0, cost: 0 },
        { week: 3, usage: 0, cost: 0 },
        { week: 4, usage: 0, cost: 0 },
        { week: 5, usage: 0, cost: 0 }
      ],
      budgetProgress: []
    }
  }

  const monthStart = window.monthStart
  const monthEnd = endOfDay(window.now)

  const dailyUsageMap = new Map<string, number>()
  const dailyCostMap = new Map<string, number>()
  const weeklyUsageMap = new Map<number, number>()
  const weeklyCostMap = new Map<number, number>()

  for (const id of meterIds) {
    const [baseline, readings] = await Promise.all([
      prisma.meterReading.findFirst({
        where: { meterId: id, date: { lt: monthStart } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        select: { reading: true }
      }),
      prisma.meterReading.findMany({
        where: {
          meterId: id,
          date: { gte: monthStart, lte: monthEnd }
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: {
          reading: true,
          date: true,
          week: true
        }
      })
    ])

    if (readings.length === 0) continue

    const meterDailyUsage = new Map<string, number>()
    const meterWeeklyUsage = new Map<number, number>()
    let previousValue = baseline?.reading ?? readings[0].reading

    for (const reading of readings) {
      const usage = Math.max(0, reading.reading - previousValue)
      previousValue = reading.reading

      const dateKey = toDateKey(new Date(reading.date))
      meterDailyUsage.set(dateKey, (meterDailyUsage.get(dateKey) || 0) + usage)
      meterWeeklyUsage.set(reading.week, (meterWeeklyUsage.get(reading.week) || 0) + usage)
    }

    const meterTotalUsage = Array.from(meterDailyUsage.values()).reduce((sum, usage) => sum + usage, 0)
    const meterTotalCost = meterTotalUsage > 0 ? tariffEngine(meterTotalUsage).totalCost : 0

    for (const [dateKey, usage] of meterDailyUsage.entries()) {
      const allocatedCost = meterTotalUsage > 0 ? meterTotalCost * (usage / meterTotalUsage) : 0
      dailyUsageMap.set(dateKey, (dailyUsageMap.get(dateKey) || 0) + usage)
      dailyCostMap.set(dateKey, (dailyCostMap.get(dateKey) || 0) + allocatedCost)
    }

    for (const [week, usage] of meterWeeklyUsage.entries()) {
      const allocatedCost = meterTotalUsage > 0 ? meterTotalCost * (usage / meterTotalUsage) : 0
      weeklyUsageMap.set(week, (weeklyUsageMap.get(week) || 0) + usage)
      weeklyCostMap.set(week, (weeklyCostMap.get(week) || 0) + allocatedCost)
    }
  }

  const dailyUsage = Array.from(dailyUsageMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, usage]) => ({
      date,
      usage: round2(usage),
      cost: round2(dailyCostMap.get(date) || 0)
    }))

  const weeklyBreakdown = [1, 2, 3, 4, 5].map(week => ({
    week,
    usage: round2(weeklyUsageMap.get(week) || 0),
    cost: round2(weeklyCostMap.get(week) || 0)
  }))

  const monthlyBudget = await getMonthlyBudgetPkr(userId)
  const budgetProgress: Array<{ day: number; spent: number; budget: number }> = []

  if (monthlyBudget) {
    let cumulativeCost = 0
    for (let day = 1; day <= window.daysElapsed; day++) {
      const date = new Date(window.now.getFullYear(), window.now.getMonth(), day)
      const dateKey = toDateKey(date)
      cumulativeCost += dailyCostMap.get(dateKey) || 0

      budgetProgress.push({
        day,
        spent: round2(cumulativeCost),
        budget: round2((monthlyBudget * day) / window.daysInMonth)
      })
    }
  }

  return {
    dailyUsage,
    weeklyBreakdown,
    budgetProgress
  }
}

export async function validateInvariants(userId: string, meterId?: string) {
  const stats = await computeStatsBundle(userId, meterId)
  const issues: string[] = []

  if (stats.window.daysElapsed < 1 || stats.window.daysElapsed > stats.window.daysInMonth) {
    issues.push('Invalid day counters in time window')
  }
  if (stats.mtd.usage_kwh < 0 || stats.prevMonthFull.usage_kwh < 0 || stats.forecast.usage_kwh < 0) {
    issues.push('Negative usage values detected')
  }
  if (stats.mtd.cost_pkr < 0 || stats.prevMonthFull.cost_pkr < 0 || stats.forecast.cost_pkr < 0) {
    issues.push('Negative cost values detected')
  }
  if (
    stats.forecast.method === 'actual' &&
    Math.abs(stats.forecast.cost_pkr - stats.mtd.cost_pkr) > 0.01
  ) {
    issues.push('Actual forecast does not match MTD cost')
  }

  return {
    valid: issues.length === 0,
    issues,
    calcId: stats.calcId,
    checkedAt: new Date().toISOString()
  }
}
