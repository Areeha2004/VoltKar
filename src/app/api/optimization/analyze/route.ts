import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { computeMTD, forecastUsage, forecastBill } from '@/lib/analytics'
import { tariffEngine, getCurrentSlab } from '@/lib/tariffEngine'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    const includeAppliances = searchParams.get('appliances') !== 'false'
    const budgetParam = localStorage.getItem('monthlyBudgetRs')
    const budget = budgetParam ? parseFloat(budgetParam) : 25000

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

    // Get all user meters with latest readings
    const meters = await prisma.meter.findMany({
      where: { userId },
      include: {
        readings: {
          where: {
            month: currentMonth,
            year: currentYear
          },
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    })

    // Get appliances summary
    let appliancesSummary = null
    if (includeAppliances) {
      const appliances = await prisma.appliance.findMany({
        where: { userId },
        orderBy: { estimatedKwh: 'desc' }
      })

      appliancesSummary = {
        total: appliances.length,
        totalKwh: appliances.reduce((sum, app) => sum + (app.estimatedKwh || 0), 0),
        totalCost: appliances.reduce((sum, app) => {
          const cost = tariffEngine(app.estimatedKwh || 0).totalCost
          return sum + cost
        }, 0),
        topConsumers: appliances.slice(0, 5).map(app => ({
          id: app.id,
          name: app.name,
          category: app.category,
          estimatedKwh: app.estimatedKwh || 0,
          contribution: app.contribution || 0
        }))
      }
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

    // Analyze per-meter performance
    const meterAnalysis = meters.map(meter => {
      const meterReadings = readings.filter(r => r.meterId === meter.id)
      const meterMtd = computeMTD(meterReadings.map(r => ({
        id: r.id,
        date: r.date,
        usage: r.usage || 0,
        estimatedCost: r.estimatedCost || 0,
        week: r.week,
        month: r.month,
        year: r.year
      })))

      const meterForecast = forecastUsage(meterMtd.usage, daysElapsed, daysInMonth)
      const meterBillForecast = forecastBill(meterForecast)

      // Get current slab info
      const currentSlab = getCurrentSlab(meterMtd.usage)
      
      return {
        meterId: meter.id,
        label: meter.label,
        type: meter.type,
        currentUsage: meterMtd.usage,
        projectedUsage: meterForecast.expected,
        projectedCost: meterBillForecast.expected,
        currentSlab: currentSlab ? {
          rate: currentSlab.slab.rate,
          min: currentSlab.slab.min,
          max: currentSlab.slab.max,
          unitsUsed: meterMtd.usage - currentSlab.slab.min
        } : null,
        efficiency: calculateMeterEfficiency(meterMtd.usage, meterBillForecast.expected),
        readingsCount: meterReadings.length
      }
    })

    // Calculate optimization opportunities
    const optimizationOpportunities = calculateOptimizationOpportunities(
      meterAnalysis,
      appliancesSummary,
     budget || 25000,
      billForecast.expected
    )

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsage: mtd.usage,
          projectedUsage: usageForecast.expected,
          totalCost: mtd.cost,
          projectedCost: billForecast.expected,
          budget: budget || 25000,
          daysElapsed,
          daysRemaining: daysInMonth - daysElapsed
        },
        meters: meterAnalysis,
        appliances: appliancesSummary,
        opportunities: optimizationOpportunities,
        period: {
          month: currentMonth,
          year: currentYear,
          daysInMonth
        }
      }
    })

  } catch (error) {
    console.error('Error analyzing optimization data:', error)
    return NextResponse.json(
      { error: 'Failed to analyze optimization data' },
      { status: 500 }
    )
  }
}

function calculateMeterEfficiency(usage: number, cost: number): number {
  if (usage === 0) return 100
  const costPerKwh = cost / usage
  
  // Efficiency based on cost per kWh (lower is better)
  if (costPerKwh < 15) return 95
  if (costPerKwh < 20) return 85
  if (costPerKwh < 25) return 70
  return 50
}

function calculateOptimizationOpportunities(
  meterAnalysis: any[],
  appliancesSummary: any,
  budget: number,
  projectedCost: number
) {
  const opportunities = []

  // Budget optimization
  if (projectedCost > budget) {
    const overage = projectedCost - budget
    opportunities.push({
      type: 'budget',
      title: 'Budget Optimization Required',
      description: `Projected to exceed budget by Rs ${Math.round(overage).toLocaleString()}`,
      impact: `Rs ${Math.round(overage * 0.7).toLocaleString()} potential savings`,
      priority: 'high',
      actions: [
        'Reduce AC usage by 2 hours daily',
        'Shift appliances to off-peak hours',
        'Implement smart scheduling'
      ]
    })
  }

  // Slab optimization
  meterAnalysis.forEach(meter => {
    if (meter.currentSlab && meter.projectedUsage > meter.currentSlab.max) {
      opportunities.push({
        type: 'slab',
        title: `${meter.label} Slab Optimization`,
        description: `Projected to exceed ${meter.currentSlab.max} kWh limit`,
        impact: 'Avoid higher tariff rates',
        priority: 'high',
        meterId: meter.meterId,
        actions: [
          `Keep ${meter.label} under ${meter.currentSlab.max} units`,
          'Consider load balancing with other meters'
        ]
      })
    }
  })

  // Appliance optimization
  if (appliancesSummary && appliancesSummary.topConsumers.length > 0) {
    const topConsumer = appliancesSummary.topConsumers[0]
    if (topConsumer.estimatedKwh > 100) {
      opportunities.push({
        type: 'appliance',
        title: 'High Consumption Device',
        description: `${topConsumer.name} consumes ${topConsumer.estimatedKwh} kWh/month`,
        impact: 'Rs 800/month potential savings',
        priority: 'medium',
        applianceId: topConsumer.id,
        actions: [
          'Reduce daily usage hours',
          'Upgrade to energy-efficient model',
          'Use during off-peak hours'
        ]
      })
    }
  }

  // Multi-meter optimization
  if (meterAnalysis.length > 1) {
    const totalProjected = meterAnalysis.reduce((sum, m) => sum + m.projectedUsage, 0)
    const imbalance = Math.abs(meterAnalysis[0].projectedUsage - meterAnalysis[1].projectedUsage)
    
    if (imbalance > totalProjected * 0.3) {
      opportunities.push({
        type: 'load_balancing',
        title: 'Load Balancing Opportunity',
        description: 'Uneven distribution between meters detected',
        impact: 'Rs 600/month potential savings',
        priority: 'medium',
        actions: [
          'Redistribute high-power appliances',
          'Balance daily usage between meters',
          'Optimize peak hour distribution'
        ]
      })
    }
  }

  return opportunities
}