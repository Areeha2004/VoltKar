import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { 
  calculateEstimatedKwh, 
  calculateContributions, 
  calculateApplianceCost,
  validateApplianceData,
  getEfficiencyRating,
  generateOptimizationSuggestions
} from '@/lib/applianceCalculations'

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

    // Calculate estimated costs using tariff engine
    const appliancesWithCosts = appliancesData.map(appliance => {
      const estimatedCost = calculateApplianceCost(appliance.estimatedKwh || 0)
      const costPerKwh = appliance.estimatedKwh > 0 ? estimatedCost / appliance.estimatedKwh : 0
      const efficiency = getEfficiencyRating(
        appliance.wattage,
        appliance.hoursPerDay,
        appliance.type,
        appliance.category
      )

      return {
        ...appliance,
        estimatedCost: Math.round(estimatedCost),
        costPerKwh: Math.round(costPerKwh * 100) / 100,
        efficiency,
        ...(includeOptimizations && {
          optimizationSuggestions: generateOptimizationSuggestions(appliance)
        })
      }
    })

    // Calculate summary statistics
    const totalKwh = appliancesWithCosts.reduce((sum, app) => sum + (app.estimatedKwh || 0), 0)
    const totalCost = appliancesWithCosts.reduce((sum, app) => sum + app.estimatedCost, 0)
    const averageEfficiency = appliancesWithCosts.length > 0 ? 
      appliancesWithCosts.filter(app => app.efficiency === 'excellent' || app.efficiency === 'good').length / appliancesWithCosts.length * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        appliances: appliancesWithCosts,
        summary: {
          totalAppliances: appliances.length,
          totalKwh: Math.round(totalKwh * 100) / 100,
          totalCost: Math.round(totalCost),
          averageEfficiency: Math.round(averageEfficiency),
          categories: [...new Set(appliances.map(a => a.category))]
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

    // Calculate cost for response
    const estimatedCost = calculateApplianceCost(updatedAppliance?.estimatedKwh || 0)
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
          estimatedCost: Math.round(estimatedCost),
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