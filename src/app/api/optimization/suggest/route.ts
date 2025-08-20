import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { computeMTD, forecastUsage, forecastBill } from '@/lib/analytics'
import { tariffEngine } from '@/lib/tariffEngine'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { budget, meterId, includeAppliances = true } = body

    const userId = session.user.id
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const daysElapsed = currentDate.getDate()

    // Fetch current month readings
    const readings = await prisma.meterReading.findMany({
      where: {
        userId,
        month: currentMonth,
        year: currentYear,
        ...(meterId && { meterId })
      },
      include: {
        meter: {
          select: {
            id: true,
            label: true,
            type: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Get all user meters
    const meters = await prisma.meter.findMany({
      where: { userId },
      include: {
        readings: {
          where: {
            month: currentMonth,
            year: currentYear
          },
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    })

    // Get appliances if requested
    let appliances: string | any[] = []
    if (includeAppliances) {
      appliances = await prisma.appliance.findMany({
        where: { userId },
        orderBy: { estimatedKwh: 'desc' }
      })
    }

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

    // Calculate current metrics
    const mtd = computeMTD(analyticsReadings)
    const usageForecast = forecastUsage(mtd.usage, daysElapsed, daysInMonth)
    const billForecast = forecastBill(usageForecast)

    // Generate mock AI optimization suggestions
    const optimizationSuggestions = generateMockOptimizationSuggestions({
      userId,
      currentUsage: mtd.usage,
      projectedUsage: usageForecast.expected,
      projectedCost: billForecast.expected,
      budget: budget || 25000,
      meters,
      appliances,
      daysElapsed,
      daysRemaining: daysInMonth - daysElapsed
    })

    return NextResponse.json({
      success: true,
      data: {
        optimization: optimizationSuggestions,
        context: {
          currentUsage: mtd.usage,
          projectedUsage: usageForecast.expected,
          projectedCost: billForecast.expected,
          budget: budget || 25000,
          daysElapsed,
          daysRemaining: daysInMonth - daysElapsed,
          metersCount: meters.length,
          appliancesCount: appliances.length
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          algorithm: 'mock_ai_v1',
          confidence: 85
        }
      }
    })

  } catch (error) {
    console.error('Error generating optimization suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate optimization suggestions' },
      { status: 500 }
    )
  }
}

/**
 * Generate mock AI optimization suggestions
 * This will be replaced with actual OpenAI API calls later
 */
function generateMockOptimizationSuggestions(context: any) {
  const {
    currentUsage,
    projectedUsage,
    projectedCost,
    budget,
    meters,
    appliances,
    daysElapsed,
    daysRemaining
  } = context

  // Calculate if over budget
  const isOverBudget = projectedCost > budget
  const budgetVariance = projectedCost - budget
  const savingsPotential = Math.max(1000, Math.abs(budgetVariance) * 0.6)

  // Meter strategy based on number of meters
  let meterStrategy = "Single meter optimization - focus on peak hour management"
  if (meters.length > 1) {
    meterStrategy = `Use ${meters[0]?.label || 'Meter A'} for first ${Math.ceil(daysRemaining * 0.6)} days, then switch to ${meters[1]?.label || 'Meter B'} to optimize slab distribution`
  }

  // Slab advice based on projected usage
  let slabAdvice = "Stay within current slab to maintain optimal rates"
  if (projectedUsage > 200) {
    slabAdvice = "Keep total usage under 300 units to avoid Rs 18.15/kWh slab"
  } else if (projectedUsage > 100) {
    slabAdvice = "Keep usage under 200 units to stay in Rs 10.06/kWh slab"
  }

  // Appliance tips based on actual appliances
  const applianceTips = []
  if (appliances.length > 0) {
    const topAppliances = appliances.slice(0, 3)
    topAppliances.forEach((appliance: any) => {
      if (appliance.category === 'Air Conditioner') {
        applianceTips.push(`Reduce ${appliance.name} usage by 2 hours daily → saves Rs 800/month`)
      } else if (appliance.category === 'Water Heater') {
        applianceTips.push(`Use timer for ${appliance.name} → saves Rs 400/month`)
      } else if (appliance.estimatedKwh > 50) {
        applianceTips.push(`Optimize ${appliance.name} schedule → saves Rs 300/month`)
      }
    })
  }

  // Default tips if no appliances
  if (applianceTips.length === 0) {
    applianceTips.push(
      "Limit AC to 6 hours daily during peak summer",
      "Use washing machine during off-peak hours",
      "Set water heater timer for 2-3 hours only"
    )
  }

  // Action plan with specific dates
  const actionPlan = []
  const today = new Date()
  
  for (let i = 0; i < Math.min(7, daysRemaining); i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    actionPlan.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      recommendation: isWeekend ? 
        "Weekend: Reduce AC usage, optimal time for heavy appliances" :
        "Weekday: Standard usage, avoid peak hours 6-10 PM",
      priority: isWeekend ? 'medium' : 'high',
      expectedSavings: isWeekend ? 150 : 100
    })
  }

  return {
    recommendation: {
      meter_strategy: meterStrategy,
      slab_advice: slabAdvice,
      appliance_tips: applianceTips.slice(0, 4),
      expected_savings: `Rs ${Math.round(savingsPotential).toLocaleString()}/month`
    },
    action_plan: actionPlan,
    insights: {
      budget_status: isOverBudget ? 'over_budget' : 'on_track',
      efficiency_score: Math.max(60, 100 - (projectedUsage / 300) * 40),
      peak_optimization_potential: 25,
      slab_optimization_score: projectedUsage < 200 ? 90 : projectedUsage < 300 ? 70 : 40
    },
    priority_actions: [
      {
        action: "Immediate AC temperature adjustment",
        impact: "Rs 400/week savings",
        difficulty: "Easy",
        timeframe: "Today"
      },
      {
        action: "Install smart timers on water heater",
        impact: "Rs 600/month savings", 
        difficulty: "Medium",
        timeframe: "This week"
      },
      {
        action: meters.length > 1 ? "Implement dual-meter switching" : "Monitor peak hour usage",
        impact: "Rs 800/month savings",
        difficulty: meters.length > 1 ? "Hard" : "Medium",
        timeframe: "This month"
      }
    ]
  }
}