import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { computeStatsBundle, getAnalyticsTimeSeries } from '../../../../lib/statService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')

    // Get main stats bundle
    const statsBundle = await computeStatsBundle(session.user.id, meterId || undefined)
    
    // Get time series data for charts
    const timeSeries = await getAnalyticsTimeSeries(session.user.id, meterId || undefined)

    return NextResponse.json({
      success: true,
      data: {
        stats: statsBundle,
        timeSeries,
        metadata: {
          generatedAt: new Date().toISOString(),
          meterId: meterId || 'all',
          calcId: statsBundle.calcId
        }
      }
    })

  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}