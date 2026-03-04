'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Home,
  LayoutDashboard,
  Lightbulb,
  Settings,
  Trophy,
  WalletCards,
  Zap,
} from 'lucide-react'
import { clsx } from 'clsx'

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const primaryNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Readings', href: '/readings', icon: Home },
  { name: 'Devices', href: '/devices', icon: Lightbulb },
  { name: 'Optimization', href: '/optimization', icon: Zap },
]

const secondaryNav: NavItem[] = [
  { name: 'Meters', href: '/meters', icon: WalletCards },
  { name: 'Challenges', href: '/challenges', icon: Trophy },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const fullName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Operator'
  const initials = useMemo(
    () =>
      fullName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [fullName]
  )

  const renderLink = (item: NavItem) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={clsx(
            'group relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all duration-300',
            collapsed ? 'justify-center' : 'justify-start',
            active
              ? 'border-cyan-400/35 bg-gradient-to-r from-cyan-500/20 to-primary/15 text-foreground shadow-[0_8px_30px_rgba(6,182,212,0.20)]'
              : 'border-transparent text-foreground-secondary hover:border-white/10 hover:bg-white/[0.03] hover:text-foreground'
          )}
          title={collapsed ? item.name : undefined}
        >
          <item.icon className={clsx('h-5 w-5 shrink-0', active ? 'text-cyan-200' : 'text-foreground-secondary')} />
          {!collapsed && <span className="truncate">{item.name}</span>}
          {active && !collapsed && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-300" />}
        </Link>
      </li>
    )
  }

  return (
    <aside
      className={clsx(
        'relative hidden border-r border-white/10 bg-[#0a111f]/85 backdrop-blur-2xl lg:flex',
        'sticky top-20 h-[calc(100vh-5rem)] transition-all duration-500',
        collapsed ? 'w-24' : 'w-72'
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-12 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[70px]" />
      </div>

      <div className="relative flex w-full flex-col">
        <div className={clsx('flex items-center border-b border-white/10 p-4', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-foreground-tertiary">Workspace</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Control Surface</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-foreground-secondary hover:border-cyan-400/35 hover:text-foreground"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <div>
            {!collapsed && (
              <p className="mb-2 px-2 text-[10px] uppercase tracking-[0.2em] text-foreground-tertiary">Primary</p>
            )}
            <ul className="space-y-2">{primaryNav.map((item) => renderLink(item))}</ul>
          </div>

          <div>
            {!collapsed && (
              <p className="mb-2 px-2 text-[10px] uppercase tracking-[0.2em] text-foreground-tertiary">System</p>
            )}
            <ul className="space-y-2">{secondaryNav.map((item) => renderLink(item))}</ul>
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className={clsx('rounded-2xl border border-white/10 bg-white/[0.03] p-3', collapsed && 'flex justify-center')}>
            {!collapsed ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-cyan-400 to-accent-blue text-sm font-bold text-slate-950">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
                  <p className="text-xs text-foreground-tertiary">Premium Operator</p>
                </div>
                <Gauge className="ml-auto h-4 w-4 text-cyan-200" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-cyan-400 to-accent-blue text-sm font-bold text-slate-950">
                {initials}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
