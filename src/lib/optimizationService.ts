import prisma from './prisma'
import { computeStatsBundle } from './statService'
import {
  DEFAULT_TARIFF,
  getCurrentSlab,
  tariffEngine,
  TariffSlab
} from './tariffEngine'
import {
  allocateAppliancePortfolioCosts,
  estimateHouseholdSavingsFromApplianceDelta
} from './applianceCalculations'

type Priority = 'high' | 'medium' | 'low'

interface MeterProjection {
  meterId: string
  label: string
  type: string | null
  currentUsage: number
  projectedUsage: number
  projectedCost: number
  currentRate: number
  slabIndex: number
  slabMin: number
  slabMax: number
  headroomKwh: number
}

interface LoadBalancingPlan {
  fromMeterId: string
  fromLabel: string
  toMeterId: string
  toLabel: string
  shiftKwh: number
  estimatedSavingsPkr: number
  reason: string
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function slabUpperBound(slab: TariffSlab): number {
  if (slab.upTo !== undefined) return slab.upTo ?? Infinity
  return slab.max
}

function priorityFromSavings(value: number): Priority {
  if (value >= 1500) return 'high'
  if (value >= 500) return 'medium'
  return 'low'
}

async function getMeterProjections(
  userId: string,
  meterId?: string
): Promise<MeterProjection[]> {
  const meters = await prisma.meter.findMany({
    where: { userId, ...(meterId ? { id: meterId } : {}) },
    orderBy: { createdAt: 'asc' }
  })

  const projections = await Promise.all(
    meters.map(async meter => {
      const stats = await computeStatsBundle(userId, meter.id)
      const slab = getCurrentSlab(stats.forecast.usage_kwh)
      const slabIndex = slab?.index ?? DEFAULT_TARIFF.slabs.length - 1
      const slabRate = slab?.slab.rate ?? DEFAULT_TARIFF.slabs[slabIndex].rate
      const slabMin = slab?.slab.min ?? DEFAULT_TARIFF.slabs[slabIndex].min
      const slabMax = slab?.slab.max ?? slabUpperBound(DEFAULT_TARIFF.slabs[slabIndex])
      const headroomKwh = Number.isFinite(slabMax)
        ? round2(Math.max(0, slabMax - stats.forecast.usage_kwh))
        : 0

      return {
        meterId: meter.id,
        label: meter.label,
        type: meter.type ?? null,
        currentUsage: stats.mtd.usage_kwh,
        projectedUsage: stats.forecast.usage_kwh,
        projectedCost: stats.forecast.cost_pkr,
        currentRate: slabRate,
        slabIndex,
        slabMin,
        slabMax,
        headroomKwh
      }
    })
  )

  return projections
}

function buildLoadBalancingPlans(meters: MeterProjection[]) {
  if (meters.length < 2) {
    return {
      recommended: false,
      totalShiftKwh: 0,
      estimatedSavingsPkr: 0,
      plans: [] as LoadBalancingPlan[],
      rationale: 'At least two meters are required for load balancing.'
    }
  }

  const state = meters.map(meter => ({ ...meter }))
  const plans: LoadBalancingPlan[] = []
  let totalShiftKwh = 0
  let totalSavingsPkr = 0

  const sources = [...state].sort((a, b) => b.currentRate - a.currentRate)
  const targets = [...state].sort((a, b) => a.currentRate - b.currentRate)

  for (const source of sources) {
    for (const target of targets) {
      if (source.meterId === target.meterId) continue
      if (source.currentRate <= target.currentRate) continue
      if (target.headroomKwh < 5) continue

      const sourcePressure =
        source.currentRate >= 22 || source.headroomKwh <= 20 || source.projectedUsage >= 280
      if (!sourcePressure) continue

      const shiftCandidate = Math.min(
        source.projectedUsage * 0.2,
        target.headroomKwh,
        80
      )
      const shiftKwh = round2(Math.max(0, shiftCandidate))
      if (shiftKwh < 5) continue

      const before =
        tariffEngine(source.projectedUsage).totalCost +
        tariffEngine(target.projectedUsage).totalCost
      const after =
        tariffEngine(Math.max(0, source.projectedUsage - shiftKwh)).totalCost +
        tariffEngine(target.projectedUsage + shiftKwh).totalCost
      const estimatedSavings = round2(Math.max(0, before - after))
      if (estimatedSavings <= 0) continue

      source.projectedUsage = round2(Math.max(0, source.projectedUsage - shiftKwh))
      source.projectedCost = round2(tariffEngine(source.projectedUsage).totalCost)
      target.projectedUsage = round2(target.projectedUsage + shiftKwh)
      target.projectedCost = round2(tariffEngine(target.projectedUsage).totalCost)
      totalShiftKwh += shiftKwh
      totalSavingsPkr += estimatedSavings

      const targetSlab = getCurrentSlab(target.projectedUsage)
      const targetMax = targetSlab ? targetSlab.slab.max : Infinity
      target.headroomKwh = Number.isFinite(targetMax)
        ? round2(Math.max(0, targetMax - target.projectedUsage))
        : 0

      const sourceSlab = getCurrentSlab(source.projectedUsage)
      const sourceMax = sourceSlab ? sourceSlab.slab.max : Infinity
      source.headroomKwh = Number.isFinite(sourceMax)
        ? round2(Math.max(0, sourceMax - source.projectedUsage))
        : 0

      plans.push({
        fromMeterId: source.meterId,
        fromLabel: source.label,
        toMeterId: target.meterId,
        toLabel: target.label,
        shiftKwh,
        estimatedSavingsPkr: estimatedSavings,
        reason: `Shift load from higher-rate slab (Rs ${source.currentRate}/kWh) to lower-rate headroom (Rs ${target.currentRate}/kWh).`
      })

      if (plans.length >= 3) break
    }
    if (plans.length >= 3) break
  }

  return {
    recommended: plans.length > 0,
    totalShiftKwh: round2(totalShiftKwh),
    estimatedSavingsPkr: round2(totalSavingsPkr),
    plans,
    rationale:
      plans.length > 0
        ? 'Projected load can be redistributed across meters to reduce high-slab exposure.'
        : 'No strong cross-meter savings opportunity detected in current forecast.'
  }
}

async function buildApplianceSavings(userId: string) {
  const appliances = await prisma.appliance.findMany({
    where: { userId },
    orderBy: { estimatedKwh: 'desc' }
  })

  const portfolio = allocateAppliancePortfolioCosts(
    appliances.map(appliance => ({
      id: appliance.id,
      estimatedKwh: appliance.estimatedKwh || 0
    }))
  )
  const allocationById = new Map(
    portfolio.allocations.map(item => [item.id, item])
  )

  const savingsBreakdown = appliances.map(appliance => {
    const currentKwh = appliance.estimatedKwh || 0
    const reduceHoursKwh = Math.max(0, currentKwh * 0.85)
    const inverterKwh =
      appliance.type.toLowerCase() === 'inverter' ? currentKwh : Math.max(0, currentKwh * 0.7)

    const reduceHoursSavings = estimateHouseholdSavingsFromApplianceDelta(
      portfolio.totalKwh,
      currentKwh,
      reduceHoursKwh
    )
    const inverterSavings =
      appliance.type.toLowerCase() === 'inverter'
        ? 0
        : estimateHouseholdSavingsFromApplianceDelta(
            portfolio.totalKwh,
            currentKwh,
            inverterKwh
          )
    const bestSavings = round2(Math.max(reduceHoursSavings, inverterSavings))
    const recommendedAction =
      inverterSavings > reduceHoursSavings
        ? 'Upgrade to inverter mode/device'
        : 'Reduce daily runtime by 15%'

    return {
      applianceId: appliance.id,
      id: appliance.id,
      name: appliance.name,
      category: appliance.category,
      currentKwh: round2(currentKwh),
      currentCost: allocationById.get(appliance.id)?.estimatedCost || 0,
      potentialSavings: bestSavings,
      scenarios: {
        usageReduction: round2(reduceHoursSavings),
        inverterUpgrade: round2(inverterSavings)
      },
      recommendedAction
    }
  })

  const totalPotential = round2(
    savingsBreakdown.reduce((sum, item) => sum + item.potentialSavings, 0)
  )

  return {
    appliances,
    savingsBreakdown,
    totalPotential
  }
}

function buildActionPlan(
  daysRemaining: number,
  loadBalancing: ReturnType<typeof buildLoadBalancingPlans>,
  topApplianceActions: string[]
) {
  const plan: Array<{
    date: string
    dayName: string
    recommendation: string
    priority: Priority
    expectedSavings: number
  }> = []

  const today = new Date()
  const horizon = Math.max(1, Math.min(7, daysRemaining || 7))
  for (let i = 0; i < horizon; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const recommendation =
      i === 0 && loadBalancing.recommended
        ? `Apply load shift plan: ${loadBalancing.plans[0]?.fromLabel} -> ${loadBalancing.plans[0]?.toLabel}.`
        : topApplianceActions[i % Math.max(1, topApplianceActions.length)] ||
          'Trim peak-hour usage and monitor next reading impact.'

    plan.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      recommendation,
      priority: i < 2 ? 'high' : 'medium',
      expectedSavings: round2(
        loadBalancing.recommended ? loadBalancing.estimatedSavingsPkr / horizon : 120
      )
    })
  }
  return plan
}

