import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { 
  calculateEstimatedKwh, 
  calculateContributions, 
  allocateAppliancePortfolioCosts,
  validateApplianceData,
  getEfficiencyRating,
  generateOptimizationSuggestions
} from '@/lib/applianceCalculations'
import { computeStatsBundle } from '@/lib/statService'
import { computeApplianceAttribution } from '@/lib/applianceAttribution'
import { getTariffConfigForUser } from '@/lib/userTariff'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const includeOptimizations = searchParams.get('optimizations') === 'true'

    // Build query conditions
    const whereConditions: any = {
      userId: session.user.id
    }

    if (category) {
      whereConditions.category = category
    }

    // Fetch user's appliances
	    const appliances = await prisma.appliance.findMany({
      where: whereConditions,
      orderBy: {
        createdAt: 'desc'
      }
	    })
	    const stats = await computeStatsBundle(session.user.id)
      const tariffConfig = await getTariffConfigForUser(session.user.id)

    // Transform appliances for response
    const appliancesData = appliances.map(appliance => ({
      id: appliance.id,
      name: appliance.name,
      category: appliance.category,
      type: appliance.type,
      wattage: appliance.wattage,
      hoursPerDay: appliance.hoursPerDay,
      daysPerMonth: appliance.daysPerMonth,
      estimatedKwh: appliance.estimatedKwh || 0,
      contribution: appliance.contribution || 0,
      createdAt: appliance.createdAt
    }))

	    const portfolio = allocateAppliancePortfolioCosts(
	      appliancesData.map(appliance => ({
	        id: appliance.id,
	        estimatedKwh: appliance.estimatedKwh || 0
	      })),
        tariffConfig
	    )
    const allocationById = new Map(
      portfolio.allocations.map(item => [item.id, item])
    )
    const attribution = computeApplianceAttribution(
      appliancesData.map(appliance => ({
        id: appliance.id,
        estimatedKwh: appliance.estimatedKwh || 0
      })),
      {
        mtdUsageKwh: stats.mtd.usage_kwh,
        mtdCostPkr: stats.mtd.cost_pkr,
        forecastUsageKwh: stats.forecast.usage_kwh,
        forecastCostPkr: stats.forecast.cost_pkr,
        daysElapsed: stats.window.daysElapsed,
        daysInMonth: stats.window.daysInMonth
      }
    )

    // Cost model: household bill allocated by appliance share (no per-appliance fixed-charge multiplication)
    const appliancesWithCosts = appliancesData.map(appliance => {
      const allocation = allocationById.get(appliance.id)
      const attributionMetrics = attribution.byId[appliance.id]
      const estimatedCost = allocation?.estimatedCost || 0
      const costPerKwh = allocation?.costPerKwh || 0
      const efficiency = getEfficiencyRating(
        appliance.wattage,
        appliance.hoursPerDay,
        appliance.type,
        appliance.category
      )

      return {
        ...appliance,
        estimatedCost,
        costPerKwh: Math.round(costPerKwh * 100) / 100,
        costSharePct: allocation?.sharePct || 0,
        usageSharePct: attributionMetrics?.usageSharePct || 0,
        billSharePct: attributionMetrics?.billSharePct || 0,
        attributedUsageMtdKwh: attributionMetrics?.attributedMtdUsageKwh || 0,
        attributedCostMtdPkr: attributionMetrics?.attributedMtdCostPkr || 0,
        attributedUsageForecastKwh: attributionMetrics?.attributedForecastUsageKwh || 0,
        attributedCostForecastPkr: attributionMetrics?.attributedForecastCostPkr || 0,
        efficiency,
        ...(includeOptimizations && {
          optimizationSuggestions: generateOptimizationSuggestions(appliance)
        })
      }
    })

    // Calculate summary statistics
    const totalKwh = appliancesWithCosts.reduce((sum, app) => sum + (app.estimatedKwh || 0), 0)
    const totalCost = portfolio.totalCost
    const averageEfficiency = appliancesWithCosts.length > 0 ? 
      appliancesWithCosts.filter(app => app.efficiency === 'excellent' || app.efficiency === 'good').length / appliancesWithCosts.length * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        appliances: appliancesWithCosts,
        summary: {
          totalAppliances: appliances.length,
          totalKwh: Math.round(totalKwh * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          averageEfficiency: Math.round(averageEfficiency),
          categories: [...new Set(appliances.map(a => a.category))],
          costModel: 'household_allocated',
          meter: {
            mtdUsageKwh: stats.mtd.usage_kwh,
            mtdCostPkr: stats.mtd.cost_pkr,
            forecastUsageKwh: stats.forecast.usage_kwh,
            forecastCostPkr: stats.forecast.cost_pkr,
            timeframeLabels: stats.timeframeLabels
          },
          consistency: attribution.consistency
        }
      }
    })

  } catch (error) {
    console.error('Error fetching appliances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appliances' },
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

    const body = await request.json()
    const { name, category, type, wattage, hoursPerDay, daysPerMonth } = body

    // Validate input data
    const validation = validateApplianceData({
      name,
      category,
      type,
      wattage: parseFloat(wattage),
      hoursPerDay: parseFloat(hoursPerDay),
      daysPerMonth: parseInt(daysPerMonth)
    })

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Calculate estimated kWh
    const estimatedKwh = calculateEstimatedKwh(
      parseFloat(wattage),
      parseFloat(hoursPerDay),
      parseInt(daysPerMonth),
      type
    )

    // Create the appliance
    const newAppliance = await prisma.appliance.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        category: category.trim(),
        type: type.trim(),
        wattage: parseFloat(wattage),
        hoursPerDay: parseFloat(hoursPerDay),
        daysPerMonth: parseInt(daysPerMonth),
        estimatedKwh
      }
    })

    // Recalculate contributions for all user appliances
    await recalculateUserContributions(session.user.id)

    // Fetch the updated appliance with contribution
    const updatedAppliance = await prisma.appliance.findUnique({
      where: { id: newAppliance.id }
    })

    const allAppliances = await prisma.appliance.findMany({
      where: { userId: session.user.id },
      select: { id: true, estimatedKwh: true }
    })
	    const tariffConfig = await getTariffConfigForUser(session.user.id)
	    const portfolio = allocateAppliancePortfolioCosts(
	      allAppliances.map(item => ({
	        id: item.id,
	        estimatedKwh: item.estimatedKwh || 0
	      })),
        tariffConfig
	    )
    const allocation = portfolio.allocations.find(item => item.id === updatedAppliance?.id)
    const stats = await computeStatsBundle(session.user.id)
    const attribution = computeApplianceAttribution(
      allAppliances.map(item => ({
        id: item.id,
        estimatedKwh: item.estimatedKwh || 0
      })),
      {
        mtdUsageKwh: stats.mtd.usage_kwh,
        mtdCostPkr: stats.mtd.cost_pkr,
        forecastUsageKwh: stats.forecast.usage_kwh,
        forecastCostPkr: stats.forecast.cost_pkr,
        daysElapsed: stats.window.daysElapsed,
        daysInMonth: stats.window.daysInMonth
      }
    )
    const attributionMetrics = updatedAppliance?.id
      ? attribution.byId[updatedAppliance.id]
      : null

    const efficiency = getEfficiencyRating(
      updatedAppliance?.wattage || 0,
      updatedAppliance?.hoursPerDay || 0,
      updatedAppliance?.type || '',
      updatedAppliance?.category || ''
    )

    return NextResponse.json({
      success: true,
      data: {
        appliance: {
          ...updatedAppliance,
          estimatedCost: allocation?.estimatedCost || 0,
          costPerKwh: allocation?.costPerKwh || 0,
          usageSharePct: attributionMetrics?.usageSharePct || 0,
          billSharePct: attributionMetrics?.billSharePct || 0,
          attributedUsageMtdKwh: attributionMetrics?.attributedMtdUsageKwh || 0,
          attributedCostMtdPkr: attributionMetrics?.attributedMtdCostPkr || 0,
          attributedUsageForecastKwh: attributionMetrics?.attributedForecastUsageKwh || 0,
          attributedCostForecastPkr: attributionMetrics?.attributedForecastCostPkr || 0,
          efficiency
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating appliance:', error)
    return NextResponse.json(
      { error: 'Failed to create appliance' },
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

    // Calculate contributions ensuring estimatedKwh is not null
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
