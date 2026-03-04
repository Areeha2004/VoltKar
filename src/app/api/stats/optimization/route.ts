import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { buildOptimizationPayload } from '@/lib/optimizationService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    const includeAppliances = searchParams.get('appliances') !== 'false'
    const bundle = await buildOptimizationPayload({
      userId: session.user.id,
      meterId: meterId || undefined,
      source: 'stats',
      includeAppliances
    })

    return NextResponse.json({
      success: true,
      data: {
        stats: bundle.stats,
        optimization: bundle.optimization
      }
    })

  } catch (error) {
    console.error('Error fetching optimization data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch optimization data' },
      { status: 500 }
    )
  }
}
