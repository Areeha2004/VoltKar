import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { DEMO_MODE_COOKIE, parseDemoMode, resolveDemoMode, type DemoMode } from './demoMode'

export function getDemoModeFromRequest(request: NextRequest): DemoMode {
  const cookieMode = parseDemoMode(request.cookies.get(DEMO_MODE_COOKIE)?.value)
  return resolveDemoMode(cookieMode)
}

export async function getDemoModeFromServerCookies(): Promise<DemoMode> {
  try {
    const cookieStore = await cookies()
    const cookieMode = parseDemoMode(cookieStore.get(DEMO_MODE_COOKIE)?.value)
    return resolveDemoMode(cookieMode)
  } catch {
    return resolveDemoMode(null)
  }
}
