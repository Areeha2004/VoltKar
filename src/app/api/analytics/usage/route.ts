import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { generateMonthlyBreakdown } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1 + '')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear() + '')

    // Build query conditions
    const whereConditions: any = {
      userId: session.user.id,
      month,
      year
    }

    if (meterId) {
      whereConditions.meterId = meterId
    }

    // Fetch readings for the specified period
    const readings = await prisma.meterReading.findMany({
      where: whereConditions,
      include: {
        meter: {
          select: {
            id: true,
            label: true,
            type: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Transform readings for analytics
    const analyticsReadings = readings.map(reading => ({
      id: reading.id,
      date: reading.date,
      usage: reading.usage || 0,
      estimatedCost: reading.estimatedCost || 0,
      week: reading.week,
      month: reading.month,
      year: reading.year
    }))

    // Generate monthly breakdown
    const breakdown = generateMonthlyBreakdown(analyticsReadings)

    // Get meter information if specific meter requested
    let meterInfo = null
    if (meterId && readings.length > 0) {
      meterInfo = readings[0].meter
    }

    // Calculate additional metrics
    const totalReadings = readings.length
    const activeWeeks = breakdown.weeklyBreakdown.filter(w => w.usage > 0).length
    
    // Peak usage week
    const peakWeek = breakdown.weeklyBreakdown.reduce((max, week) => 
      week.usage > max.usage ? week : max, breakdown.weeklyBreakdown[0]
    )

    return NextResponse.json({
      success: true,
      data: {
        ...breakdown,
        period: {
          month,
          year,
          meterId: meterId || 'all'
        },
        meterInfo,
        metrics: {
          totalReadings,
          activeWeeks,
          peakWeek: peakWeek.usage > 0 ? peakWeek : null,
          costPerKwh: breakdown.monthToDateUsage > 0 ? 
            Math.round((breakdown.monthToDateCost / breakdown.monthToDateUsage) * 100) / 100 : 0
        }
      }
    })

  } catch (error) {
    console.error('Error fetching usage analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage analytics' },
      { status: 500 }
    )
  }
}