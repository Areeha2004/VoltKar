// app/api/readings/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { calculateElectricityBill } from '@/lib/slabCalculations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { userId: session.user.id }
    if (meterId) where.meterId = meterId

    const readings = await prisma.meterReading.findMany({
      where,
      include: { meter: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const readingsWithUsage = await Promise.all(
      readings.map(async (reading) => {
        // find previous DB reading
        const prev = await prisma.meterReading.findFirst({
          where: { meterId: reading.meterId, createdAt: { lt: reading.createdAt } },
          orderBy: { createdAt: 'desc' },
        })

        // fallback to meter.lastReading when no prev
        const baseValue = prev?.reading ?? reading.meter.lastReading ?? 0
        const usage = Math.max(0, reading.reading - baseValue)

        let estimatedCost = 0
        let costBreakdown = null

        if (usage > 0) {
          costBreakdown = calculateElectricityBill(usage)
          estimatedCost = Math.round(costBreakdown.totalCost)

          // persist if changed
          if (reading.usage !== usage || reading.estimatedCost !== estimatedCost) {
            await prisma.meterReading.update({
              where: { id: reading.id },
              data: { usage, estimatedCost },
            })
          }
        }

        return {
          ...reading,
          usage,
          estimatedCost,
          slabWarning: costBreakdown?.slabWarning || false,
          costBreakdown,
        }
      })
    )

    return NextResponse.json({ readings: readingsWithUsage })
  } catch (error) {
    console.error('Error fetching readings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { meterId, reading, month, year, notes } = await request.json()
    if (!meterId || reading === undefined || !month || !year) {
      return NextResponse.json(
        { error: 'MeterId, reading, month, and year are required' },
        { status: 400 }
      )
    }

    // load meter (for lastReading baseline)
    const meter = await prisma.meter.findFirst({
      where: { id: meterId, userId: session.user.id },
    })
    if (!meter) {
      return NextResponse.json({ error: 'Meter not found' }, { status: 404 })
    }

    // prevent duplicate month
    const existing = await prisma.meterReading.findFirst({
      where: { meterId, month, year },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Reading for this month already exists' },
        { status: 409 }
      )
    }

    // 1) create placeholder
    const created = await prisma.meterReading.create({
      data: {
        meterId,
        userId: session.user.id,
        reading: parseFloat(reading),
        month,
        year,
      },
      include: { meter: true },
    })

    // 2) find previous reading
    const prev = await prisma.meterReading.findFirst({
      where: { meterId, createdAt: { lt: created.createdAt } },
      orderBy: { createdAt: 'desc' },
    })

    const baseValue = prev?.reading ?? meter.lastReading ?? 0
    const usage = Math.max(0, created.reading - baseValue)

    let estimatedCost = 0
    let costBreakdown = null
    if (usage > 0) {
      costBreakdown = calculateElectricityBill(usage)
      estimatedCost = Math.round(costBreakdown.totalCost)
    }

    // 3) persist usage, cost, notes
    const updated = await prisma.meterReading.update({
      where: { id: created.id },
      data: {
        usage,
        estimatedCost,
        notes: notes?.trim() || null,
      },
      include: { meter: true },
    })

    // 4) update meter.lastReading
    await prisma.meter.update({
      where: { id: meterId },
      data: { lastReading: created.reading },
    })

    return NextResponse.json(
      {
        reading: {
          ...updated,
          usage,
          estimatedCost,
          slabWarning: costBreakdown?.slabWarning || false,
          costBreakdown,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
