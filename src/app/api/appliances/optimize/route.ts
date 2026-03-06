import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import {
  calculateEstimatedKwh, 
  allocateAppliancePortfolioCosts,
  estimateHouseholdSavingsFromApplianceDelta,
  generateOptimizationSuggestions,
  getEfficiencyRating
} from '@/lib/applianceCalculations'
import { tariffEngine } from '@/lib/tariffEngine'
import { getTariffConfigForUser } from '@/lib/userTariff'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

	    const { searchParams } = new URL(request.url)
	    const applianceId = searchParams.get('applianceId')
      const tariffConfig = await getTariffConfigForUser(session.user.id)

    const allUserAppliances = await prisma.appliance.findMany({
      where: { userId: session.user.id }
    })
    const appliances = applianceId
      ? allUserAppliances.filter(appliance => appliance.id === applianceId)
      : allUserAppliances

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

    const totalHouseholdKwh = allUserAppliances.reduce(
      (sum, appliance) => sum + (appliance.estimatedKwh || 0),
      0
    )
	    const portfolio = allocateAppliancePortfolioCosts(
	      allUserAppliances.map(appliance => ({
	        id: appliance.id,
	        estimatedKwh: appliance.estimatedKwh || 0
	      })),
        tariffConfig
	    )
    const allocationById = new Map(
      portfolio.allocations.map(item => [item.id, item])
    )

    // Generate optimizations for each appliance
    const optimizations = appliances.map(appliance => {
      const currentKwh = appliance.estimatedKwh || 0
      const currentCost = allocationById.get(appliance.id)?.estimatedCost || 0
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
          savings: 0
        }
      }

      // Calculate reduce hours savings
      const reducedKwh = calculateEstimatedKwh(
        appliance.wattage,
        scenarios.reduceHours.newHours,
        appliance.daysPerMonth,
        appliance.type
      )
	      scenarios.reduceHours.savings = estimateHouseholdSavingsFromApplianceDelta(
	        totalHouseholdKwh,
	        currentKwh,
	        reducedKwh,
          tariffConfig
	      )

      // Calculate inverter upgrade savings
      if (scenarios.upgradeToInverter.applicable) {
        const inverterKwh = calculateEstimatedKwh(
          appliance.wattage,
          appliance.hoursPerDay,
          appliance.daysPerMonth,
          'Inverter'
        )
	        scenarios.upgradeToInverter.savings = estimateHouseholdSavingsFromApplianceDelta(
	          totalHouseholdKwh,
	          currentKwh,
	          inverterKwh,
            tariffConfig
	        )
	      }
	      scenarios.optimizeSchedule.savings = estimateHouseholdSavingsFromApplianceDelta(
	        totalHouseholdKwh,
	        currentKwh,
	        currentKwh * 0.9,
          tariffConfig
	      )
      
      const suggestions = generateOptimizationSuggestions({ ...appliance, estimatedKwh: appliance.estimatedKwh ?? undefined, contribution: appliance.contribution || 0 })
      const totalPotentialSavings = Object.values(scenarios)
        .filter(s => ('applicable' in s ? s.applicable !== false : true))
        .reduce((max, s) => Math.max(max, s.savings), 0)

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
      const tariffConfig = await getTariffConfigForUser(session.user.id)

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

    const beforeTotalKwhAgg = await prisma.appliance.aggregate({
      where: { userId: session.user.id },
      _sum: { estimatedKwh: true }
    })
    const oldTotalKwh = beforeTotalKwhAgg._sum.estimatedKwh || 0
	    const oldTotalCost = tariffEngine(oldTotalKwh, tariffConfig).totalCost

    // Update the appliance
    const updatedAppliance = await prisma.appliance.update({
      where: { id: applianceId },
      data: updateData
    })

    // Recalculate contributions for all user appliances
    await recalculateUserContributions(session.user.id)

    const afterAppliances = await prisma.appliance.findMany({
      where: { userId: session.user.id },
      select: { id: true, estimatedKwh: true }
    })
	    const afterPortfolio = allocateAppliancePortfolioCosts(
	      afterAppliances.map(item => ({
	        id: item.id,
	        estimatedKwh: item.estimatedKwh || 0
	      })),
        tariffConfig
	    )
    const updatedAllocation = afterPortfolio.allocations.find(item => item.id === updatedAppliance.id)

    const newTotalKwh = afterPortfolio.totalKwh
	    const newTotalCost = tariffEngine(newTotalKwh, tariffConfig).totalCost
    const savings = Math.max(0, oldTotalCost - newTotalCost)

    return NextResponse.json({
      success: true,
      data: {
        appliance: {
          ...updatedAppliance,
          estimatedCost: updatedAllocation?.estimatedCost || 0,
          costPerKwh: updatedAllocation?.costPerKwh || 0
        },
        optimization: {
          type: optimizationType,
          savings: Math.round(savings * 100) / 100,
          oldCost: Math.round(oldTotalCost * 100) / 100,
          newCost: Math.round(newTotalCost * 100) / 100
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
