import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { 
  calculateEstimatedKwh, 
  calculateApplianceCost,
  validateApplianceData,
  getEfficiencyRating
} from '@/lib/applianceCalculations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applianceId = params.id
    const body = await request.json()
    const { name, category, type, wattage, hoursPerDay, daysPerMonth } = body

    // Verify appliance ownership
    const existingAppliance = await prisma.appliance.findFirst({
      where: {
        id: applianceId,
        userId: session.user.id
      }
    })

    if (!existingAppliance) {
      return NextResponse.json({ error: 'Appliance not found' }, { status: 404 })
    }

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

    // Calculate new estimated kWh
    const estimatedKwh = calculateEstimatedKwh(
      parseFloat(wattage),
      parseFloat(hoursPerDay),
      parseInt(daysPerMonth),
      type
    )

    // Update the appliance
    const updatedAppliance = await prisma.appliance.update({
      where: { id: applianceId },
      data: {
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

    // Fetch the updated appliance with new contribution
    const finalAppliance = await prisma.appliance.findUnique({
      where: { id: applianceId }
    })

    // Calculate cost and efficiency for response
    const estimatedCost = calculateApplianceCost(finalAppliance?.estimatedKwh || 0)
    const efficiency = getEfficiencyRating(
      finalAppliance?.wattage || 0,
      finalAppliance?.hoursPerDay || 0,
      finalAppliance?.type || '',
      finalAppliance?.category || ''
    )

    return NextResponse.json({
      success: true,
      data: {
        appliance: {
          ...finalAppliance,
          estimatedCost: Math.round(estimatedCost),
          efficiency
        }
      }
    })

  } catch (error) {
    console.error('Error updating appliance:', error)
    return NextResponse.json(
      { error: 'Failed to update appliance' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applianceId = params.id

    // Verify appliance ownership
    const existingAppliance = await prisma.appliance.findFirst({
      where: {
        id: applianceId,
        userId: session.user.id
      }
    })

    if (!existingAppliance) {
      return NextResponse.json({ error: 'Appliance not found' }, { status: 404 })
    }

    // Delete the appliance
    await prisma.appliance.delete({
      where: { id: applianceId }
    })

    // Recalculate contributions for remaining appliances
    await recalculateUserContributions(session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Appliance deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting appliance:', error)
    return NextResponse.json(
      { error: 'Failed to delete appliance' },
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