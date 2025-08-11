import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { calculateElectricityBill } from '@/lib/slabCalculations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reading, month, year, notes } = await request.json()
    const readingId = params.id

    // Verify reading belongs to user
    const existingReading = await prisma.meterReading.findFirst({
      where: {
        id: readingId,
        userId: session.user.id
      }
    })

    if (!existingReading) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    const updatedReading = await prisma.meterReading.update({
      where: { id: readingId },
      data: {
        reading: parseFloat(reading),
        month,
        year,
        notes: notes?.trim() || null
      },
      include: {
        meter: true
      }
    })

    // Calculate usage
    const previousReading = await prisma.meterReading.findFirst({
      where: {
        meterId: updatedReading.meterId,
        createdAt: { lt: updatedReading.createdAt }
      },
      orderBy: { createdAt: 'desc' }
    })

    const usage = previousReading 
      ? Math.max(0, updatedReading.reading - previousReading.reading)
      : 0

    let estimatedCost = 0
    let costBreakdown = null
    
    if (usage > 0) {
      costBreakdown = calculateElectricityBill(usage)
      estimatedCost = Math.round(costBreakdown.totalCost)
    }

    // Update the reading with calculated values
    const finalReading = await prisma.meterReading.update({
      where: { id: readingId },
      data: {
        usage,
        estimatedCost
      },
      include: { meter: true }
    })

    return NextResponse.json({ 
      reading: {
        ...finalReading,
        usage,
        estimatedCost,
        slabWarning: costBreakdown?.slabWarning || false,
        costBreakdown: costBreakdown
      }
    })
  } catch (error) {
    console.error('Error updating reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const readingId = params.id

    // Verify reading belongs to user
    const existingReading = await prisma.meterReading.findFirst({
      where: {
        id: readingId,
        userId: session.user.id
      }
    })

    if (!existingReading) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    await prisma.meterReading.delete({
      where: { id: readingId }
    })

    return NextResponse.json({ message: 'Reading deleted successfully' })
  } catch (error) {
    console.error('Error deleting reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}