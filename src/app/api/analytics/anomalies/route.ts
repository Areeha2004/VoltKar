import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import {
  detectAnomalies,
  generateAnomalySummary,
  type Anomaly
} from '@/lib/anomalyDetection'
import { computeStatsBundle } from '@/lib/statService'

type PersistedStatus = 'active' | 'investigating' | 'resolved'

interface PersistedAnomalyMeta {
  key: string
  type: Anomaly['type']
  severity: Anomaly['severity']
  title: string
  impact?: string
  confidence: number
  suggestedAction?: string
  status: PersistedStatus
  investigationId?: string
  lastActionAt?: string
}

function buildAnomalyKey(anomaly: Pick<Anomaly, 'type' | 'readingId'>): string {
  return `${anomaly.type}:${anomaly.readingId || 'unknown'}`
}

function toPersistedMeta(
  anomaly: Anomaly,
  status: PersistedStatus = 'active'
): PersistedAnomalyMeta {
  return {
    key: buildAnomalyKey(anomaly),
    type: anomaly.type,
    severity: anomaly.severity,
    title: anomaly.title,
    impact: anomaly.impact,
    confidence: anomaly.confidence,
    suggestedAction: anomaly.suggestedAction,
    status
  }
}

function parsePersistedMeta(raw: string | null, fallback: {
  readingId: string
  description: string | null
  detected: boolean
}): PersistedAnomalyMeta {
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as PersistedAnomalyMeta
      if (parsed && parsed.key && parsed.type && parsed.severity && parsed.title) {
        return parsed
      }
    } catch {
      // ignore malformed JSON legacy records
    }
  }

  return {
    key: `usage_spike:${fallback.readingId}`,
    type: 'usage_spike',
    severity: 'medium',
    title: fallback.detected ? 'Usage Anomaly' : 'Resolved Anomaly',
    confidence: 75,
    status: fallback.detected ? 'active' : 'resolved'
  }
}

