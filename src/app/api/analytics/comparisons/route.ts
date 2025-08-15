import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

interface PeriodData {
  usage: number
  cost: number
  averageDaily: number
  readingsCount: number
  period: string
}

interface ComparisonResult {
  comparisonType: 'MoM' | 'YoY' | 'Rolling28'
  currentPeriod: PeriodData
  previousPeriod: PeriodData
  percentageChange: {
    usage: number
    cost: number
  }
  absoluteChange: {
    usage: number
    cost: number
  }
  trend: 'increasing' | 'decreasing' | 'stable'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const comparisonType = searchParams.get('type') || 'MoM'
    const meterId = searchParams.get('meterId')
    
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    let comparisons: ComparisonResult[] = []

    // Base query conditions
    const baseWhere: any = {
      userId: session.user.id,
      ...(meterId && { meterId })
    }

    if (comparisonType === 'MoM' || comparisonType === 'all') {
      // Month-over-Month comparison
      const currentMonthReadings = await prisma.meterReading.findMany({
        where: {
          ...baseWhere,
          month: currentMonth,
          year: currentYear
        }
      })

      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

      const lastMonthReadings = await prisma.meterReading.findMany({
        where: {
          ...baseWhere,
          month: lastMonth,
          year: lastMonthYear
        }
      })

      const currentPeriod = calculatePeriodData(currentMonthReadings, `${currentYear}-${currentMonth.toString().padStart(2, '0')}`)
      const previousPeriod = calculatePeriodData(lastMonthReadings, `${lastMonthYear}-${lastMonth.toString().padStart(2, '0')}`)

      comparisons.push({
        comparisonType: 'MoM',
        currentPeriod,
        previousPeriod,
        percentageChange: calculatePercentageChange(currentPeriod, previousPeriod),
        absoluteChange: calculateAbsoluteChange(currentPeriod, previousPeriod),
        trend: determineTrend(currentPeriod.usage, previousPeriod.usage)
      })
    }

    if (comparisonType === 'YoY' || comparisonType === 'all') {
      // Year-over-Year comparison
      const currentYearReadings = await prisma.meterReading.findMany({
        where: {
          ...baseWhere,
          month: currentMonth,
          year: currentYear
        }
      })

      const lastYearReadings = await prisma.meterReading.findMany({
        where: {
          ...baseWhere,
          month: currentMonth,
          year: currentYear - 1
        }
      })

      if (lastYearReadings.length > 0) {
        const currentPeriod = calculatePeriodData(currentYearReadings, `${currentYear}-${currentMonth.toString().padStart(2, '0')}`)
        const previousPeriod = calculatePeriodData(lastYearReadings, `${currentYear - 1}-${currentMonth.toString().padStart(2, '0')}`)

        comparisons.push({
          comparisonType: 'YoY',
          currentPeriod,
          previousPeriod,
          percentageChange: calculatePercentageChange(currentPeriod, previousPeriod),
          absoluteChange: calculateAbsoluteChange(currentPeriod, previousPeriod),
          trend: determineTrend(currentPeriod.usage, previousPeriod.usage)
        })
      }
    }

    if (comparisonType === 'Rolling28' || comparisonType === 'all') {
      // Rolling 28-day comparison
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 28)

      const previousEndDate = new Date(startDate)
      const previousStartDate = new Date(previousEndDate)
      previousStartDate.setDate(previousStartDate.getDate() - 28)

