import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { tariffEngine, getSlabWarningMessage } from '@/lib/tariffEngine'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

    // Get current month readings (all weeks)
    const currentMonthReadings = await prisma.meterReading.findMany({
      where: {
        userId,
        month: currentMonth,
        year: currentYear
      },
      include: { meter: true },
      orderBy: { date: 'desc' }
    })

    // Get last month readings for comparison
    const lastMonthReadings = await prisma.meterReading.findMany({
      where: {
        userId,
        month: lastMonth,
        year: lastMonthYear
      }
    })

    // Calculate current month usage and costs
    let currentUsage = 0
    let totalEstimatedCost = 0
    let hasSlabWarnings = false
    const slabWarnings: string[] = []

    // Group readings by meter to get latest reading per meter
    const meterReadings = new Map()
    currentMonthReadings.forEach(reading => {
      if (!meterReadings.has(reading.meterId) || 
          reading.date > meterReadings.get(reading.meterId).date) {
        meterReadings.set(reading.meterId, reading)
      }
    })

    // Calculate totals from latest readings per meter
    for (const reading of meterReadings.values()) {
      if (reading.usage) {
        currentUsage += reading.usage
        totalEstimatedCost += reading.estimatedCost || 0
        
        // Check for slab warnings
        const warningMessage = getSlabWarningMessage(reading.usage)
        if (warningMessage) {
          hasSlabWarnings = true
          slabWarnings.push(`${reading.meter.label}: ${warningMessage}`)
        }
      }
    }

    // Calculate last month totals for comparison
    let lastMonthUsage = 0
    let lastMonthCost = 0
    
    const lastMonthMeterReadings = new Map()
    lastMonthReadings.forEach(reading => {
      if (!lastMonthMeterReadings.has(reading.meterId) || 
          reading.date > lastMonthMeterReadings.get(reading.meterId).date) {
        lastMonthMeterReadings.set(reading.meterId, reading)
      }
    })

    for (const reading of lastMonthMeterReadings.values()) {
      if (reading.usage) {
        lastMonthUsage += reading.usage
        lastMonthCost += reading.estimatedCost || 0
      }
    }

    // Calculate changes
    const usageChange = lastMonthUsage > 0 
      ? ((currentUsage - lastMonthUsage) / lastMonthUsage * 100).toFixed(1)
      : '0'
       
    const costChange = lastMonthCost > 0 
      ? ((totalEstimatedCost - lastMonthCost) / lastMonthCost * 100).toFixed(1)
      : '0'

    // Get total meters count
    const metersCount = await prisma.meter.count({
      where: { userId }
    })

    // Calculate efficiency score (simplified)
    const avgUsagePerMeter = metersCount > 0 ? currentUsage / metersCount : 0
    const efficiencyScore = Math.min(100, Math.max(0, 100 - (avgUsagePerMeter / 300 * 30)))

    // Project monthly cost based on current week
    const currentWeek = Math.ceil(currentDate.getDate() / 7)
    const projectedMonthlyUsage = currentWeek > 0 ? (currentUsage / currentWeek) * 4 : currentUsage
    const projectedCost = projectedMonthlyUsage > 0 ? tariffEngine(projectedMonthlyUsage).totalCost : totalEstimatedCost

    // Generate alerts based on actual data
    const alerts = []
    
    if (hasSlabWarnings) {
      alerts.push({
        type: 'warning',
        title: 'Slab Warning Alert',
        message: 'You are approaching higher tariff slabs on some meters',
        time: 'Now',
        priority: 'high',
        details: slabWarnings
      })
    }
    
    if (currentUsage > lastMonthUsage * 1.2) {
      alerts.push({
        type: 'warning',
        title: 'High Usage Alert',
        message: `Usage is ${Math.round(((currentUsage - lastMonthUsage) / lastMonthUsage) * 100)}% higher than last month`,
        time: '1 hour ago',
        priority: 'medium'
      })
    }
    
    if (efficiencyScore > 85) {
      alerts.push({
        type: 'success',
        title: 'Excellent Efficiency',
        message: 'Your energy usage is very efficient this month',
        time: '2 hours ago',
        priority: 'low'
      })
    }

    // Get recent readings for display
    const recentReadings = await Promise.all(
      currentMonthReadings.slice(0, 5).map(async (reading) => ({
        date: reading.date.toISOString().split('T')[0],
        meter: reading.meter.label,
        reading: reading.reading,
        week: reading.week,
        usage: reading.usage || 0,
        cost: Math.round(reading.estimatedCost || 0),
        estimatedCost: Math.round(reading.estimatedCost || 0),
        isOfficialEndOfMonth: reading.isOfficialEndOfMonth
      }))
    )

    return NextResponse.json({
      stats: {
        currentUsage: Math.round(currentUsage),
        forecastBill: Math.round(projectedCost),
        costToDate: Math.round(totalEstimatedCost),
        efficiencyScore: Math.round(efficiencyScore),
        usageChange: `${parseFloat(usageChange) > 0 ? '+' : ''}${usageChange}%`,
        costChange: `${parseFloat(costChange) > 0 ? '+' : ''}${costChange}%`,
        metersCount,
        hasSlabWarnings,
        avgCostPerKwh: currentUsage > 0 ? Math.round((totalEstimatedCost / currentUsage) * 100) / 100 : 0,
        currentWeek,
        projectedMonthlyUsage: Math.round(projectedMonthlyUsage)
      },
      alerts,
      recentReadings
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}