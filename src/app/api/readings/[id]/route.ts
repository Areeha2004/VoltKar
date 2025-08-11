// app/api/readings/[id]/route.ts

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

    // verify and load existing reading
    const existing = await prisma.meterReading.findFirst({
      where: { id: readingId, userId: session.user.id },
      include: { meter: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    // 1) update the raw fields
    const updatedRaw = await prisma.meterReading.update({
      where: { id: readingId },
      data: {
        reading: parseFloat(reading),
        month,
        year,
        notes: notes?.trim() || null,
      },
      include: { meter: true },
    })

    // 2) find previous reading (by createdAt)
    const prev = await prisma.meterReading.findFirst({
      where: {
        meterId: updatedRaw.meterId,
        createdAt: { lt: updatedRaw.createdAt },
      },
      orderBy: { createdAt: 'desc' },
    })

    // fallback to meter.lastReading if no prev
    const baseValue = prev?.reading ?? updatedRaw.meter.lastReading ?? 0
    const usage = Math.max(0, updatedRaw.reading - baseValue)

    let estimatedCost = 0
    let costBreakdown = null
    if (usage > 0) {
      costBreakdown = calculateElectricityBill(usage)
      estimatedCost = Math.round(costBreakdown.totalCost)
    }

    // 3) persist usage & cost
    const final = await prisma.meterReading.update({
      where: { id: readingId },
      data: { usage, estimatedCost },
      include: { meter: true },
    })

    // 4) if this is now the latest reading, bump meter.lastReading
    if (final.reading >= updatedRaw.meter.lastReading) {
      await prisma.meter.update({
        where: { id: final.meterId },
        data: { lastReading: final.reading },
      })
    }

    return NextResponse.json({
      reading: {
        ...final,
        usage,
        estimatedCost,
        slabWarning: costBreakdown?.slabWarning || false,
        costBreakdown,
      },
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

    const existing = await prisma.meterReading.findFirst({
      where: { id: readingId, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    await prisma.meterReading.delete({ where: { id: readingId } })

    // optional: recalc meter.lastReading to latest remaining reading
    const latest = await prisma.meterReading.findFirst({
      where: { meterId: existing.meterId },
      orderBy: { createdAt: 'desc' },
    })
    await prisma.meter.update({
      where: { id: existing.meterId },
      data: { lastReading: latest?.reading ?? 0 },
    })

    return NextResponse.json({ message: 'Reading deleted successfully' })
  } catch (error) {
    console.error('Error deleting reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
