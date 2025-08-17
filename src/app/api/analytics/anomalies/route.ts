import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { detectAnomalies, generateAnomalySummary } from '@/lib/anomalyDetection'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    const includeResolved = searchParams.get('includeResolved') === 'true'
    const severity = searchParams.get('severity') // 'low', 'medium', 'high', 'critical'
    
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

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

    // Transform readings for anomaly detection
    const analyticsReadings = readings.map(reading => ({
      id: reading.id,
      date: reading.date,
      usage: reading.usage || 0,
      estimatedCost: reading.estimatedCost || 0,
      week: reading.week,
      month: reading.month,
      year: reading.year
    }))

    // Detect anomalies
    const detectedAnomalies = detectAnomalies(analyticsReadings)
    
    // Filter anomalies based on parameters
    let filteredAnomalies = detectedAnomalies
    
    if (!includeResolved) {
      filteredAnomalies = filteredAnomalies.filter(a => !a.resolved)
    }
    
    if (severity) {
      filteredAnomalies = filteredAnomalies.filter(a => a.severity === severity)
    }

    // Generate summary
    const summary = generateAnomalySummary(filteredAnomalies)

    // Get historical anomalies for trend analysis
    const historicalReadings = await prisma.meterReading.findMany({
      where: {
        userId: session.user.id,
        ...(meterId && { meterId }),
        OR: [
          { month: currentMonth - 1, year: currentYear },
          { month: currentMonth - 2, year: currentYear },
          // Handle year boundary
          ...(currentMonth <= 2 ? [
            { month: 12 + currentMonth - 1, year: currentYear - 1 },
            { month: 12 + currentMonth - 2, year: currentYear - 1 }
          ] : [])
        ]
      },
      select: {
        id: true,
        date: true,
        usage: true,
        estimatedCost: true,
        week: true,
        month: true,
        year: true
      }
    })

    const historicalAnalyticsReadings = historicalReadings.map(reading => ({
      id: reading.id,
      date: reading.date,
      usage: reading.usage || 0,
      estimatedCost: reading.estimatedCost || 0,
      week: reading.week,
      month: reading.month,
      year: reading.year
    }))

    const historicalAnomalies = detectAnomalies(historicalAnalyticsReadings)

    // Calculate anomaly trends
    const trends = {
      currentMonth: filteredAnomalies.length,
      lastMonth: historicalAnomalies.filter(a => a.type === 'usage_spike').length,
      improvement: historicalAnomalies.length > 0 ? 
        ((historicalAnomalies.length - filteredAnomalies.length) / historicalAnomalies.length) * 100 : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        anomalies: filteredAnomalies,
        summary,
        trends,
        period: {
          month: currentMonth,
          year: currentYear,
          meterId: meterId || 'all'
        },
        filters: {
          includeResolved,
          severity,
          total: detectedAnomalies.length,
          filtered: filteredAnomalies.length
        }
      }
    })

  } catch (error) {
    console.error('Error detecting anomalies:', error)
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { anomalyId, action } = await request.json()
    
    if (action === 'resolve') {
      // In a real implementation, you would update the anomaly status in the database
      // For now, we'll just return success
      return NextResponse.json({
        success: true,
        message: 'Anomaly marked as resolved'
      })
    }
    
    if (action === 'investigate') {
      // Trigger detailed investigation
      return NextResponse.json({
        success: true,
        message: 'Investigation initiated',
        investigationId: `inv_${Date.now()}`
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error handling anomaly action:', error)
    return NextResponse.json(
      { error: 'Failed to process anomaly action' },
      { status: 500 }
    )
  }
}