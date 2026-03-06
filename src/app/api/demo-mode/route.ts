import { NextRequest, NextResponse } from 'next/server'
import {
  DEMO_MODE_COOKIE,
  isDemoTimeTravelEnabled,
  parseDemoMode,
  resolveDemoMode
} from '@/lib/demoMode'
import { getDemoModeFromRequest } from '@/lib/demoModeServer'

export const dynamic = 'force-dynamic'

function buildDemoModePayload(modeValue: string | null | undefined) {
  const mode = resolveDemoMode(modeValue)
  const enabled = isDemoTimeTravelEnabled(mode)

  return {
    mode,
    enabled,
    label: enabled ? 'Demo Mode ON' : 'Demo Mode OFF',
    description: enabled
      ? 'Future readings accepted for demo analytics and calculations.'
      : 'Future readings disabled. Only real-time dates are accepted.'
  }
}

export async function GET(request: NextRequest) {
  const mode = getDemoModeFromRequest(request)
  return NextResponse.json(buildDemoModePayload(mode))
}

async function setDemoModeFromRequest(request: NextRequest) {
  const body = await request.json().catch(() => ({} as { mode?: string }))
  const incomingMode = parseDemoMode(body?.mode)
  if (!incomingMode) {
    return NextResponse.json({ error: 'Mode must be either "demo" or "real"' }, { status: 400 })
  }

  const response = NextResponse.json(buildDemoModePayload(incomingMode))
  response.cookies.set(DEMO_MODE_COOKIE, incomingMode, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })

  return response
}

export async function PUT(request: NextRequest) {
  return setDemoModeFromRequest(request)
}

export async function POST(request: NextRequest) {
  return setDemoModeFromRequest(request)
}
