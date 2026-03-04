import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { buildOptimizationPayload } from '@/lib/optimizationService'
import { generateAiOptimizationPlan } from '@/lib/aiOptimizationAdvisor'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    const includeAppliances = searchParams.get('appliances') !== 'false'
    const includeAi = searchParams.get('ai') === 'true'
    const budget =
      Number.isFinite(Number(searchParams.get('budget'))) && Number(searchParams.get('budget')) > 0
        ? Number(searchParams.get('budget'))
        : null

    const bundle = await buildOptimizationPayload({
      userId: session.user.id,
      meterId: meterId || undefined,
      budgetOverride: budget,
      source: 'stats',
      includeAppliances
    })

    const aiPlan = includeAi
      ? await generateAiOptimizationPlan({
          stats: bundle.stats,
          optimization: bundle.optimization
        })
      : null

    return NextResponse.json({
      success: true,
      data: {
        stats: bundle.stats,
        optimization: aiPlan
          ? {
              ...bundle.optimization,
              ai: aiPlan,
              metadata: {
                ...(bundle.optimization.metadata || {}),
                ai: aiPlan.metadata
              }
            }
          : bundle.optimization
      }
    })
  } catch (error) {
    console.error('Error analyzing optimization data:', error)
    return NextResponse.json(
      { error: 'Failed to analyze optimization data' },
      { status: 500 }
    )
  }
}
