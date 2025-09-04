import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { computeStatsBundle } from '../../../../lib/statService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')

    const statsBundle = await computeStatsBundle(session.user.id, meterId || undefined)

    return NextResponse.json({
      success: true,
      data: statsBundle
    })

  } catch (error) {
    console.error('Error computing stats overview:', error)
    return NextResponse.json(
      { error: 'Failed to compute stats overview' },
      { status: 500 }
    )
  }
}