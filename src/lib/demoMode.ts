export type DemoMode = 'demo' | 'real'

export const DEMO_MODE_COOKIE = 'volt_mode'

function isTruthy(value: string | undefined): boolean {
  if (!value) return false
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

export function parseDemoMode(value: string | null | undefined): DemoMode | null {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'demo') return 'demo'
  if (normalized === 'real') return 'real'
  return null
}

export function getDefaultDemoMode(): DemoMode {
  return isTruthy(process.env.DEMO_ALLOW_FUTURE_READINGS) || process.env.NODE_ENV !== 'production'
    ? 'demo'
    : 'real'
}

export function resolveDemoMode(mode?: DemoMode | string | null): DemoMode {
  return parseDemoMode(mode) ?? getDefaultDemoMode()
}

export function isDemoTimeTravelEnabled(mode?: DemoMode | string | null): boolean {
  return resolveDemoMode(mode) === 'demo'
}
