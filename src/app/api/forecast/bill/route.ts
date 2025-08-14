import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { computeMTD, forecastUsage, forecastBill } from '@/lib/analytics'
import { tariffEngine } from '@/lib/tariffEngine'

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

    // Calculate MTD and forecast usage
    const mtd = computeMTD(analyticsReadings)
    const usageForecast = forecastUsage(mtd.usage, mtd.daysElapsed, daysInMonth)
    
    // Generate bill forecasts
    const billForecast = forecastBill(usageForecast)

    // Get detailed cost breakdown for expected scenario
    const expectedBreakdown = usageForecast.expected > 0 ? 
      tariffEngine(usageForecast.expected) : null

    // Calculate current month cost so far
    const currentMTDCost = mtd.cost

    // Get last month's bill for comparison
    const lastMonthReadings = await prisma.meterReading.findMany({
      where: {
        userId: session.user.id,
        ...(meterId && { meterId }),
        month: currentMonth === 1 ? 12 : currentMonth - 1,
        year: currentMonth === 1 ? currentYear - 1 : currentYear
      },
      select: {
        estimatedCost: true
      }
    })

    const lastMonthTotal = lastMonthReadings.reduce((sum, reading) => 
      sum + (reading.estimatedCost || 0), 0)

    // Calculate savings potential
    const savingsScenarios = {
      reduce10Percent: {
        usage: Math.round(usageForecast.expected * 0.9),
        cost: usageForecast.expected > 0 ? tariffEngine(usageForecast.expected * 0.9).totalCost : 0
      },
      reduce20Percent: {
        usage: Math.round(usageForecast.expected * 0.8),
        cost: usageForecast.expected > 0 ? tariffEngine(usageForecast.expected * 0.8).totalCost : 0
      }
    }

    const potentialSavings = {
      reduce10Percent: billForecast.expected - savingsScenarios.reduce10Percent.cost,
      reduce20Percent: billForecast.expected - savingsScenarios.reduce20Percent.cost
    }

    return NextResponse.json({
      success: true,
      data: {
        forecast: {
          usage: usageForecast,
          bill: billForecast
        },
        current: {
          mtdUsage: mtd.usage,
          mtdCost: currentMTDCost,
          daysElapsed: mtd.daysElapsed,
          projectedDailyRate: mtd.daysElapsed > 0 ? mtd.usage / mtd.daysElapsed : 0
        },
        breakdown: expectedBreakdown,
        comparison: {
          lastMonthBill: Math.round(lastMonthTotal),
          vsLastMonth: lastMonthTotal > 0 ? 
            Math.round(((billForecast.expected - lastMonthTotal) / lastMonthTotal) * 100) : null,
          difference: Math.round(billForecast.expected - lastMonthTotal)
        },
        savings: {
          scenarios: savingsScenarios,
          potential: {
            reduce10Percent: Math.round(potentialSavings.reduce10Percent),
            reduce20Percent: Math.round(potentialSavings.reduce20Percent)
          }
        },
        period: {
          month: currentMonth,
          year: currentYear,
          daysInMonth,
          meterId: meterId || 'all'
        }
      }
    })

  } catch (error) {
    console.error('Error generating bill forecast:', error)
    return NextResponse.json(
      { error: 'Failed to generate bill forecast' },
      { status: 500 }
    )
  }
}