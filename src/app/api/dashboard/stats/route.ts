import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { computeStatsBundle } from '@/lib/statService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')

    const statsBundle = await computeStatsBundle(session.user.id, meterId || undefined)

    // Map statsBundle to the expected dashboard format for backward compatibility if needed, 
    // but preferably the frontend should be updated to use the new bundle directly.
    // For now, we return the bundle which contains all necessary data.
    return NextResponse.json({
      stats: {
        currentUsage: statsBundle.mtd.usage_kwh,
        forecastBill: statsBundle.forecast.cost_pkr,
        costToDate: statsBundle.mtd.cost_pkr,
        efficiencyScore: statsBundle.mtd.efficiency_score,
        usageChange: `${statsBundle.mtd.vs_prev_same_period.pct_kwh > 0 ? '+' : ''}${statsBundle.mtd.vs_prev_same_period.pct_kwh}%`,
        costChange: `${statsBundle.mtd.vs_prev_same_period.pct_cost > 0 ? '+' : ''}${statsBundle.mtd.vs_prev_same_period.pct_cost}%`,
        metersCount: 1, // This should be fetched if needed, but StatService handles aggregation
        hasSlabWarnings: statsBundle.data_quality.warnings.length > 0,
        avgCostPerKwh: statsBundle.mtd.usage_kwh > 0 ? statsBundle.mtd.cost_pkr / statsBundle.mtd.usage_kwh : 0,
        currentWeek: Math.ceil(statsBundle.window.daysElapsed / 7),
        projectedMonthlyUsage: statsBundle.forecast.usage_kwh
      },
      alerts: statsBundle.data_quality.warnings.map(w => ({
        type: 'warning',
        title: 'Data Quality Alert',
        message: w,
        time: 'Now',
        priority: 'medium'
      })),
      recentReadings: [] // Should be fetched separately or added to StatService
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}