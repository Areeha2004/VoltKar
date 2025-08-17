import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { monitorBudget, generateBudgetAdjustments, calculateBudgetEfficiency } from '@/lib/budgetMonitor'
import { getBudgetFromStorage } from '@/lib/budgetManager'
import { computeMTD, forecastUsage, forecastBill } from '@/lib/analytics'

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
    const daysElapsed = currentDate.getDate()

    // Get budget from request or storage (in real app, this would be from database)
    const budgetParam = searchParams.get('budget')
    const budgetRs = budgetParam ? parseFloat(budgetParam) : 25000 // Default budget

    // Build query conditions
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

    // Calculate current costs and projections
    const mtd = computeMTD(analyticsReadings)
    const usageForecast = forecastUsage(mtd.usage, daysElapsed, daysInMonth)
    const billForecast = forecastBill(usageForecast)

    // Monitor budget
    const alerts = monitorBudget(
      mtd.cost,
      billForecast.expected,
      budgetRs,
      daysElapsed,
      daysInMonth
    )

    // Generate budget adjustments
    const adjustments = generateBudgetAdjustments(
      mtd.cost,
      billForecast.expected,
      budgetRs,
      analyticsReadings
    )

    // Calculate efficiency
    const efficiency = calculateBudgetEfficiency(mtd.cost, budgetRs)

    // Calculate daily targets and progress
    const dailyBudget = budgetRs / daysInMonth
    const averageDailyCost = daysElapsed > 0 ? mtd.cost / daysElapsed : 0
    const remainingDailyBudget = Math.max(0, (budgetRs - mtd.cost) / Math.max(1, daysInMonth - daysElapsed))

    // Generate recommendations based on current status
    const recommendations = []
    
    if (billForecast.expected > budgetRs) {
      const overage = billForecast.expected - budgetRs
      const dailyReduction = overage / Math.max(1, daysInMonth - daysElapsed)
      recommendations.push(`Reduce daily spending by Rs ${Math.round(dailyReduction)} to stay within budget`)
    }
    
    if (averageDailyCost > dailyBudget * 1.2) {
      recommendations.push('Your daily spending is 20% above target - focus on peak hour reduction')
    }
    
    if (efficiency.score < 70) {
      recommendations.push('Consider adjusting your budget target based on actual usage patterns')
    }

    return NextResponse.json({
      success: true,
      data: {
        budget: {
          target: budgetRs,
          spent: Math.round(mtd.cost),
          remaining: Math.round(budgetRs - mtd.cost),
          projected: Math.round(billForecast.expected),
          efficiency: efficiency.score,
          grade: efficiency.grade
        },
        daily: {
          target: Math.round(dailyBudget),
          average: Math.round(averageDailyCost),
          remaining: Math.round(remainingDailyBudget),
          daysLeft: daysInMonth - daysElapsed
        },
        alerts,
        adjustments,
        recommendations,
        period: {
          month: currentMonth,
          year: currentYear,
          daysElapsed,
          daysInMonth,
          meterId: meterId || 'all'
        }
      }
    })

  } catch (error) {
    console.error('Error monitoring budget:', error)
    return NextResponse.json(
      { error: 'Failed to monitor budget' },
      { status: 500 }
    )
  }
}