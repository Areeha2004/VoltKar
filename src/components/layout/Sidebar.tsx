'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Zap, 
  Target, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  Lightbulb,
  Trophy,
  Users
} from 'lucide-react'
import { clsx } from 'clsx'

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Reading Entry', href: '/readings', icon: Home },
    { name: 'Devices', href: '/devices', icon: Lightbulb },
    { name: 'Optimization', href: '/optimization', icon: Zap },
    { name: 'Challenges', href: '/challenges', icon: Trophy },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className={clsx(
      'glass-card border-r border-border/50 h-screen sticky top-0 transition-all duration-500 backdrop-blur-3xl',
      collapsed ? 'w-20' : 'w-72'
    )}>
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="flex justify-end p-6">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-3 rounded-2xl hover:bg-background-card transition-all duration-300 group"
          >
            {collapsed ? 
              <ChevronRight className="h-5 w-5 text-foreground-secondary group-hover:text-foreground" /> : 
              <ChevronLeft className="h-5 w-5 text-foreground-secondary group-hover:text-foreground" />
            }
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 pb-6">
          <ul className="space-y-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={clsx(
                      'flex items-center px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden',
                      isActive 
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-glow' 
                        : 'text-foreground-secondary hover:text-foreground hover:bg-background-card/50'
                    )}
                  >
                    <item.icon className={clsx(
                      'h-6 w-6 transition-all duration-300', 
                      collapsed ? 'mx-auto' : 'mr-4'
                    )} />
                    {!collapsed && (
                      <span className="font-medium text-lg">{item.name}</span>
                    )}
                    {isActive && !collapsed && (
                      <div className="absolute right-4">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info */}
        {!collapsed && (
          <div className="p-6 border-t border-border/50">
            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-background-card/50">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent-cyan rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Ahmed Khan</p>
                <p className="text-sm text-foreground-tertiary">Premium Plan</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar