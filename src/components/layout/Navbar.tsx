'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import type { DemoMode } from '@/lib/demoMode'
import {
  Bell,
  Menu,
  Settings,
  X,
  LogOut,
  LayoutDashboard,
  BarChart3,
  Lightbulb,
  Zap,
  Trophy,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/devices', label: 'Devices', icon: Lightbulb },
  { href: '/optimization', label: 'Optimization', icon: Zap },
  { href: '/challenges', label: 'Challenges', icon: Trophy },
]

const Navbar: React.FC = () => {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [demoMode, setDemoMode] = useState<DemoMode>(
    process.env.NODE_ENV !== 'production' ? 'demo' : 'real'
  )
  const [isModeSaving, setIsModeSaving] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const demoModeEnabled = demoMode === 'demo'

  const name = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'User'
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchDemoModeStatus = async () => {
      try {
        const response = await fetch('/api/demo-mode', { cache: 'no-store' })
        if (!response.ok) return
        const payload = await response.json()
        if (mounted) {
          setDemoMode(payload?.mode === 'real' ? 'real' : 'demo')
        }
      } catch {
        // Keep fallback based on NODE_ENV when status endpoint is unavailable.
      }
    }

    void fetchDemoModeStatus()

    return () => {
      mounted = false
    }
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const handleSignOut = () => {
    void signOut({ callbackUrl: '/login' })
  }

  const handleModeSwitch = async (nextMode: DemoMode) => {
    if (isModeSaving || nextMode === demoMode) return

    setIsModeSaving(true)
    try {
      const makeRequest = (method: 'PUT' | 'POST') =>
        fetch('/api/demo-mode', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: nextMode }),
          credentials: 'same-origin',
        })

      let response = await makeRequest('PUT')
      if (!response.ok && (response.status === 404 || response.status === 405 || response.status === 501)) {
        response = await makeRequest('POST')
      }

      if (!response.ok) {
        const details = await response.text().catch(() => 'Unknown error')
        throw new Error(`Unable to switch mode (${response.status}): ${details}`)
      }

      const payload = await response.json()
      setDemoMode(payload?.mode === 'real' ? 'real' : 'demo')

      // Force data refresh so analytics and validations use the selected mode immediately.
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch mode:', error)
    } finally {
      setIsModeSaving(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-background/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 via-primary/25 to-accent-blue/25 shadow-[0_0_24px_rgba(6,182,212,0.25)]">
            <Zap className="h-5 w-5 text-cyan-300 transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-tertiary">Energy OS</p>
            <p className="font-sora text-xl font-bold text-foreground">Volt</p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.02] p-1.5 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 ${
                  active
                    ? 'bg-gradient-to-r from-cyan-400/25 to-primary/20 text-white shadow-[0_8px_28px_rgba(0,212,170,0.22)]'
                    : 'text-foreground-secondary hover:bg-white/5 hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div
            className={`hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] lg:flex ${
              demoModeEnabled
                ? 'border border-pink-400/35 bg-pink-400/10 text-pink-200'
                : 'border border-emerald-400/35 bg-emerald-400/10 text-emerald-200'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full animate-pulse ${
                demoModeEnabled ? 'bg-pink-300' : 'bg-emerald-300'
              }`}
            />
            {demoModeEnabled ? 'Demo Mode ON' : 'Real Mode ON'}
          </div>
          <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 lg:flex">
            <button
              type="button"
              onClick={() => void handleModeSwitch('demo')}
              disabled={isModeSaving}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-all ${
                demoMode === 'demo'
                  ? 'bg-pink-400/25 text-pink-100'
                  : 'text-foreground-tertiary hover:text-foreground'
              }`}
            >
              Demo
            </button>
            <button
              type="button"
              onClick={() => void handleModeSwitch('real')}
              disabled={isModeSaving}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-all ${
                demoMode === 'real'
                  ? 'bg-emerald-400/20 text-emerald-100'
                  : 'text-foreground-tertiary hover:text-foreground'
              }`}
            >
              Real
            </button>
          </div>
          <button
            type="button"
            className="relative rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-foreground-secondary hover:border-cyan-400/40 hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((open) => !open)}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 hover:border-cyan-400/35 hover:bg-white/[0.05]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary via-cyan-400 to-accent-blue text-sm font-bold text-slate-950">
                {initials}
              </span>
              <div className="text-left leading-tight">
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-xs text-foreground-tertiary">Operator</p>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1423]/95 shadow-premium backdrop-blur-2xl animate-slide-down">
                <div className="p-2">
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground-secondary hover:bg-white/5 hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-foreground-secondary hover:text-foreground lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-background/95 px-4 py-4 backdrop-blur-2xl lg:hidden animate-slide-down">
          <div
            className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
              demoModeEnabled
                ? 'border border-amber-400/30 bg-amber-400/10 text-amber-200'
                : 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full animate-pulse ${
                demoModeEnabled ? 'bg-amber-300' : 'bg-emerald-300'
              }`}
            />
            {demoModeEnabled ? 'Demo Mode ON' : 'Real Mode ON'}
          </div>
          <div className="mb-4 flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
            <button
              type="button"
              onClick={() => void handleModeSwitch('demo')}
              disabled={isModeSaving}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all ${
                demoMode === 'demo'
                  ? 'bg-amber-400/25 text-amber-100'
                  : 'text-foreground-tertiary hover:text-foreground'
              }`}
            >
              Demo
            </button>
            <button
              type="button"
              onClick={() => void handleModeSwitch('real')}
              disabled={isModeSaving}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all ${
                demoMode === 'real'
                  ? 'bg-emerald-400/20 text-emerald-100'
                  : 'text-foreground-tertiary hover:text-foreground'
              }`}
            >
              Real
            </button>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-400/20 to-primary/15 text-white'
                      : 'text-foreground-secondary hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground-secondary hover:bg-white/5 hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
