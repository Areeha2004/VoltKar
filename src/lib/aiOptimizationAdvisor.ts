import { StatsBundle } from './statService'

type Priority = 'high' | 'medium' | 'low'
type Effort = 'easy' | 'medium' | 'hard'
type BudgetMode = 'recovery' | 'watch' | 'safe'
type MeterMode = 'single_meter' | 'dual_meter'

export interface AiRecommendation {
  id: string
  title: string
  reason: string
  target: 'meter' | 'device' | 'budget' | 'behavior'
  priority: Priority
  effort: Effort
  timeframe: 'today' | 'this_week' | 'this_month'
  estimatedSavingsPkr: number
  steps: string[]
}

export interface AiWarning {
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  cta?: { label: string; href: string }
}

export interface AiOptimizationPlan {
  version: 1
  meterMode: MeterMode
  budgetMode: BudgetMode
  summary: string
  recommendations: AiRecommendation[]
  meterLoadPlan: {
    applicable: boolean
    rationale: string
    actions: Array<{
      fromMeter: string
      toMeter: string
      shiftKwh: number
      estimatedSavingsPkr: number
      reason: string
    }>
  }
  devicePlan: {
    runtimeRules: string[]
    topDevices: Array<{
      name: string
      category: string
      currentKwh: number
      currentCost: number
      action: string
      estimatedSavingsPkr: number
    }>
  }
  warnings: AiWarning[]
  metadata: {
    source: 'openai_function' | 'fallback_rules'
    featureEnabled: boolean
    model: string
    generatedAt: string
    note?: string
  }
}

