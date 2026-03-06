'use client'

import React, { useEffect, useState } from 'react'
import {
  Bell,
  DollarSign,
  Globe,
  Palette,
  Save,
  Shield,
  Target,
  Zap
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { DISCO_OPTIONS, type DistributionOperator } from '@/lib/discoTariffs'

type NotificationSettings = {
  budgetAlerts: boolean
  slabWarnings: boolean
  weeklyReports: boolean
  costSpikes: boolean
}

type DisplaySettings = {
  theme: 'dark' | 'light' | 'auto'
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
}

type PrivacySettings = {
  dataSharing: boolean
  analytics: boolean
  marketing: boolean
}

type LocalSettings = {
  notifications: NotificationSettings
  display: DisplaySettings
  privacy: PrivacySettings
}

type ServerSettings = {
  disco: DistributionOperator
  language: 'en' | 'ur'
  unitType: 'kWh'
  currency: 'PKR' | 'USD'
}

const LOCAL_SETTINGS_KEY = 'volt_settings_v1'

const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  notifications: {
    budgetAlerts: true,
    slabWarnings: true,
    weeklyReports: true,
    costSpikes: true
  },
  display: {
    theme: 'dark',
    dateFormat: 'DD/MM/YYYY'
  },
  privacy: {
    dataSharing: false,
    analytics: true,
    marketing: false
  }
}

const DEFAULT_SERVER_SETTINGS: ServerSettings = {
  disco: 'LESCO',
  language: 'en',
  unitType: 'kWh',
  currency: 'PKR'
}

function applyTheme(theme: DisplaySettings['theme']) {
  const root = document.documentElement
  if (theme === 'light') {
    root.classList.remove('dark')
    return
  }
  if (theme === 'dark') {
    root.classList.add('dark')
    return
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  root.classList.toggle('dark', prefersDark)
}

function safeReadLocalSettings(): LocalSettings {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY)
    if (!raw) return DEFAULT_LOCAL_SETTINGS
    const parsed = JSON.parse(raw) as LocalSettings
    return {
      notifications: { ...DEFAULT_LOCAL_SETTINGS.notifications, ...parsed.notifications },
      display: { ...DEFAULT_LOCAL_SETTINGS.display, ...parsed.display },
      privacy: { ...DEFAULT_LOCAL_SETTINGS.privacy, ...parsed.privacy }
    }
  } catch {
    return DEFAULT_LOCAL_SETTINGS
  }
}

