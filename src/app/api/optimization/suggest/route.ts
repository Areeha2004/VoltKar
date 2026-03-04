import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { buildOptimizationPayload } from '@/lib/optimizationService'
import { generateAiOptimizationPlan } from '@/lib/aiOptimizationAdvisor'

function mapAiPlanToOpportunities(aiPlan: Awaited<ReturnType<typeof generateAiOptimizationPlan>>) {
  return aiPlan.recommendations.map(rec => ({
    id: rec.id,
    type: rec.target === 'meter' ? 'load_balancing' : rec.target === 'device' ? 'appliance_optimization' : rec.target,
    title: rec.title,
    description: rec.reason,
    potential_savings: rec.estimatedSavingsPkr,
    priority: rec.priority,
    actions: rec.steps
  }))
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const meterId =
      typeof body.meterId === 'string' && body.meterId.trim().length > 0
        ? body.meterId
        : undefined
    const includeAppliances = body.includeAppliances !== false
    const budget =
      Number.isFinite(Number(body.budget)) && Number(body.budget) > 0
        ? Number(body.budget)
        : null

    const bundle = await buildOptimizationPayload({
      userId: session.user.id,
      meterId,
      budgetOverride: budget,
      source: 'suggest',
      includeAppliances
    })
    const aiPlan = await generateAiOptimizationPlan({
      stats: bundle.stats,
      optimization: bundle.optimization
    })

    const aiOpportunities = mapAiPlanToOpportunities(aiPlan)
    const aiPriorityActions = aiPlan.recommendations.slice(0, 4).map(rec => ({
      action: rec.title,
      impact: `Rs ${rec.estimatedSavingsPkr.toLocaleString()}/month`,
      difficulty:
        rec.effort === 'easy'
          ? 'Easy'
          : rec.effort === 'hard'
            ? 'Hard'
            : 'Medium',
      timeframe:
        rec.timeframe === 'today'
          ? 'Today'
          : rec.timeframe === 'this_week'
            ? 'This week'
            : 'This month'
    }))

    const enhancedOptimization = {
      ...bundle.optimization,
      opportunities: aiOpportunities.length > 0 ? aiOpportunities : bundle.optimization.opportunities,
      priority_actions:
        aiPriorityActions.length > 0 ? aiPriorityActions : bundle.optimization.priority_actions,
      recommendation: {
        ...(bundle.optimization.recommendation || {}),
        meter_strategy: aiPlan.meterLoadPlan.rationale || bundle.optimization.recommendation?.meter_strategy,
        appliance_tips:
          aiPlan.devicePlan.runtimeRules.length > 0
            ? aiPlan.devicePlan.runtimeRules
            : bundle.optimization.recommendation?.appliance_tips
      },
      ai: aiPlan,
      metadata: {
        ...(bundle.optimization.metadata || {}),
        ai: aiPlan.metadata
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: bundle.stats,
        optimization: enhancedOptimization
      }
    })
  } catch (error) {
    console.error('Error generating optimization suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate optimization suggestions' },
      { status: 500 }
    )
  }
}