export interface AiAdvisorContext {
  stats: StatsBundle
  optimization: any
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function safePriority(value: string): Priority {
  if (value === 'high' || value === 'medium' || value === 'low') return value
  return 'medium'
}

function safeEffort(value: string): Effort {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value
  return 'medium'
}

function buildFallbackPlan(context: AiAdvisorContext): AiOptimizationPlan {
  const optimization = context.optimization || {}
  const summary = optimization.summary || {}
  const loadBalancing = optimization.load_balancing || {}
  const savingsBreakdown = Array.isArray(optimization.savingsBreakdown) ? optimization.savingsBreakdown : []
  const opportunities = Array.isArray(optimization.opportunities) ? optimization.opportunities : []
  const meterCount = Array.isArray(optimization.meterBreakdown) ? optimization.meterBreakdown.length : 1

  const budgetMode: BudgetMode =
    summary.budget_status === 'over_budget'
      ? 'recovery'
      : summary.budget_status === 'at_risk'
        ? 'watch'
        : 'safe'
  const meterMode: MeterMode = meterCount >= 2 ? 'dual_meter' : 'single_meter'

  const recommendations: AiRecommendation[] = opportunities.slice(0, 5).map((item: any, idx: number) => ({
    id: String(item.id || `rec-${idx + 1}`),
    title: String(item.title || 'Optimization Action'),
    reason: String(item.description || 'Action derived from projected usage and tariff behavior.'),
    target:
      item.type === 'load_balancing'
        ? 'meter'
        : item.type === 'appliance_optimization'
          ? 'device'
          : item.type === 'budget'
            ? 'budget'
            : 'behavior',
    priority: safePriority(String(item.priority || 'medium')),
    effort:
      item.type === 'load_balancing'
        ? 'medium'
        : item.type === 'budget'
          ? 'hard'
          : 'easy',
    timeframe: item.priority === 'high' ? 'today' : 'this_week',
    estimatedSavingsPkr: round2(Number(item.potential_savings) || 0),
    steps: Array.isArray(item.actions) ? item.actions.slice(0, 4).map(String) : []
  }))

  const warnings: AiWarning[] = []
  if (summary.budget_status === 'over_budget' && summary.budget_pkr) {
    const gap = Math.max(0, (summary.projected_cost_pkr || 0) - (summary.budget_pkr || 0))
    warnings.push({
      severity: gap > summary.budget_pkr * 0.2 ? 'critical' : 'high',
      title: 'Forecast Over Budget',
      message: `Projected cost exceeds budget by Rs ${round2(gap).toLocaleString()}.`,
      cta: { label: 'Open Optimization', href: '/optimization' }
    })
  }

  return {
    version: 1,
    meterMode,
    budgetMode,
    summary:
      meterMode === 'dual_meter'
        ? 'Use both meter-level slab balancing and appliance runtime control.'
        : 'Single-meter strategy: focus on runtime discipline and device-level savings.',
    recommendations,
    meterLoadPlan: {
      applicable: Boolean(loadBalancing.recommended),
      rationale: String(loadBalancing.rationale || 'No cross-meter shift opportunity detected.'),
      actions: Array.isArray(loadBalancing.plans)
        ? loadBalancing.plans.slice(0, 3).map((plan: any) => ({
            fromMeter: String(plan.fromLabel || ''),
            toMeter: String(plan.toLabel || ''),
            shiftKwh: round2(Number(plan.shiftKwh) || 0),
            estimatedSavingsPkr: round2(Number(plan.estimatedSavingsPkr) || 0),
            reason: String(plan.reason || '')
          }))
        : []
    },
    devicePlan: {
      runtimeRules: [
        'Reduce top device runtime during peak hours.',
        'Keep high-load usage inside slab headroom.',
        'Review impact after next reading and recalibrate.'
      ],
      topDevices: savingsBreakdown.slice(0, 5).map((device: any) => ({
        name: String(device.name || 'Device'),
        category: String(device.category || 'General'),
        currentKwh: round2(Number(device.currentKwh) || 0),
        currentCost: round2(Number(device.currentCost) || 0),
        action: String(device.recommendedAction || 'Reduce runtime by 10-15%.'),
        estimatedSavingsPkr: round2(Number(device.potentialSavings) || 0)
      }))
    },
    warnings,
    metadata: {
      source: 'fallback_rules',
      featureEnabled: false,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      generatedAt: new Date().toISOString(),
      note: 'AI suggestions disabled or unavailable; using deterministic optimization rules.'
    }
  }
}

function buildAiFunctionSchema() {
  return {
    name: 'emit_optimization_plan',
    description:
      'Return a structured optimization plan for Pakistani household electricity usage with one or two meters.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        summary: { type: 'string' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              reason: { type: 'string' },
              target: { type: 'string', enum: ['meter', 'device', 'budget', 'behavior'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              timeframe: { type: 'string', enum: ['today', 'this_week', 'this_month'] },
              estimatedSavingsPkr: { type: 'number' },
              steps: { type: 'array', items: { type: 'string' } }
            },
            required: ['id', 'title', 'reason', 'target', 'priority', 'effort', 'timeframe', 'estimatedSavingsPkr', 'steps']
          }
        },
        meterLoadPlan: {
          type: 'object',
          additionalProperties: false,
          properties: {
            applicable: { type: 'boolean' },
            rationale: { type: 'string' },
            actions: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  fromMeter: { type: 'string' },
                  toMeter: { type: 'string' },
                  shiftKwh: { type: 'number' },
                  estimatedSavingsPkr: { type: 'number' },
                  reason: { type: 'string' }
                },
                required: ['fromMeter', 'toMeter', 'shiftKwh', 'estimatedSavingsPkr', 'reason']
              }
            }
          },
          required: ['applicable', 'rationale', 'actions']
        },
        devicePlan: {
          type: 'object',
          additionalProperties: false,
          properties: {
            runtimeRules: { type: 'array', items: { type: 'string' } },
            topDevices: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  name: { type: 'string' },
                  category: { type: 'string' },
                  currentKwh: { type: 'number' },
                  currentCost: { type: 'number' },
                  action: { type: 'string' },
                  estimatedSavingsPkr: { type: 'number' }
                },
                required: ['name', 'category', 'currentKwh', 'currentCost', 'action', 'estimatedSavingsPkr']
              }
            }
          },
          required: ['runtimeRules', 'topDevices']
        },
        warnings: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              title: { type: 'string' },
              message: { type: 'string' },
              cta: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  label: { type: 'string' },
                  href: { type: 'string' }
                },
                required: ['label', 'href']
              }
            },
            required: ['severity', 'title', 'message']
          }
        }
      },
      required: ['summary', 'recommendations', 'meterLoadPlan', 'devicePlan', 'warnings']
    }
  }
}