const SettingsPage: React.FC = () => {
  const [budget, setBudget] = useState<string>('')
  const [initialLoading, setInitialLoading] = useState(true)
  const [savingBudget, setSavingBudget] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  })
  const [serverSettings, setServerSettings] = useState<ServerSettings>(DEFAULT_SERVER_SETTINGS)
  const [localSettings, setLocalSettings] = useState<LocalSettings>(DEFAULT_LOCAL_SETTINGS)

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message })
    setTimeout(() => {
      setStatus({ type: null, message: '' })
    }, 3000)
  }

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const local = safeReadLocalSettings()
        setLocalSettings(local)
        applyTheme(local.display.theme)

        const response = await fetch('/api/settings/preferences')
        if (!response.ok) {
          throw new Error('Failed to load server preferences')
        }
        const payload = await response.json()
        const preferences = payload?.preferences
        if (preferences) {
          setServerSettings({
            disco: preferences.disco || DEFAULT_SERVER_SETTINGS.disco,
            language: preferences.language === 'ur' ? 'ur' : 'en',
            unitType: 'kWh',
            currency: preferences.currency === 'USD' ? 'USD' : 'PKR'
          })
          setBudget(
            typeof preferences.monthlyBudgetPkr === 'number'
              ? String(preferences.monthlyBudgetPkr)
              : ''
          )
        }
      } catch {
        showStatus('error', 'Failed to load settings.')
      } finally {
        setInitialLoading(false)
      }
    }

    void loadSettings()
  }, [])

  useEffect(() => {
    if (!initialLoading) {
      applyTheme(localSettings.display.theme)
    }
  }, [localSettings.display.theme, initialLoading])

  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }))
  }

  const updateDisplay = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => {
    setLocalSettings(prev => ({
      ...prev,
      display: { ...prev.display, [key]: value }
    }))
  }

  const updatePrivacy = (key: keyof PrivacySettings, value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value }
    }))
  }

  const validateBudgetValue = (value: string): number | null => {
    if (!value) return null
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 1000 || parsed > 100000) {
      return NaN
    }
    return parsed
  }

  const saveBudget = async () => {
    const budgetValue = validateBudgetValue(budget)
    if (budgetValue === null || Number.isNaN(budgetValue)) {
      showStatus('error', 'Budget must be a number between Rs 1,000 and Rs 100,000.')
      return
    }

    try {
      setSavingBudget(true)
      const response = await fetch('/api/budget/target', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_budget_pkr: budgetValue })
      })
      if (!response.ok) {
        throw new Error('Failed to save budget')
      }
      const payload = await response.json()
      setBudget(String(payload.monthly_budget_pkr))
      showStatus('success', 'Budget saved successfully.')
    } catch {
      showStatus('error', 'Failed to save budget.')
    } finally {
      setSavingBudget(false)
    }
  }

  const saveAllSettings = async () => {
    const parsedBudget = validateBudgetValue(budget)
    if (Number.isNaN(parsedBudget)) {
      showStatus('error', 'Budget must be a number between Rs 1,000 and Rs 100,000, or empty.')
      return
    }

    try {
      setSavingAll(true)
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(localSettings))

      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disco: serverSettings.disco,
          language: serverSettings.language,
          unitType: serverSettings.unitType,
          currency: serverSettings.currency,
          monthlyBudgetPkr: parsedBudget
        })
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload?.error || 'Failed to save settings')
      }

      const payload = await response.json()
      if (payload?.preferences) {
        setServerSettings({
          disco: payload.preferences.disco || DEFAULT_SERVER_SETTINGS.disco,
          language: payload.preferences.language === 'ur' ? 'ur' : 'en',
          unitType: 'kWh',
          currency: payload.preferences.currency === 'USD' ? 'USD' : 'PKR'
        })
        setBudget(
          typeof payload.preferences.monthlyBudgetPkr === 'number'
            ? String(payload.preferences.monthlyBudgetPkr)
            : ''
        )
      }

      showStatus('success', 'All settings saved.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings.'
      showStatus('error', message)
    } finally {
      setSavingAll(false)
    }
  }

  const resetLocalSettings = () => {
    setLocalSettings(DEFAULT_LOCAL_SETTINGS)
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(DEFAULT_LOCAL_SETTINGS))
    applyTheme(DEFAULT_LOCAL_SETTINGS.display.theme)
    showStatus('success', 'Local display/notification/privacy settings reset.')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px] animate-float" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-primary/15 blur-[130px] animate-float" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>
      <Navbar />
      <div className="relative flex">
        <Sidebar />

        <main className="flex-1 px-4 pb-10 pt-6 md:px-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a1323]/95 via-[#0f1a2d]/95 to-[#081220]/95 p-6 shadow-premium md:p-8 animate-fade-in">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-[120px]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-foreground-tertiary">System</p>
                  <h1 className="font-sora text-3xl font-bold leading-tight text-foreground md:text-4xl">Settings</h1>
                  <p className="max-w-2xl text-sm text-foreground-secondary md:text-base">
                    Manage billing, DISCO preferences, privacy controls, and workspace display behavior.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground-secondary">
                      DISCO: {serverSettings.disco}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground-secondary">
                      Currency: {serverSettings.currency}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground-secondary">
                      Theme: {localSettings.display.theme}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={resetLocalSettings} disabled={savingAll || initialLoading}>
                    <Zap className="h-4 w-4" />
                    Reset Local
                  </Button>
                  <Button onClick={saveAllSettings} disabled={savingAll || initialLoading}>
                    <Save className="h-4 w-4" />
                    {savingAll ? 'Saving...' : 'Save All'}
                  </Button>
                </div>
              </div>
            </section>

            <Card className="border border-white/10 bg-[#0f1727]/75 backdrop-blur-xl">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Budget Management</h2>
                    <p className="text-foreground-secondary">Set your monthly electricity bill target</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        label="Monthly Budget (PKR)"
                        type="number"
                        placeholder="e.g., 25000"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        min="1000"
                        max="100000"
                      />
                      <DollarSign className="absolute right-4 top-12 h-5 w-5 text-foreground-tertiary pointer-events-none" />
                    </div>

                    <Button onClick={saveBudget} disabled={savingBudget || initialLoading} className="w-full">
                      <Save className="h-5 w-5 mr-2" />
                      {savingBudget ? 'Saving...' : 'Save Budget'}
                    </Button>
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
                    <div className="space-y-3 text-sm text-foreground-secondary">
                      <p>Set a realistic target based on your usage history.</p>
                      <p>Include seasonal usage changes (e.g., summer AC).</p>
                      <p>For demo/testing, you can clear budget and use dynamic forecast only.</p>
                      {budget && !Number.isNaN(Number(budget)) && Number(budget) > 0 && (
                        <div className="pt-3 border-t border-border/30 space-y-2">
                          <div className="flex justify-between">
                            <span>Daily Budget:</span>
                            <span className="font-semibold">Rs {Math.round(Number(budget) / 30)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Weekly Budget:</span>
                            <span className="font-semibold">Rs {Math.round(Number(budget) / 4.3)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border border-white/10 bg-[#0f1727]/75 backdrop-blur-xl">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-blue to-primary p-2 rounded-xl">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Regional & Tariff</h2>
                    <p className="text-foreground-secondary">
                      Choose DISCO/operator and billing preferences
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary">Electricity Operator (DISCO)</label>
                    <select
                      value={serverSettings.disco}
                      onChange={(e) =>
                        setServerSettings(prev => ({
                          ...prev,
                          disco: e.target.value as DistributionOperator
                        }))
                      }
                      className="input-field w-full"
                    >
                      {DISCO_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.approxRange}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary">Language</label>
                    <select
                      value={serverSettings.language}
                      onChange={(e) =>
                        setServerSettings(prev => ({
                          ...prev,
                          language: e.target.value === 'ur' ? 'ur' : 'en'
                        }))
                      }
                      className="input-field w-full"
                    >
                      <option value="en">English</option>
                      <option value="ur">Urdu</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary">Currency</label>
                    <select
                      value={serverSettings.currency}
                      onChange={(e) =>
                        setServerSettings(prev => ({
                          ...prev,
                          currency: e.target.value === 'USD' ? 'USD' : 'PKR'
                        }))
                      }
                      className="input-field w-full"
                    >
                      <option value="PKR">Pakistani Rupee (PKR)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary">Usage Unit</label>
                    <select
                      value={serverSettings.unitType}
                      onChange={(e) =>
                        setServerSettings(prev => ({
                          ...prev,
                          unitType: e.target.value === 'kWh' ? 'kWh' : 'kWh'
                        }))
                      }
                      className="input-field w-full"
                    >
                      <option value="kWh">kWh</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border border-white/10 bg-[#0f1727]/75 backdrop-blur-xl">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-2 rounded-xl">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Notifications</h2>
                    <p className="text-foreground-secondary">Manage your alert preferences</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {(Object.keys(localSettings.notifications) as Array<keyof NotificationSettings>).map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.notifications[key]}
                          onChange={(e) => updateNotification(key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-background-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="border border-white/10 bg-[#0f1727]/75 backdrop-blur-xl">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
                    <Palette className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Display Preferences</h2>
                    <p className="text-foreground-secondary">Customize your app experience</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary">Theme</label>
                    <select
                      value={localSettings.display.theme}
                      onChange={(e) =>
                        updateDisplay(
                          'theme',
                          e.target.value === 'light'
                            ? 'light'
                            : e.target.value === 'auto'
                              ? 'auto'
                              : 'dark'
                        )
                      }
                      className="input-field w-full"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary">Date Format</label>
                    <select
                      value={localSettings.display.dateFormat}
                      onChange={(e) =>
                        updateDisplay(
                          'dateFormat',
                          e.target.value === 'MM/DD/YYYY'
                            ? 'MM/DD/YYYY'
                            : e.target.value === 'YYYY-MM-DD'
                              ? 'YYYY-MM-DD'
                              : 'DD/MM/YYYY'
                        )
                      }
                      className="input-field w-full"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border border-white/10 bg-[#0f1727]/75 backdrop-blur-xl">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-emerald to-primary p-2 rounded-xl">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Privacy & Data</h2>
                    <p className="text-foreground-secondary">Control how your data is used</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {(Object.keys(localSettings.privacy) as Array<keyof PrivacySettings>).map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.privacy[key]}
                          onChange={(e) => updatePrivacy(key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-background-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {status.type && (
              <div
                className={`rounded-2xl border p-3 ${
                  status.type === 'success'
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                    : 'border-red-500/25 bg-red-500/10 text-red-200'
                }`}
              >
                <p className="text-sm">{status.message}</p>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={resetLocalSettings} disabled={savingAll || initialLoading}>
                <Zap className="h-4 w-4" />
                Reset Local
              </Button>
              <Button onClick={saveAllSettings} disabled={savingAll || initialLoading}>
                <Save className="h-4 w-4" />
                {savingAll ? 'Saving...' : 'Save All Settings'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SettingsPage