function toClientAnomaly(row: {
  id: string
  detected: boolean
  description: string | null
  suggestedTip: string | null
  readingId: string
  createdAt: Date
  reading: { meterId: string; date: Date } | null
}): Anomaly & { status: PersistedStatus; investigationId?: string } {
  const meta = parsePersistedMeta(row.suggestedTip, {
    readingId: row.readingId,
    description: row.description,
    detected: row.detected
  })
  const resolved = meta.status === 'resolved' || !row.detected

  return {
    id: row.id,
    type: meta.type,
    severity: meta.severity,
    title: meta.title,
    description: row.description || 'No description available.',
    detectedAt: row.createdAt,
    readingId: row.readingId,
    meterId: row.reading?.meterId,
    impact: meta.impact,
    confidence: meta.confidence,
    resolved,
    suggestedAction: meta.suggestedAction,
    status: meta.status,
    investigationId: meta.investigationId
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    const includeResolved = searchParams.get('includeResolved') === 'true'
    const severity = searchParams.get('severity')

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const readingWhere: any = {
      userId: session.user.id,
      month: currentMonth,
      year: currentYear
    }
    if (meterId) readingWhere.meterId = meterId

    const readings = await prisma.meterReading.findMany({
      where: readingWhere,
      include: {
        meter: {
          select: { id: true, label: true, type: true }
        }
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
    })

    const analyticsReadings = readings.map(reading => ({
      id: reading.id,
      date: reading.date,
      usage: reading.usage || 0,
      estimatedCost: reading.estimatedCost || 0,
      week: reading.week,
      month: reading.month,
      year: reading.year
    }))

    const detectedNow = detectAnomalies(analyticsReadings)
    const readingIdsInScope = new Set(readings.map(reading => reading.id))
    const existing = await prisma.anomalyDetection.findMany({
      where: {
        userId: session.user.id,
        reading: {
          month: currentMonth,
          year: currentYear,
          ...(meterId ? { meterId } : {})
        }
      },
      include: {
        reading: {
          select: { meterId: true, date: true }
        }
      }
    })

    const existingByKey = new Map<
      string,
      {
        row: typeof existing[number]
        meta: PersistedAnomalyMeta
      }
    >()
    for (const row of existing) {
      const meta = parsePersistedMeta(row.suggestedTip, {
        readingId: row.readingId,
        description: row.description,
        detected: row.detected
      })
      existingByKey.set(meta.key, { row, meta })
    }

    const seenKeys = new Set<string>()
    for (const anomaly of detectedNow) {
      if (!anomaly.readingId || !readingIdsInScope.has(anomaly.readingId)) continue

      const key = buildAnomalyKey(anomaly)
      const nextMeta = toPersistedMeta(anomaly, 'active')
      seenKeys.add(key)

      const found = existingByKey.get(key)
      if (found) {
        await prisma.anomalyDetection.update({
          where: { id: found.row.id },
          data: {
            detected: true,
            description: anomaly.description,
            suggestedTip: JSON.stringify({
              ...nextMeta,
              ...(found.meta.status === 'investigating'
                ? { status: 'investigating' as const, investigationId: found.meta.investigationId }
                : {})
            })
          }
        })
      } else {
        await prisma.anomalyDetection.create({
          data: {
            userId: session.user.id,
            readingId: anomaly.readingId,
            detected: true,
            description: anomaly.description,
            suggestedTip: JSON.stringify(nextMeta)
          }
        })
      }
    }

    // Auto-resolve stale active anomalies no longer detected this cycle.
    for (const entry of existingByKey.values()) {
      if (seenKeys.has(entry.meta.key)) continue
      if (!entry.row.detected) continue
      if (entry.meta.status === 'investigating') continue

      await prisma.anomalyDetection.update({
        where: { id: entry.row.id },
        data: {
          detected: false,
          suggestedTip: JSON.stringify({
            ...entry.meta,
            status: 'resolved' as const,
            lastActionAt: new Date().toISOString()
          })
        }
      })
    }

    const persistedRows = await prisma.anomalyDetection.findMany({
      where: {
        userId: session.user.id,
        reading: {
          month: currentMonth,
          year: currentYear,
          ...(meterId ? { meterId } : {})
        }
      },
      include: {
        reading: {
          select: { meterId: true, date: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    let clientAnomalies = persistedRows.map(toClientAnomaly)
    if (!includeResolved) {
      clientAnomalies = clientAnomalies.filter(item => !item.resolved)
    }
    if (severity) {
      clientAnomalies = clientAnomalies.filter(item => item.severity === severity)
    }

    const summary = generateAnomalySummary(clientAnomalies)

    const historicalReadings = await prisma.meterReading.findMany({
      where: {
        userId: session.user.id,
        ...(meterId ? { meterId } : {}),
        OR: [
          { month: currentMonth - 1, year: currentYear },
          { month: currentMonth - 2, year: currentYear },
          ...(currentMonth <= 2
            ? [
                { month: 12 + currentMonth - 1, year: currentYear - 1 },
                { month: 12 + currentMonth - 2, year: currentYear - 1 }
              ]
            : [])
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

    const historicalAnomalies = detectAnomalies(
      historicalReadings.map(reading => ({
        id: reading.id,
        date: reading.date,
        usage: reading.usage || 0,
        estimatedCost: reading.estimatedCost || 0,
        week: reading.week,
        month: reading.month,
        year: reading.year
      }))
    )

    const trends = {
      currentMonth: clientAnomalies.length,
      lastMonth: historicalAnomalies.length,
      improvement:
        historicalAnomalies.length > 0
          ? ((historicalAnomalies.length - clientAnomalies.length) / historicalAnomalies.length) * 100
          : 0
    }

    const stats = await computeStatsBundle(session.user.id, meterId || undefined)

    return NextResponse.json({
      success: true,
      data: {
        timeframeLabels: stats.timeframeLabels,
        anomalies: clientAnomalies,
        summary,
        trends,
        period: {
          month: currentMonth,
          year: currentYear,
          meterId: meterId || 'all',
          labels: {
            mtd: stats.timeframeLabels.mtd,
            previousMonth: stats.timeframeLabels.prevMonthFull
          }
        },
        filters: {
          includeResolved,
          severity,
          total: persistedRows.length,
          filtered: clientAnomalies.length
        }
      }
    })
  } catch (error) {
    console.error('Error detecting anomalies:', error)
    return NextResponse.json({ error: 'Failed to detect anomalies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { anomalyId, action } = await request.json()
    if (!anomalyId || !action) {
      return NextResponse.json({ error: 'anomalyId and action are required' }, { status: 400 })
    }

    const anomalyRecord = await prisma.anomalyDetection.findFirst({
      where: {
        id: anomalyId,
        userId: session.user.id
      },
      include: {
        reading: {
          select: { meterId: true, date: true }
        }
      }
    })

    if (!anomalyRecord) {
      return NextResponse.json({ error: 'Anomaly not found' }, { status: 404 })
    }

    const meta = parsePersistedMeta(anomalyRecord.suggestedTip, {
      readingId: anomalyRecord.readingId,
      description: anomalyRecord.description,
      detected: anomalyRecord.detected
    })

    if (action !== 'resolve' && action !== 'investigate') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updatedMeta: PersistedAnomalyMeta =
      action === 'resolve'
        ? {
            ...meta,
            status: 'resolved',
            lastActionAt: new Date().toISOString()
          }
        : {
            ...meta,
            status: 'investigating',
            investigationId: meta.investigationId || `inv_${Date.now()}`,
            lastActionAt: new Date().toISOString()
          }

    const updated = await prisma.anomalyDetection.update({
      where: { id: anomalyId },
      data: {
        detected: action === 'resolve' ? false : true,
        suggestedTip: JSON.stringify(updatedMeta)
      },
      include: {
        reading: {
          select: { meterId: true, date: true }
        }
      }
    })

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'alert',
        content:
          action === 'resolve'
            ? `Resolved anomaly: ${updatedMeta.title}`
            : `Investigation started for anomaly: ${updatedMeta.title}`,
        seen: false
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        anomaly: toClientAnomaly(updated),
        action,
        message:
          action === 'resolve' ? 'Anomaly marked as resolved.' : 'Investigation initiated.'
      }
    })
  } catch (error) {
    console.error('Error handling anomaly action:', error)
    return NextResponse.json({ error: 'Failed to process anomaly action' }, { status: 500 })
  }
}
