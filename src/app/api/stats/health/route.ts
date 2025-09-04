import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { validateInvariants } from '../../../../lib/statService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validation = await validateInvariants(session.user.id)

    return NextResponse.json({
      success: true,
      data: {
        health: validation.valid ? 'healthy' : 'issues_detected',
        validation,
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Karachi'
      }
    })

  } catch (error) {
    console.error('Error checking system health:', error)
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    )
  }
}