export async function generateAiOptimizationPlan(context: AiAdvisorContext): Promise<AiOptimizationPlan> {
  const fallback = buildFallbackPlan(context)
  const aiEnabled = process.env.AI_SUGGESTIONS_ENABLED === 'true'
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  if (!aiEnabled || !apiKey) {
    return {
      ...fallback,
      metadata: {
        ...fallback.metadata,
        featureEnabled: aiEnabled,
        model
      }
    }
  }

  try {
    const optimization = context.optimization || {}
    const summary = optimization.summary || {}
    const meterCount = Array.isArray(optimization.meterBreakdown) ? optimization.meterBreakdown.length : 1
    const budgetMode: BudgetMode =
      summary.budget_status === 'over_budget'
        ? 'recovery'
        : summary.budget_status === 'at_risk'
          ? 'watch'
          : 'safe'
    const meterMode: MeterMode = meterCount >= 2 ? 'dual_meter' : 'single_meter'

    const promptContext = {
      meterMode,
      budgetMode,
      meterCount,
      budget: {
        status: summary.budget_status,
        targetPkr: summary.budget_pkr || null,
        projectedCostPkr: summary.projected_cost_pkr || 0
      },
      forecast: {
        usageKwh: summary.projected_usage_kwh || context.stats.forecast.usage_kwh,
        costPkr: summary.projected_cost_pkr || context.stats.forecast.cost_pkr
      },
      loadBalancing: optimization.load_balancing || {},
      opportunities: Array.isArray(optimization.opportunities)
        ? optimization.opportunities.slice(0, 6)
        : [],
      topDevices: Array.isArray(optimization.savingsBreakdown)
        ? optimization.savingsBreakdown.slice(0, 5)
        : []
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are an electricity optimization expert for Pakistani households. Always produce practical, numeric, budget-aware advice. If one meter: focus device runtime/load shaping. If two or more meters: include slab-aware unit split across meters plus device actions. If over budget: stronger recovery actions; otherwise lighter maintenance actions.'
          },
          {
            role: 'user',
            content:
              `Build optimization plan using this context JSON:\n${JSON.stringify(promptContext)}\nConstraints: do not assume devices are physically split per meter; load balancing means planned unit distribution across meter slabs. Keep steps concise and actionable.`
          }
        ],
        tools: [{ type: 'function', function: buildAiFunctionSchema() }],
        tool_choice: { type: 'function', function: { name: 'emit_optimization_plan' } }
      })
    })

    if (!response.ok) {
      return fallback
    }

    const data = await response.json()
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0]
    const argsRaw = toolCall?.function?.arguments
    if (!argsRaw) {
      return fallback
    }

    const parsed = JSON.parse(argsRaw)
    const aiPlan: AiOptimizationPlan = {
      version: 1,
      meterMode,
      budgetMode,
      summary: String(parsed.summary || fallback.summary),
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.slice(0, 8).map((item: any, idx: number) => ({
            id: String(item.id || `ai-rec-${idx + 1}`),
            title: String(item.title || 'Optimization Action'),
            reason: String(item.reason || ''),
            target: ['meter', 'device', 'budget', 'behavior'].includes(item.target) ? item.target : 'behavior',
            priority: safePriority(String(item.priority || 'medium')),
            effort: safeEffort(String(item.effort || 'medium')),
            timeframe: ['today', 'this_week', 'this_month'].includes(item.timeframe) ? item.timeframe : 'this_week',
            estimatedSavingsPkr: round2(Number(item.estimatedSavingsPkr) || 0),
            steps: Array.isArray(item.steps) ? item.steps.slice(0, 6).map(String) : []
          }))
        : fallback.recommendations,
      meterLoadPlan: {
        applicable: Boolean(parsed?.meterLoadPlan?.applicable),
        rationale: String(parsed?.meterLoadPlan?.rationale || fallback.meterLoadPlan.rationale),
        actions: Array.isArray(parsed?.meterLoadPlan?.actions)
          ? parsed.meterLoadPlan.actions.slice(0, 4).map((action: any) => ({
              fromMeter: String(action.fromMeter || ''),
              toMeter: String(action.toMeter || ''),
              shiftKwh: round2(Number(action.shiftKwh) || 0),
              estimatedSavingsPkr: round2(Number(action.estimatedSavingsPkr) || 0),
              reason: String(action.reason || '')
            }))
          : fallback.meterLoadPlan.actions
      },
      devicePlan: {
        runtimeRules: Array.isArray(parsed?.devicePlan?.runtimeRules)
          ? parsed.devicePlan.runtimeRules.slice(0, 8).map(String)
          : fallback.devicePlan.runtimeRules,
        topDevices: Array.isArray(parsed?.devicePlan?.topDevices)
          ? parsed.devicePlan.topDevices.slice(0, 6).map((device: any) => ({
              name: String(device.name || 'Device'),
              category: String(device.category || 'General'),
              currentKwh: round2(Number(device.currentKwh) || 0),
              currentCost: round2(Number(device.currentCost) || 0),
              action: String(device.action || 'Reduce runtime'),
              estimatedSavingsPkr: round2(Number(device.estimatedSavingsPkr) || 0)
            }))
          : fallback.devicePlan.topDevices
      },
      warnings: Array.isArray(parsed?.warnings)
        ? parsed.warnings.slice(0, 5).map((warning: any) => ({
            severity: ['low', 'medium', 'high', 'critical'].includes(warning.severity)
              ? warning.severity
              : 'medium',
            title: String(warning.title || 'Usage Alert'),
            message: String(warning.message || ''),
            ...(warning.cta?.label && warning.cta?.href
              ? {
                  cta: {
                    label: String(warning.cta.label),
                    href: String(warning.cta.href)
                  }
                }
              : {})
          }))
        : fallback.warnings,
      metadata: {
        source: 'openai_function',
        featureEnabled: true,
        model,
        generatedAt: new Date().toISOString()
      }
    }

    return aiPlan
  } catch (error) {
    console.error('AI optimization advisor failed, falling back to rules:', error)
    return {
      ...fallback,
      metadata: {
        ...fallback.metadata,
        featureEnabled: true,
        model
      }
    }
  }
}
