'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Zap, User, Settings, LogOut } from 'lucide-react'
import Button from '../ui/Button'
import { useSession } from 'next-auth/react'
import { Bell } from 'lucide-react'

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
const { data: session, status } = useSession();
  const name = session?.user?.name
    ?? session?.user?.email?.split("@")[0]
    ?? "User";

  const image = session?.user?.image;

  // Fallback initials
  const initials = name
    .split(" ")
    .map(p => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();


  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/50 backdrop-blur-3xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">

{/* Logo */}
<Link href="/" className="flex items-center space-x-3">
  {/* Transparent wrapper */}
  <div className="p-3 rounded-2xl bg-transparent">
    {/* Inline SVG with explicit Tailwind color hexes */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-6 w-6"
    >
      <defs>
        <linearGradient id="zap-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          {/* Replace these with your exact Tailwind primary/accent-cyan hexes */}
          <stop offset="0%" stopColor="#0ee9abff" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Lucide-react “Zap” polygon path */}
      <polygon
        points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
        fill="url(#zap-grad)"
      />
    </svg>
  </div>

  <span className="text-2xl font-bold text-foreground font-sora">Volt</span>
</Link>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="p-3 rounded-2xl hover:bg-background-card transition-colors relative">
              <Bell className="h-5 w-5 text-foreground-secondary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-background-card transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent-cyan rounded-2xl flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <p className="text-xs text-foreground-secondary">{initials}</p>
                </div>
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-card shadow-premium rounded-2xl overflow-hidden">
                  <div className="py-2">
                    <Link href="/profile" className="flex items-center px-6 py-3 text-sm text-foreground-secondary hover:text-foreground hover:bg-background-card/50 transition-colors">
                      <User className="h-4 w-4 mr-3" />
                      Profile Settings
                    </Link>
                    <Link href="/settings" className="flex items-center px-6 py-3 text-sm text-foreground-secondary hover:text-foreground hover:bg-background-card/50 transition-colors">
                      <Settings className="h-4 w-4 mr-3" />
                      Preferences
                    </Link>
                    <div className="border-t border-border/50 my-2" />
                    <button className="flex items-center w-full px-6 py-3 text-sm text-foreground-secondary hover:text-foreground hover:bg-background-card/50 transition-colors">
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-3 rounded-2xl hover:bg-background-card transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-t border-border/50 backdrop-blur-3xl">
          <div className="px-6 py-6 space-y-4">
            <Link href="/dashboard" className="block text-foreground-secondary hover:text-foreground transition-colors text-lg">
              Dashboard
            </Link>
            <Link href="/analytics" className="block text-foreground-secondary hover:text-foreground transition-colors text-lg">
              Analytics
            </Link>
            <Link href="/devices" className="block text-foreground-secondary hover:text-foreground transition-colors text-lg">
              Devices
            </Link>
            <Link href="/challenges" className="block text-foreground-secondary hover:text-foreground transition-colors text-lg">
              Challenges
            </Link>
            <div className="pt-4 border-t border-border/50">
              <Button variant="outline" className="w-full">Sign Out</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar