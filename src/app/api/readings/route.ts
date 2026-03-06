import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { recalculateMeterReadingChain } from '@/lib/readingChain'
import { isDemoTimeTravelEnabled } from '@/lib/demoMode'
import { getDemoModeFromRequest } from '@/lib/demoModeServer'

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

    const [readings, total] = await Promise.all([
      prisma.meterReading.findMany({
        where,
        include: { meter: true },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.meterReading.count({ where })
    ])

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
          userId: session.user.id,
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
      total
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

    const parsedReading = parseFloat(reading)
    if (!Number.isFinite(parsedReading) || parsedReading < 0) {
      return NextResponse.json({ error: 'Reading must be a valid non-negative number' }, { status: 400 })
    }

    const readingDate = date ? new Date(date) : new Date()
    if (Number.isNaN(readingDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }
    const demoMode = getDemoModeFromRequest(request)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    if (!isDemoTimeTravelEnabled(demoMode) && readingDate > endOfToday) {
      return NextResponse.json({ error: 'Future dates are not allowed for meter readings' }, { status: 400 })
    }

    // Check for duplicate reading (same meter, week, month, year) for this user
    const existing = await prisma.meterReading.findFirst({
      where: {
        meterId,
        userId: session.user.id,
        week,
        month,
        year
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Reading for this week already exists' },
        { status: 409 }
      )
    }

    const createdReading = await prisma.meterReading.create({
      data: {
        meterId,
        userId: session.user.id,
        reading: parsedReading,
        week,
        month,
        year,
        date: readingDate,
        isOfficialEndOfMonth: isOfficialEndOfMonth || false,
        usage: 0,
        estimatedCost: 0,
        notes: notes?.trim() || null,
      },
    })

    await recalculateMeterReadingChain(meterId)

    const newReading = await prisma.meterReading.findUnique({
      where: { id: createdReading.id },
      include: { meter: true }
    })

    return NextResponse.json(
      { reading: newReading },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

