import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { computeMTD, forecastUsage, forecastBill } from '@/lib/analytics'
import { generateCostInsights } from '../../../../lib/insights'
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const meterId = searchParams.get('meterId')
    
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

    // Build query conditions
    let whereConditions: any = {
      userId: session.user.id
    }

    if (meterId) {
      whereConditions.meterId = meterId
    }

    // Apply date range or default to current month
    if (from && to) {
      whereConditions.date = {
        gte: new Date(from),
        lte: new Date(to)
      }
    } else {
      whereConditions.month = currentMonth
      whereConditions.year = currentYear
    }

    // Fetch current period readings
    const currentReadings = await prisma.meterReading.findMany({
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
    const analyticsReadings = currentReadings.map(reading => ({
      id: reading.id,
      date: reading.date,
      usage: reading.usage || 0,
      estimatedCost: reading.estimatedCost || 0,
      week: reading.week,
      month: reading.month,
      year: reading.year
    }))

    // Calculate current period costs
    const mtd = computeMTD(analyticsReadings)
    const actualToDateCost = mtd.cost
    const activeDays = mtd.daysElapsed || 1
    const averageDailyCost = actualToDateCost / activeDays

    // Calculate projected cost for full month
    const usageForecast = forecastUsage(mtd.usage, mtd.daysElapsed, daysInMonth)
    const billForecast = forecastBill(usageForecast)
    const projectedCost = billForecast.expected

    // Get last month's data for comparison
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const lastMonthReadings = await prisma.meterReading.findMany({
      where: {
        userId: session.user.id,
        ...(meterId && { meterId }),
        month: lastMonth,
        year: lastMonthYear
      },
      select: {
        estimatedCost: true
      }
    })

    const lastMonthCost = lastMonthReadings.reduce((sum, reading) => 
      sum + (reading.estimatedCost || 0), 0)

    // Calculate cost breakdown by week
    const weeklyBreakdown = []
    for (let week = 1; week <= 5; week++) {
      const weekReadings = currentReadings.filter(r => r.week === week)
      const weekCost = weekReadings.reduce((sum, r) => sum + (r.estimatedCost || 0), 0)
      const weekUsage = weekReadings.reduce((sum, r) => sum + (r.usage || 0), 0)
      
      weeklyBreakdown.push({
        week,
        cost: Math.round(weekCost * 100) / 100,
        usage: Math.round(weekUsage * 100) / 100,
        readingsCount: weekReadings.length
      })
    }

    // Generate cost insights
    const insights = generateCostInsights(
      actualToDateCost,
      projectedCost,
      averageDailyCost,
      lastMonthCost > 0 ? lastMonthCost : undefined
    )

    // Calculate cost efficiency metrics
    const costPerKwh = mtd.usage > 0 ? actualToDateCost / mtd.usage : 0
    const projectedCostPerKwh = usageForecast.expected > 0 ? projectedCost / usageForecast.expected : 0

    return NextResponse.json({
      success: true,
      data: {
        costs: {
          actualToDateCost: Math.round(actualToDateCost * 100) / 100,
          projectedCost: Math.round(projectedCost * 100) / 100,
          averageDailyCost: Math.round(averageDailyCost * 100) / 100,
          lastMonthCost: Math.round(lastMonthCost * 100) / 100,
          costPerKwh: Math.round(costPerKwh * 100) / 100,
          projectedCostPerKwh: Math.round(projectedCostPerKwh * 100) / 100
        },
        breakdown: {
          weeklyBreakdown,
          totalUsage: mtd.usage,
          projectedUsage: usageForecast.expected,
          activeDays,
          daysInMonth
        },
        comparison: {
          vsLastMonth: lastMonthCost > 0 ? 
            Math.round(((projectedCost - lastMonthCost) / lastMonthCost) * 100) : null,
          difference: Math.round(projectedCost - lastMonthCost)
        },
        insights,
        period: {
          month: currentMonth,
          year: currentYear,
          from: from || `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`,
          to: to || currentDate.toISOString().split('T')[0],
          meterId: meterId || 'all'
        }
      }
    })

  } catch (error) {
    console.error('Error fetching cost analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost analytics' },
      { status: 500 }
    )
  }
}