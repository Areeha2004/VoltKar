import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { tariffEngine, calculateUsage } from '@/lib/tariffEngine'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reading, week, month, year, isOfficialEndOfMonth, notes } = await request.json()
    const readingId = params.id

    // Verify and load existing reading
    const existing = await prisma.meterReading.findFirst({
      where: { id: readingId, userId: session.user.id },
      include: { meter: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    // Update the reading
    const updatedReading = await prisma.meterReading.update({
      where: { id: readingId },
      data: {
        reading: reading !== undefined ? parseFloat(reading) : existing.reading,
        week: week !== undefined ? week : existing.week,
        month: month !== undefined ? month : existing.month,
        year: year !== undefined ? year : existing.year,
        isOfficialEndOfMonth: isOfficialEndOfMonth !== undefined ? isOfficialEndOfMonth : existing.isOfficialEndOfMonth,
        notes: notes !== undefined ? (notes?.trim() || null) : existing.notes,
      },
      include: { meter: true },
    })

    // Recalculate usage and cost for this reading
    const previousReading = await prisma.meterReading.findFirst({
      where: {
        meterId: updatedReading.meterId,
      
      },
      orderBy: { date: 'desc' },
    })

    const baseValue = previousReading?.reading ?? 0
    const usage = calculateUsage(updatedReading.reading, baseValue)

    let estimatedCost = 0
    if (usage > 0) {
      const costBreakdown = tariffEngine(usage)
      estimatedCost = costBreakdown.totalCost
    }

    // Update usage and cost
    const finalReading = await prisma.meterReading.update({
      where: { id: readingId },
      data: { usage, estimatedCost },
      include: { meter: true },
    })

    // Recalculate usage for all subsequent readings of the same meter
    const subsequentReadings = await prisma.meterReading.findMany({
      where: {
        meterId: updatedReading.meterId,
        date: { gt: updatedReading.date },
      },
      orderBy: { date: 'asc' },
    })

    // Update each subsequent reading
    for (let i = 0; i < subsequentReadings.length; i++) {
      const currentReading = subsequentReadings[i]
      const prevReading = i === 0 ? updatedReading : subsequentReadings[i - 1]
      
      const newUsage = calculateUsage(currentReading.reading, prevReading.reading)
      let newCost = 0
      
      if (newUsage > 0) {
        const costBreakdown = tariffEngine(newUsage)
        newCost = costBreakdown.totalCost
      }

      await prisma.meterReading.update({
        where: { id: currentReading.id },
        data: { 
          usage: newUsage, 
          estimatedCost: newCost 
        },
      })
    }

    return NextResponse.json({ reading: finalReading })
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

    const existing = await prisma.meterReading.findFirst({
      where: { id: readingId, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    // Find the next reading for recalculation
    const nextReading = await prisma.meterReading.findFirst({
      where: {
        meterId: existing.meterId,
        date: { gt: existing.date },
      },
      orderBy: { date: 'asc' },
    })

    // Delete the reading
    await prisma.meterReading.delete({ where: { id: readingId } })

    // Recalculate usage for the next reading if it exists
    if (nextReading) {
      const newPreviousReading = await prisma.meterReading.findFirst({
        where: {
          meterId: existing.meterId,
          date: { lt: nextReading.date },
        },
        orderBy: { date: 'desc' },
      })

      const baseValue = newPreviousReading?.reading ?? 0
      const newUsage = calculateUsage(nextReading.reading, baseValue)
      
      let newCost = 0
      if (newUsage > 0) {
        const costBreakdown = tariffEngine(newUsage)
        newCost = costBreakdown.totalCost
      }

      await prisma.meterReading.update({
        where: { id: nextReading.id },
        data: { 
          usage: newUsage, 
          estimatedCost: newCost 
        },
      })

      // Recalculate all subsequent readings
      const subsequentReadings = await prisma.meterReading.findMany({
        where: {
          meterId: existing.meterId,
          date: { gt: nextReading.date },
        },
        orderBy: { date: 'asc' },
      })

      let prevReading = nextReading
      for (const reading of subsequentReadings) {
        const usage = calculateUsage(reading.reading, prevReading.reading)
        let cost = 0
        
        if (usage > 0) {
          const costBreakdown = tariffEngine(usage)
          cost = costBreakdown.totalCost
        }

        await prisma.meterReading.update({
          where: { id: reading.id },
          data: { usage, estimatedCost: cost },
        })

        prevReading = reading
      }
    }

    return NextResponse.json({ message: 'Reading deleted successfully' })
  } catch (error) {
    console.error('Error deleting reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}