      const currentPeriodReadings = await prisma.meterReading.findMany({
        where: {
          ...baseWhere,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      const previousPeriodReadings = await prisma.meterReading.findMany({
        where: {
          ...baseWhere,
          date: {
            gte: previousStartDate,
            lte: previousEndDate
          }
        }
      })

      const currentPeriod = calculatePeriodData(currentPeriodReadings, 'Last 28 days')
      const previousPeriod = calculatePeriodData(previousPeriodReadings, 'Previous 28 days')

      comparisons.push({
        comparisonType: 'Rolling28',
        currentPeriod,
        previousPeriod,
        percentageChange: calculatePercentageChange(currentPeriod, previousPeriod),
        absoluteChange: calculateAbsoluteChange(currentPeriod, previousPeriod),
        trend: determineTrend(currentPeriod.usage, previousPeriod.usage)
      })
    }

    // Generate summary insights
    const insights = generateComparisonInsights(comparisons)

    return NextResponse.json({
      success: true,
      data: {
        comparisons: comparisonType === 'all' ? comparisons : comparisons[0],
        insights,
        metadata: {
          generatedAt: new Date().toISOString(),
          meterId: meterId || 'all',
          comparisonType
        }
      }
    })

  } catch (error) {
    console.error('Error fetching comparison analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comparison analytics' },
      { status: 500 }
    )
  }
}

function calculatePeriodData(readings: any[], period: string): PeriodData {
  const totalUsage = readings.reduce((sum, r) => sum + (r.usage || 0), 0)
  const totalCost = readings.reduce((sum, r) => sum + (r.estimatedCost || 0), 0)
  const readingsCount = readings.length
  
  // Calculate active days (unique dates)
  const uniqueDates = new Set(readings.map(r => r.date.toISOString().split('T')[0]))
  const activeDays = uniqueDates.size || 1

  return {
    usage: Math.round(totalUsage * 100) / 100,
    cost: Math.round(totalCost * 100) / 100,
    averageDaily: Math.round((totalUsage / activeDays) * 100) / 100,
    readingsCount,
    period
  }
}

function calculatePercentageChange(current: PeriodData, previous: PeriodData) {
  const usageChange = previous.usage > 0 ? 
    ((current.usage - previous.usage) / previous.usage) * 100 : 0
  const costChange = previous.cost > 0 ? 
    ((current.cost - previous.cost) / previous.cost) * 100 : 0

  return {
    usage: Math.round(usageChange * 100) / 100,
    cost: Math.round(costChange * 100) / 100
  }
}

function calculateAbsoluteChange(current: PeriodData, previous: PeriodData) {
  return {
    usage: Math.round((current.usage - previous.usage) * 100) / 100,
    cost: Math.round((current.cost - previous.cost) * 100) / 100
  }
}

function determineTrend(currentValue: number, previousValue: number): 'increasing' | 'decreasing' | 'stable' {
  const changePercent = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0
  
  if (changePercent > 5) return 'increasing'
  if (changePercent < -5) return 'decreasing'
  return 'stable'
}

function generateComparisonInsights(comparisons: ComparisonResult[]) {
  const insights = []

  for (const comparison of comparisons) {
    const { comparisonType, percentageChange, trend } = comparison

    if (Math.abs(percentageChange.usage) > 20) {
      insights.push({
        type: trend === 'increasing' ? 'warning' : 'success',
        title: `${comparisonType} Usage ${trend === 'increasing' ? 'Increase' : 'Decrease'}`,
        message: `Your usage ${trend === 'increasing' ? 'increased' : 'decreased'} by ${Math.abs(percentageChange.usage).toFixed(1)}% compared to the previous period.`,
        priority: Math.abs(percentageChange.usage) > 30 ? 'high' : 'medium',
        comparisonType
      })
    }

    if (Math.abs(percentageChange.cost) > 25) {
      insights.push({
        type: trend === 'increasing' ? 'warning' : 'success',
        title: `${comparisonType} Cost ${trend === 'increasing' ? 'Increase' : 'Savings'}`,
        message: `Your electricity cost ${trend === 'increasing' ? 'increased' : 'decreased'} by ${Math.abs(percentageChange.cost).toFixed(1)}% compared to the previous period.`,
        priority: Math.abs(percentageChange.cost) > 40 ? 'high' : 'medium',
        comparisonType
      })
    }
  }

  return insights
}