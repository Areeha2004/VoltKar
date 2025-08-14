import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { computeMTD, forecastUsage } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

    // Build query conditions for current month
    const whereConditions: any = {
      userId: session.user.id,
      month: currentMonth,
      year: currentYear
    }

    if (meterId) {
      whereConditions.meterId = meterId
    }

    // Fetch current month readings
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

    // Calculate MTD and forecast
    const mtd = computeMTD(analyticsReadings)
    const forecast = forecastUsage(mtd.usage, mtd.daysElapsed, daysInMonth)

    // Get historical data for comparison (last 3 months)
    const historicalReadings = await prisma.meterReading.findMany({
      where: {
        userId: session.user.id,
        ...(meterId && { meterId }),
        OR: [
          { month: currentMonth - 1, year: currentYear },
          { month: currentMonth - 2, year: currentYear },
          { month: currentMonth - 3, year: currentYear },
          // Handle year boundary
          ...(currentMonth <= 3 ? [
            { month: 12 + currentMonth - 1, year: currentYear - 1 },
            { month: 12 + currentMonth - 2, year: currentYear - 1 },
            { month: 12 + currentMonth - 3, year: currentYear - 1 }
          ] : [])
        ]
      },
      select: {
        usage: true,
        month: true,
        year: true
      }
    })

    // Calculate historical averages
    const monthlyTotals = new Map<string, number>()
    historicalReadings.forEach(reading => {
      const key = `${reading.year}-${reading.month}`
      const current = monthlyTotals.get(key) || 0
      monthlyTotals.set(key, current + (reading.usage || 0))
    })

    const historicalAverage = monthlyTotals.size > 0 ? 
      Array.from(monthlyTotals.values()).reduce((sum, val) => sum + val, 0) / monthlyTotals.size : 0

    // Calculate confidence level based on data quality
    const confidenceLevel = Math.min(100, Math.max(50, 
      (mtd.daysElapsed / daysInMonth) * 100 + 
      (readings.length > 0 ? 20 : 0) + 
      (historicalAverage > 0 ? 15 : 0)
    ))

    return NextResponse.json({
      success: true,
      data: {
        forecast,
        monthToDate: {
          usage: mtd.usage,
          cost: mtd.cost,
          daysElapsed: mtd.daysElapsed
        },
        period: {
          month: currentMonth,
          year: currentYear,
          daysInMonth,
          meterId: meterId || 'all'
        },
        comparison: {
          historicalAverage: Math.round(historicalAverage * 100) / 100,
          vsHistorical: historicalAverage > 0 ? 
            Math.round(((forecast.expected - historicalAverage) / historicalAverage) * 100) : null
        },
        confidence: {
          level: Math.round(confidenceLevel),
          factors: {
            dataPoints: readings.length,
            daysElapsed: mtd.daysElapsed,
            hasHistorical: historicalAverage > 0
          }
        }
      }
    })

  } catch (error) {
    console.error('Error generating usage forecast:', error)
    return NextResponse.json(
      { error: 'Failed to generate usage forecast' },
      { status: 500 }
    )
  }
}