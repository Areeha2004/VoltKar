import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { computeStatsBundle } from '@/lib/statService'

export const dynamic = 'force-dynamic'

type FeedSeverity = 'low' | 'medium' | 'high' | 'critical'

interface FeedItem {
  id: string
  source: 'budget' | 'anomaly' | 'system'
  severity: FeedSeverity
  title: string
  message: string
  createdAt: string
  actions?: Array<{ label: string; href: string }>
}

function parseAnomalyMeta(raw: string | null) {
  if (!raw) return null
  try {
    return JSON.parse(raw) as {
      title?: string
      severity?: FeedSeverity
      status?: string
    }
  } catch {
    return null
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit')) || 12))

    const stats = await computeStatsBundle(session.user.id, meterId || undefined)
    const currentMonth = stats.window.now.getMonth() + 1
    const currentYear = stats.window.now.getFullYear()
    const feed: FeedItem[] = []

    const budgetTarget = stats.budget.monthly_budget_pkr || 0
    if (budgetTarget > 0) {
      if (stats.forecast.cost_pkr > budgetTarget) {
        const over = round2(stats.forecast.cost_pkr - budgetTarget)
        feed.push({
          id: 'budget-overrun',
          source: 'budget',
          severity: over > budgetTarget * 0.2 ? 'critical' : 'high',
          title: 'Budget Overrun Forecast',
          message: `Projected bill exceeds budget by Rs ${over.toLocaleString()}.`,
          createdAt: new Date().toISOString(),
          actions: [
            { label: 'Open Optimization', href: '/optimization' },
            { label: 'Open Analytics', href: '/analytics' }
          ]
        })
      } else if (stats.forecast.cost_pkr > budgetTarget * 0.9) {
        feed.push({
          id: 'budget-at-risk',
          source: 'budget',
          severity: 'medium',
          title: 'Budget Near Limit',
          message: 'Forecast is above 90% of budget. Consider light optimizations this week.',
          createdAt: new Date().toISOString(),
          actions: [{ label: 'Review Suggestions', href: '/optimization' }]
        })
      }
    } else {
      feed.push({
        id: 'budget-not-set',
        source: 'budget',
        severity: 'low',
        title: 'No Budget Set',
        message: 'Set a monthly budget to unlock forecast alerts and recovery plans.',
        createdAt: new Date().toISOString(),
        actions: [{ label: 'Set Budget', href: '/dashboard' }]
      })
    }

    const anomalyRows = await prisma.anomalyDetection.findMany({
      where: {
        userId: session.user.id,
        detected: true,
        reading: {
          month: currentMonth,
          year: currentYear,
          ...(meterId ? { meterId } : {})
        }
      },
      include: {
        reading: {
          select: { meterId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    for (const row of anomalyRows) {
      const meta = parseAnomalyMeta(row.suggestedTip)
      if (meta?.status === 'resolved') continue
      feed.push({
        id: `anomaly-${row.id}`,
        source: 'anomaly',
        severity: meta?.severity || 'medium',
        title: meta?.title || 'Usage Anomaly',
        message: row.description || 'An anomaly was detected in your meter readings.',
        createdAt: row.createdAt.toISOString(),
        actions: [{ label: 'Open Analytics', href: '/analytics?tab=anomalies' }]
      })
    }

    const systemNotifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        seen: false
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(5, limit)
    })

    for (const item of systemNotifications) {
      feed.push({
        id: `notification-${item.id}`,
        source: 'system',
        severity: item.type === 'alert' ? 'medium' : 'low',
        title: item.type === 'alert' ? 'System Alert' : 'Reminder',
        message: item.content,
        createdAt: item.createdAt.toISOString()
      })
    }

    const sorted = feed
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        alerts: sorted,
        summary: {
          total: sorted.length,
          critical: sorted.filter(item => item.severity === 'critical').length,
          high: sorted.filter(item => item.severity === 'high').length,
          medium: sorted.filter(item => item.severity === 'medium').length,
          low: sorted.filter(item => item.severity === 'low').length
        },
        timeframeLabels: stats.timeframeLabels
      }
    })
  } catch (error) {
    console.error('Error fetching alert feed:', error)
    return NextResponse.json({ error: 'Failed to fetch alert feed' }, { status: 500 })
  }
}
