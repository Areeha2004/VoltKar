import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { recomputeAnalytics } from '@/lib/analytics'
import { tariffEngine, calculateUsage } from '@/lib/tariffEngine'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { userId: session.user.id }
    if (meterId) where.meterId = meterId
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    const readings = await prisma.meterReading.findMany({
      where,
      include: { meter: true },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    })

    // Calculate aggregates if requested
    const includeAggregates = searchParams.get('aggregates') === 'true'
    let aggregates = null

    if (includeAggregates && meterId) {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()

      // Weekly aggregates for current month
      const weeklyReadings = await prisma.meterReading.findMany({
        where: {
          meterId,
          month: currentMonth,
          year: currentYear
        },
        orderBy: { week: 'asc' }
      })

      const weeklySum = weeklyReadings.reduce((acc, reading) => {
        acc[reading.week] = (acc[reading.week] || 0) + (reading.usage || 0)
        return acc
      }, {} as Record<number, number>)

      // Monthly sum
      const monthSum = weeklyReadings.reduce((sum, reading) => sum + (reading.usage || 0), 0)

      aggregates = {
        weeklySum,
        monthSum,
        readingsCount: weeklyReadings.length
      }
    }

    return NextResponse.json({ 
      readings,
      aggregates,
      total: readings.length 
    })
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

    const { meterId, reading, date, week, month, year, isOfficialEndOfMonth, notes } = await request.json()

    // Validate required fields
    if (!meterId || reading === undefined || !week || !month || !year) {
      return NextResponse.json(
        { error: 'MeterId, reading, week, month, and year are required' },
        { status: 400 }
      )
    }

    // Validate week range
    if (week < 1 || week > 5) {
      return NextResponse.json(
        { error: 'Week must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Load meter to verify ownership
    const meter = await prisma.meter.findFirst({
      where: { id: meterId, userId: session.user.id },
    })
    if (!meter) {
      return NextResponse.json({ error: 'Meter not found' }, { status: 404 })
    }

    // Check for duplicate reading (same meter, week, month, year)
    const existing = await prisma.meterReading.findFirst({
      where: { meterId, week, month, year },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Reading for this week already exists' },
        { status: 409 }
      )
    }

    // Find previous reading for usage calculation
    const readingDate = date ? new Date(date) : new Date()
    const previousReading = await prisma.meterReading.findFirst({
      where: { 
        meterId, 
        date: { lt: readingDate }
      },
      orderBy: { date: 'desc' },
    })

    // Calculate usage
    const baseValue = previousReading?.reading ?? 0
    const usage = calculateUsage(parseFloat(reading), baseValue)

    // Calculate cost using tariff engine
    let estimatedCost = 0
    if (usage > 0) {
      const costBreakdown = tariffEngine(usage)
      estimatedCost = costBreakdown.totalCost
    }

    // Create the reading
    const newReading = await prisma.meterReading.create({
      data: {
        meterId,
        userId: session.user.id,
        reading: parseFloat(reading),
        week,
        month,
        year,
        date: readingDate,
        isOfficialEndOfMonth: isOfficialEndOfMonth || false,
        usage,
        estimatedCost,
        notes: notes?.trim() || null,
      },
      include: { meter: true },
    })

    // Recompute analytics after creating new reading
    try {
      await recomputeAnalytics(session.user.id, meterId)
    } catch (analyticsError) {
      console.warn('Analytics recomputation failed:', analyticsError)
    }

    return NextResponse.json(
      { reading: newReading },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}