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
      skip: offset
    })

    const readingsWithUsage = await Promise.all(
      readings.map(async (reading) => {
        const prev = await prisma.meterReading.findFirst({
          where: { meterId: reading.meterId, createdAt: { lt: reading.createdAt } },
          orderBy: { createdAt: 'desc' }
        })
        const usage = prev ? Math.max(0, reading.reading - prev.reading) : 0
        const costBreakdown = calculateElectricityBill(usage)
        return { 
          ...reading,
          usage,
          estimatedCost: Math.round(costBreakdown.totalCost),
          slabWarning: costBreakdown.slabWarning,
          costBreakdown
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
      return NextResponse.json({ error: 'MeterId, reading, month, and year are required' }, { status: 400 })
    }

    const meter = await prisma.meter.findFirst({
      where: { id: meterId, userId: session.user.id }
    })
    if (!meter) return NextResponse.json({ error: 'Meter not found' }, { status: 404 })

    const existingReading = await prisma.meterReading.findFirst({
      where: { meterId, month, year }
    })
    if (existingReading) {
      return NextResponse.json({ error: 'Reading for this month already exists' }, { status: 409 })
    }

    const newReading = await prisma.meterReading.create({
      data: { meterId, userId: session.user.id, reading: parseFloat(reading), month, year },
      include: { meter: true }
    })

    const prev = await prisma.meterReading.findFirst({
      where: { meterId, createdAt: { lt: newReading.createdAt } },
      orderBy: { createdAt: 'desc' }
    })
    const usage = prev ? Math.max(0, newReading.reading - prev.reading) : 0
    const costBreakdown = calculateElectricityBill(usage)

    // Update the reading with calculated values
    const updatedReading = await prisma.meterReading.update({
      where: { id: newReading.id },
      data: {
        usage,
        estimatedCost: Math.round(costBreakdown.totalCost),
        notes: notes?.trim() || null
      },
      include: { meter: true }
    })
    return NextResponse.json({
      reading: {
        ...updatedReading,
        usage,
        estimatedCost: Math.round(costBreakdown.totalCost),
        slabWarning: costBreakdown.slabWarning,
        costBreakdown
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