export async function buildOptimizationPayload(params: {
  userId: string
  meterId?: string
  budgetOverride?: number | null
  source: 'stats' | 'suggest'
  includeAppliances?: boolean
}) {
  const { userId, meterId, budgetOverride, source, includeAppliances = true } = params

  const stats = await computeStatsBundle(userId, meterId)
  const meterBreakdown = await getMeterProjections(userId, meterId)
  const loadBalancing = buildLoadBalancingPlans(meterBreakdown)
  const applianceData = includeAppliances
    ? await buildApplianceSavings(userId)
    : { appliances: [], savingsBreakdown: [], totalPotential: 0 }

  const parsedBudget = budgetOverride ?? null
  const budgetTarget =
    parsedBudget && parsedBudget > 0 ? parsedBudget : stats.budget.monthly_budget_pkr || 0
  const projectedCost = stats.forecast.cost_pkr
  const budgetStatus =
    budgetTarget <= 0
      ? 'no_budget'
      : projectedCost > budgetTarget
        ? 'over_budget'
        : projectedCost > budgetTarget * 0.9
          ? 'at_risk'
          : 'on_track'

  const topAppliances = [...applianceData.savingsBreakdown]
    .sort((a, b) => b.potentialSavings - a.potentialSavings)
    .slice(0, 3)
  const applianceTips = topAppliances.map(
    appliance =>
      `${appliance.name}: ${appliance.recommendedAction} (save about Rs ${appliance.potentialSavings.toLocaleString()}/month).`
  )

  const slabRiskMeter = [...meterBreakdown].sort((a, b) => a.headroomKwh - b.headroomKwh)[0]
  const slabAdvice = slabRiskMeter
    ? slabRiskMeter.headroomKwh <= 20
      ? `${slabRiskMeter.label} has only ${round2(slabRiskMeter.headroomKwh)} kWh slab headroom. Prioritize shifting load from this meter.`
      : `${slabRiskMeter.label} has ${round2(slabRiskMeter.headroomKwh)} kWh slab headroom. Keep heavy loads within this envelope.`
    : 'No meter projection available for slab advice.'

  const meterStrategy = loadBalancing.recommended
    ? `Shift ${loadBalancing.totalShiftKwh.toLocaleString()} kWh from higher-rate meters to lower-rate headroom this cycle.`
    : 'No strong dual-meter shift opportunity detected. Focus on appliance-level runtime optimization.'

  const budgetOpportunitySavings =
    budgetStatus === 'over_budget' ? round2(Math.max(0, projectedCost - budgetTarget) * 0.4) : 0
  const potentialSavings = round2(
    loadBalancing.estimatedSavingsPkr + applianceData.totalPotential + budgetOpportunitySavings
  )

  const opportunities: Array<{
    id: string
    type: string
    title: string
    description: string
    potential_savings: number
    priority: Priority
    actions: string[]
    meterId?: string
    applianceId?: string
  }> = []

  if (budgetStatus === 'over_budget' && budgetTarget > 0) {
    opportunities.push({
      id: 'budget-recovery',
      type: 'budget',
      title: 'Budget Recovery Plan',
      description: `Forecast exceeds budget by Rs ${round2(projectedCost - budgetTarget).toLocaleString()}.`,
      potential_savings: budgetOpportunitySavings,
      priority: 'high',
      actions: [
        'Apply load-balancing actions for next 7 days',
        'Trim top appliance runtime by 10-15%',
        'Recheck forecast after next reading'
      ]
    })
  }

  if (loadBalancing.recommended) {
    opportunities.push({
      id: 'dual-meter-balance',
      type: 'load_balancing',
      title: 'Dual-Meter Load Balancing',
      description: loadBalancing.rationale,
      potential_savings: loadBalancing.estimatedSavingsPkr,
      priority: priorityFromSavings(loadBalancing.estimatedSavingsPkr),
      actions: loadBalancing.plans.map(
        plan =>
          `Shift ${plan.shiftKwh} kWh from ${plan.fromLabel} to ${plan.toLabel} (save Rs ${plan.estimatedSavingsPkr}).`
      )
    })
  }

  for (const appliance of topAppliances) {
    if (appliance.potentialSavings <= 0) continue
    opportunities.push({
      id: `appliance-${appliance.applianceId}`,
      type: 'appliance_optimization',
      title: `${appliance.name} Optimization`,
      description: `High-impact appliance action: ${appliance.recommendedAction}.`,
      potential_savings: appliance.potentialSavings,
      priority: priorityFromSavings(appliance.potentialSavings),
      actions: [
        appliance.recommendedAction,
        'Track reading impact for 7 days',
        'Lock in new usage schedule if savings persist'
      ],
      applianceId: appliance.applianceId
    })
  }

  const priorityActions = opportunities
    .sort((a, b) => b.potential_savings - a.potential_savings)
    .slice(0, 4)
    .map(opportunity => ({
      action: opportunity.title,
      impact: `Rs ${opportunity.potential_savings.toLocaleString()}/month`,
      difficulty:
        opportunity.type === 'load_balancing'
          ? 'Medium'
          : opportunity.type === 'appliance_optimization'
            ? 'Easy'
            : 'Medium',
      timeframe: opportunity.priority === 'high' ? 'Today' : 'This week'
    }))

  const actionPlan = buildActionPlan(
    stats.window.daysInMonth - stats.window.daysElapsed,
    loadBalancing,
    topAppliances.map(appliance => `${appliance.name}: ${appliance.recommendedAction}`)
  )

  const averageHeadroom =
    meterBreakdown.length > 0
      ? meterBreakdown.reduce((sum, meter) => sum + meter.headroomKwh, 0) / meterBreakdown.length
      : 0

  const insights = {
    budget_status: budgetStatus,
    efficiency_score: round2(stats.mtd.efficiency_score),
    peak_optimization_potential: round2(
      Math.min(35, Math.max(5, (stats.forecast.vs_prev_full.pct_cost > 0 ? 18 : 10) + opportunities.length * 2))
    ),
    slab_optimization_score: round2(Math.max(30, Math.min(95, averageHeadroom / 2 + 45)))
  }

  const recommendation = {
    meter_strategy: meterStrategy,
    slab_advice: slabAdvice,
    appliance_tips: applianceTips.length > 0 ? applianceTips : ['Add appliances in Devices to unlock targeted tips.'],
    expected_savings: `Rs ${potentialSavings.toLocaleString()}/month`
  }

  const optimizationPayload = {
    potential_savings_pkr: potentialSavings,
    savingsBreakdown: applianceData.savingsBreakdown,
    opportunities,
    recommendation,
    priority_actions: priorityActions,
    action_plan: actionPlan,
    insights,
    load_balancing: {
      recommended: loadBalancing.recommended,
      total_shift_kwh: loadBalancing.totalShiftKwh,
      estimated_savings_pkr: loadBalancing.estimatedSavingsPkr,
      plans: loadBalancing.plans,
      meter_headroom: meterBreakdown.map(meter => ({
        meterId: meter.meterId,
        label: meter.label,
        projectedUsage: meter.projectedUsage,
        currentRate: meter.currentRate,
        headroomKwh: meter.headroomKwh,
        slabMax: meter.slabMax
      })),
      rationale: loadBalancing.rationale
    },
    summary: {
      budget_status: budgetStatus,
      projected_usage_kwh: stats.forecast.usage_kwh,
      projected_cost_pkr: projectedCost,
      budget_pkr: budgetTarget || null,
      days_elapsed: stats.window.daysElapsed,
      days_remaining: stats.window.daysInMonth - stats.window.daysElapsed
    },
    meterBreakdown,
    metadata: {
      generatedAt: new Date().toISOString(),
      source,
      confidence: round2(
        Math.max(60, Math.min(96, (stats.window.daysElapsed / stats.window.daysInMonth) * 100))
      ),
      meterId: meterId || 'all',
      appliancesAnalyzed: applianceData.appliances.length
    },
    optimization: {
      recommendation,
      priority_actions: priorityActions,
      action_plan: actionPlan,
      insights,
      load_balancing: {
        recommended: loadBalancing.recommended,
        total_shift_kwh: loadBalancing.totalShiftKwh,
        estimated_savings_pkr: loadBalancing.estimatedSavingsPkr,
        plans: loadBalancing.plans
      }
    }
  }

  return {
    stats,
    optimization: optimizationPayload
  }
}
