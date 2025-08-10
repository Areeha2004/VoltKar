import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

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
    let forecastBill = 0

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
        forecastBill += usage * 19.3 // Average rate
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
    const efficiencyScore = Math.min(100, Math.max(0, 100 - (currentUsage / 1000 * 10)))

    // Get recent alerts (simplified - you can enhance this)
    const alerts = [
      {
        type: 'warning',
        title: 'High Usage Alert',
        message: 'Your AC usage is 25% higher than usual this week',
        time: '2 hours ago',
        priority: 'high'
      }
    ]

    return NextResponse.json({
      stats: {
        currentUsage: Math.round(currentUsage),
        forecastBill: Math.round(forecastBill),
        costToDate: Math.round(forecastBill * 0.7), // Estimated
        efficiencyScore: Math.round(efficiencyScore),
        usageChange: `${parseFloat(usageChange) > 0 ? '+' : ''}${usageChange}%`,
        metersCount
      },
      alerts,
      recentReadings: currentMonthReadings.slice(0, 5).map(reading => ({
        date: reading.createdAt.toISOString().split('T')[0],
        meter: reading.meter.label,
        reading: reading.reading,
        usage: 0, // Will be calculated
        cost: 0 // Will be calculated
      }))
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}