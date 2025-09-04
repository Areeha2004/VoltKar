import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { computeStatsBundle } from '../../../../lib/statService'
import prisma from '@/lib/prisma'
import { tariffEngine } from '@/lib/tariffEngine'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')

    // Get main stats bundle
    const statsBundle = await computeStatsBundle(session.user.id, meterId || undefined)

    // Get appliances for detailed savings calculation
    const appliances = await prisma.appliance.findMany({
      where: { userId: session.user.id },
      orderBy: { estimatedKwh: 'desc' }
    })

    // Calculate detailed potential savings
    let detailedSavings = 0
    const savingsBreakdown = appliances.map(appliance => {
      // Calculate potential savings scenarios
      const currentKwh = appliance.estimatedKwh || 0
      const currentCost = currentKwh > 0 ? tariffEngine(currentKwh).totalCost : 0
      
      // Scenario 1: Reduce usage by 20%
      const reducedKwh = currentKwh * 0.8
      const reducedCost = reducedKwh > 0 ? tariffEngine(reducedKwh).totalCost : 0
      const usageReductionSavings = currentCost - reducedCost
      
      // Scenario 2: Upgrade to inverter (if not already)
      let inverterSavings = 0
      if (appliance.type !== 'Inverter') {
        const inverterKwh = currentKwh * 0.7 // 30% more efficient
        const inverterCost = inverterKwh > 0 ? tariffEngine(inverterKwh).totalCost : 0
        inverterSavings = currentCost - inverterCost
      }
      
      const totalPotential = Math.max(usageReductionSavings, inverterSavings)
      detailedSavings += totalPotential
      
      return {
        applianceId: appliance.id,
        name: appliance.name,
        category: appliance.category,
        currentCost,
        potentialSavings: Math.round(totalPotential * 100) / 100,
        scenarios: {
          usageReduction: Math.round(usageReductionSavings * 100) / 100,
          inverterUpgrade: Math.round(inverterSavings * 100) / 100
        }
      }
    })

    // Update optimization metrics with detailed calculation
    const optimizationData = {
      ...statsBundle.optimization,
      potential_savings_pkr: Math.round(detailedSavings * 100) / 100,
      savingsBreakdown,
      opportunities: [
        {
          type: 'appliance_optimization',
          title: 'Appliance Efficiency Improvements',
          description: 'Optimize high-consumption appliances',
          potential_savings: Math.round(detailedSavings * 0.6 * 100) / 100,
          priority: detailedSavings > 1000 ? 'high' : 'medium'
        },
        {
          type: 'usage_timing',
          title: 'Peak Hour Optimization',
          description: 'Shift usage to off-peak hours',
          potential_savings: Math.round(statsBundle.forecast.cost_pkr * 0.1 * 100) / 100,
          priority: 'medium'
        },
        {
          type: 'slab_optimization',
          title: 'Tariff Slab Management',
          description: 'Stay within optimal tariff slabs',
          potential_savings: Math.round(statsBundle.forecast.cost_pkr * 0.05 * 100) / 100,
          priority: 'low'
        }
      ]
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: statsBundle,
        optimization: optimizationData,
        metadata: {
          generatedAt: new Date().toISOString(),
          meterId: meterId || 'all',
          calcId: statsBundle.calcId,
          appliancesAnalyzed: appliances.length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching optimization data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch optimization data' },
      { status: 500 }
    )
  }
}