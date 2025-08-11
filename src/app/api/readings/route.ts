import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// Dummy rates
const BASE_TARIFF = 19.3 // Rs per kWh
const TAX_RATE = 0.1 // 10% tax

function calculateCost(usage: number) {
  const baseCost = usage * BASE_TARIFF
  return Math.round(baseCost + baseCost * TAX_RATE)
}

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
        return { 
          ...reading,
          usage,
          estimatedCost: calculateCost(usage)
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

    return NextResponse.json({
      reading: {
        ...newReading,
        usage,
        estimatedCost: calculateCost(usage)
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
