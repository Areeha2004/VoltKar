import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { 
  calculateEstimatedKwh, 
  calculateApplianceCost,
  generateOptimizationSuggestions,
  getEfficiencyRating
} from '@/lib/applianceCalculations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const applianceId = searchParams.get('applianceId')

    // Build query conditions
    const whereConditions: any = {
      userId: session.user.id
    }

    if (applianceId) {
      whereConditions.id = applianceId
    }

    // Fetch appliances
    const appliances = await prisma.appliance.findMany({
      where: whereConditions
    })

    if (appliances.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          optimizations: [],
          summary: {
            totalPotentialSavings: 0,
            appliancesAnalyzed: 0
          }
        }
      })
    }

    // Generate optimizations for each appliance
    const optimizations = appliances.map(appliance => {
      const currentKwh = appliance.estimatedKwh || 0
      const currentCost = calculateApplianceCost(currentKwh)
      const efficiency = getEfficiencyRating(
        appliance.wattage,
        appliance.hoursPerDay,
        appliance.type,
        appliance.category
      )

      // Calculate potential savings scenarios
      const scenarios = {
        reduceHours: {
          description: 'Reduce usage by 2 hours daily',
          newHours: Math.max(1, appliance.hoursPerDay - 2),
          savings: 0
        },
        upgradeToInverter: {
          description: 'Upgrade to inverter technology',
          applicable: appliance.type !== 'Inverter',
          savings: 0
        },
        optimizeSchedule: {
          description: 'Use during off-peak hours',
          savings: currentCost * 0.15 // Assume 15% savings from peak avoidance
        }
      }

      // Calculate reduce hours savings
      const reducedKwh = calculateEstimatedKwh(
        appliance.wattage,
        scenarios.reduceHours.newHours,
        appliance.daysPerMonth,
        appliance.type
      )
      scenarios.reduceHours.savings = currentCost - calculateApplianceCost(reducedKwh)

      // Calculate inverter upgrade savings
      if (scenarios.upgradeToInverter.applicable) {
        const inverterKwh = calculateEstimatedKwh(
          appliance.wattage,
          appliance.hoursPerDay,
          appliance.daysPerMonth,
          'Inverter'
        )
        scenarios.upgradeToInverter.savings = currentCost - calculateApplianceCost(inverterKwh)
      }
      
            const suggestions = generateOptimizationSuggestions({ ...appliance, estimatedKwh: appliance.estimatedKwh ?? undefined, contribution: appliance.contribution || 0 })
      const totalPotentialSavings = Object.values(scenarios)
        .filter(s => ('applicable' in s ? s.applicable !== false : true))
        .reduce((sum, s) => sum + s.savings, 0)

      return {
        appliance: {
          id: appliance.id,
          name: appliance.name,
          category: appliance.category,
          type: appliance.type,
          currentKwh,
          currentCost: Math.round(currentCost),
          efficiency
        },
        scenarios: Object.entries(scenarios)
          .filter(([_, scenario]) => ('applicable' in scenario ? scenario.applicable !== false : true))
          .map(([key, scenario]) => ({
            id: key,
            description: scenario.description,
            potentialSavings: Math.round(scenario.savings),
            priority: scenario.savings > 200 ? 'high' : scenario.savings > 100 ? 'medium' : 'low'
          })),
        suggestions,
        totalPotentialSavings: Math.round(totalPotentialSavings)
      }
    })

    // Calculate summary
    const totalPotentialSavings = optimizations.reduce(
      (sum, opt) => sum + opt.totalPotentialSavings, 0
    )

    return NextResponse.json({
      success: true,
      data: {
        optimizations,
        summary: {
          totalPotentialSavings,
          appliancesAnalyzed: appliances.length,
          averageSavingsPerAppliance: appliances.length > 0 ? 
            Math.round(totalPotentialSavings / appliances.length) : 0
        }
      }
    })

  } catch (error) {
    console.error('Error generating optimizations:', error)
    return NextResponse.json(
      { error: 'Failed to generate optimizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applianceId, optimizationType } = await request.json()

    if (!applianceId || !optimizationType) {
      return NextResponse.json(
        { error: 'Appliance ID and optimization type are required' },
        { status: 400 }
      )
    }

    // Verify appliance ownership
    const appliance = await prisma.appliance.findFirst({
      where: {
        id: applianceId,
        userId: session.user.id
      }
    })

    if (!appliance) {
      return NextResponse.json({ error: 'Appliance not found' }, { status: 404 })
    }

    let updateData: any = {}

    // Apply optimization based on type
    switch (optimizationType) {
      case 'reduceHours':
        updateData.hoursPerDay = Math.max(1, appliance.hoursPerDay - 2)
        break
      
      case 'upgradeToInverter':
        if (appliance.type !== 'Inverter') {
          updateData.type = 'Inverter'
        }
        break
      
      case 'optimizeSchedule':
        // This would typically involve scheduling logic
        // For now, we'll just mark it as optimized in notes or a flag
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid optimization type' },
          { status: 400 }
        )
    }

    // Recalculate kWh if parameters changed
    if (updateData.hoursPerDay || updateData.type) {
      updateData.estimatedKwh = calculateEstimatedKwh(
        appliance.wattage,
        updateData.hoursPerDay || appliance.hoursPerDay,
        appliance.daysPerMonth,
        updateData.type || appliance.type
      )
    }

    // Update the appliance
    const updatedAppliance = await prisma.appliance.update({
      where: { id: applianceId },
      data: updateData
    })

    // Recalculate contributions for all user appliances
    await recalculateUserContributions(session.user.id)

    // Calculate savings
    const oldCost = calculateApplianceCost(appliance.estimatedKwh || 0)
    const newCost = calculateApplianceCost(updatedAppliance.estimatedKwh || 0)
    const savings = oldCost - newCost

    return NextResponse.json({
      success: true,
      data: {
        appliance: updatedAppliance,
        optimization: {
          type: optimizationType,
          savings: Math.round(savings),
          oldCost: Math.round(oldCost),
          newCost: Math.round(newCost)
        }
      }
    })

  } catch (error) {
    console.error('Error applying optimization:', error)
    return NextResponse.json(
      { error: 'Failed to apply optimization' },
      { status: 500 }
    )
  }
}

/**
 * Recalculate contributions for all appliances of a user
 */
async function recalculateUserContributions(userId: string): Promise<void> {
  try {
    // Fetch all user appliances
    const appliances = await prisma.appliance.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        wattage: true,
        hoursPerDay: true,
        daysPerMonth: true,
        estimatedKwh: true,
        createdAt: true
      }
    })

    // Calculate contributions
    const { calculateContributions } = await import('@/lib/applianceCalculations')
    const validAppliances = appliances.map(appliance => ({
          ...appliance,
          estimatedKwh: appliance.estimatedKwh ?? undefined
        }))
        const calculations = calculateContributions(validAppliances)

    // Update each appliance with new contribution
    const updatePromises = appliances.map((appliance, index) => {
      const calculation = calculations[index]
      return prisma.appliance.update({
        where: { id: appliance.id },
        data: {
          estimatedKwh: calculation.estimatedKwh,
          contribution: calculation.contribution
        }
      })
    })

    await Promise.all(updatePromises)
  } catch (error) {
    console.error('Error recalculating contributions:', error)
    throw error
  }
}