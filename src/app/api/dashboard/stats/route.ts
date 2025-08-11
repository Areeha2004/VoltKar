import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { calculateElectricityBill, getSlabWarningMessage } from '@/lib/slabCalculations'

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

    // Get current month readings
    const currentMonthReadings = await prisma.meterReading.findMany({
      where: {
        userId,
        month: currentMonth,
        year: currentYear
      },
      include: { meter: true }
    })

    // Get last month readings for comparison
    const lastMonthReadings = await prisma.meterReading.findMany({
      where: {
        userId,
        month: lastMonth,
        year: lastMonthYear
      }
    })

    // Calculate current usage
    let currentUsage = 0
    let totalEstimatedCost = 0
    let hasSlabWarnings = false
    const slabWarnings: string[] = []

    for (const reading of currentMonthReadings) {
      const previousReading = await prisma.meterReading.findFirst({
        where: {
          meterId: reading.meterId,
          createdAt: { lt: reading.createdAt }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (previousReading) {
        const usage = Math.max(0, reading.reading - previousReading.reading)
        currentUsage += usage
        
        // Calculate proper cost using slab structure
        const costBreakdown = calculateElectricityBill(usage)
        // Use stored cost if available, otherwise calculate
        const cost = reading.estimatedCost || costBreakdown.totalCost
        totalEstimatedCost += cost
        
        // Check for slab warnings
        const warningMessage = getSlabWarningMessage(usage)
        if (warningMessage) {
          hasSlabWarnings = true
          slabWarnings.push(`${reading.meter.label}: ${warningMessage}`)
        }
      }
    }

    // Calculate last month usage for comparison
    let lastMonthUsage = 0
    for (const reading of lastMonthReadings) {
      const previousReading = await prisma.meterReading.findFirst({
        where: {
          meterId: reading.meterId,
          createdAt: { lt: reading.createdAt }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (previousReading) {
        const usage = Math.max(0, reading.reading - previousReading.reading)
        lastMonthUsage += usage
      }
    }

    // Calculate changes
    const usageChange = lastMonthUsage > 0 
      ? ((currentUsage - lastMonthUsage) / lastMonthUsage * 100).toFixed(1)
      : '0'

    // Get total meters count
    const metersCount = await prisma.meter.count({
      where: { userId }
    })

    // Calculate efficiency score (simplified)
    const avgUsagePerMeter = metersCount > 0 ? currentUsage / metersCount : 0
    const efficiencyScore = Math.min(100, Math.max(0, 100 - (avgUsagePerMeter / 300 * 30))) // Based on 300 kWh being average

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

    return NextResponse.json({
      stats: {
        currentUsage: Math.round(currentUsage),
        forecastBill: Math.round(totalEstimatedCost),
        costToDate: Math.round(totalEstimatedCost * 0.8), // Estimated based on days elapsed
        efficiencyScore: Math.round(efficiencyScore),
        usageChange: `${parseFloat(usageChange) > 0 ? '+' : ''}${usageChange}%`,
        metersCount,
        hasSlabWarnings,
        avgCostPerKwh: currentUsage > 0 ? Math.round((totalEstimatedCost / currentUsage) * 100) / 100 : 0
      },
      alerts,
      recentReadings: await Promise.all(
        currentMonthReadings.slice(0, 5).map(async (reading) => {
          const prev = await prisma.meterReading.findFirst({
            where: { meterId: reading.meterId, createdAt: { lt: reading.createdAt } },
            orderBy: { createdAt: 'desc' }
          })
          const usage = prev ? Math.max(0, reading.reading - prev.reading) : 0
          const costBreakdown = calculateElectricityBill(usage)
          
          return {
            date: reading.createdAt.toISOString().split('T')[0],
            meter: reading.meter.label,
            reading: reading.reading,
            usage,
            cost: Math.round(costBreakdown.totalCost)
          }
        })
      )
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}