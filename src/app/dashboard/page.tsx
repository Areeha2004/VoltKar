'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  AlertTriangle,
  Activity,
  CalendarDays,
  Clock,
  DollarSign,
  Info,
  Plus,
  Target,
  TrendingUp,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import SetBudgetModal from '../../components/budget/SetBudgetModal'
import { StatsBundle } from '@/lib/statService'

type AlertAction = {
  label: string
  href: string
}

type AlertFeedItem = {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical' | string
  title: string
  message: string
  actions?: AlertAction[]
}

type KpiCard = {
  id: string
  title: string
  value: string
  helper: string
  icon: LucideIcon
  iconTone: string
  trend?: {
    value: number
    text: string
  }
}

const formatSignedPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

const getDeltaTone = (value: number) => {
  if (value > 0) return 'text-red-300 bg-red-500/10 border-red-500/20'
  if (value < 0) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
  return 'text-slate-300 bg-white/5 border-white/10'
}

const getBudgetStatusTone = (status: string) => {
  if (status === 'Over Budget') return 'text-red-300 bg-red-500/10 border-red-500/20'
  if (status === 'At Risk') return 'text-amber-300 bg-amber-500/10 border-amber-500/20'
  return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
}

const getSeverityTone = (severity: string) => {
  if (severity === 'critical' || severity === 'high') {
    return 'border-red-500/25 bg-red-500/10 text-red-100'
  }
  if (severity === 'medium') {
    return 'border-amber-500/25 bg-amber-500/10 text-amber-100'
  }
  return 'border-cyan-500/25 bg-cyan-500/10 text-cyan-100'
}

const Dashboard: React.FC = () => {
  const { data: session, status } = useSession()
  const name = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'User'

  const [stats, setStats] = useState<StatsBundle | null>(null)
  const [alertFeed, setAlertFeed] = useState<AlertFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showBudgetModal, setShowBudgetModal] = useState(false)

  const fetchStats = async () => {
    try {
      const [statsResponse, alertsResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/alerts/feed?limit=5'),
      ])

      if (!statsResponse.ok) {
        throw new Error('Failed to load dashboard stats')
      }

      const statsPayload = (await statsResponse.json()) as StatsBundle
      setStats(statsPayload)

      if (alertsResponse.ok) {
        const alertsPayload = (await alertsResponse.json()) as {
          data?: {
            alerts?: AlertFeedItem[]
          }
        }
        const incoming = alertsPayload?.data?.alerts
        setAlertFeed(Array.isArray(incoming) ? incoming : [])
      } else {
        setAlertFeed([])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      setStats(null)
      setAlertFeed([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    void fetchStats()
  }, [session?.user?.id, status])

  const handleBudgetSet = (_budget: number) => {
    void fetchStats()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex flex-1 items-center justify-center px-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
              <p className="text-sm text-foreground-secondary">Loading command center...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-lg rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
              <p className="text-lg font-semibold text-red-100">Unable to load dashboard data</p>
              <p className="mt-2 text-sm text-red-200/80">
                Please try refreshing, or check your internet/database connection.
              </p>
              <Button className="mt-6" onClick={() => void fetchStats()}>
                Retry
              </Button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const { mtd, forecast, budget, window: timeWindow } = stats
  const monthlyBudget = budget?.monthly_budget_pkr ?? budget?.monthly_pkr ?? null
  const hasBudget = typeof monthlyBudget === 'number' && monthlyBudget > 0
  const isMonthEnd = timeWindow.daysElapsed === timeWindow.daysInMonth
  const progressPercent = (timeWindow.daysElapsed / timeWindow.daysInMonth) * 100
  const avgDailyUsage = timeWindow.daysElapsed > 0 ? mtd.usage_kwh / timeWindow.daysElapsed : 0
  const avgDailyCost = timeWindow.daysElapsed > 0 ? mtd.cost_pkr / timeWindow.daysElapsed : 0
  const forecastOverBudget = hasBudget && forecast.cost_pkr > monthlyBudget
  const forecastAtRisk = hasBudget && !forecastOverBudget && forecast.cost_pkr > monthlyBudget * 0.9
  const forecastBudgetDelta = hasBudget ? forecast.cost_pkr - monthlyBudget : 0

  const mtdVsPrev = mtd.vs_prev_same_period
  const forecastVsPrev = forecast.vs_prev_full
  const prevSamePeriodUsage = Math.max(0, mtd.usage_kwh - mtdVsPrev.delta_kwh)
  const prevSamePeriodCost = Math.max(0, mtd.cost_pkr - mtdVsPrev.delta_cost)
  const prevFullUsage = Math.max(0, forecast.usage_kwh - forecastVsPrev.delta_kwh)
  const prevFullCost = Math.max(0, forecast.cost_pkr - forecastVsPrev.delta_cost)

  const mtdBudgetUsedPercent = hasBudget ? Math.min(100, (mtd.cost_pkr / monthlyBudget) * 100) : 0
  const forecastBudgetUsedPercent = hasBudget ? Math.min(100, (forecast.cost_pkr / monthlyBudget) * 100) : 0

  const kpiCards: KpiCard[] = [
    {
      id: 'usage',
      title: 'Usage MTD',
      value: `${mtd.usage_kwh.toLocaleString()} kWh`,
      helper: 'Current month consumption',
      icon: Zap,
      iconTone: 'from-cyan-500/25 to-blue-500/5 text-cyan-300',
      trend: {
        value: mtdVsPrev.pct_kwh,
        text: `vs previous same period (${formatSignedPercent(mtdVsPrev.pct_kwh)})`,
      },
    },
    {
      id: 'cost',
      title: 'Cost MTD',
      value: `Rs ${mtd.cost_pkr.toLocaleString()}`,
      helper: 'Amount billed so far',
      icon: DollarSign,
      iconTone: 'from-emerald-500/25 to-emerald-500/5 text-emerald-300',
      trend: {
        value: mtdVsPrev.pct_cost,
        text: `vs previous same period (${formatSignedPercent(mtdVsPrev.pct_cost)})`,
      },
    },
    {
      id: 'forecast',
      title: isMonthEnd ? 'Actual Bill' : 'Forecast',
      value: `Rs ${forecast.cost_pkr.toLocaleString()}`,
      helper: isMonthEnd ? 'Finalized month total' : 'Projected month-end bill',
      icon: isMonthEnd ? CalendarDays : TrendingUp,
      iconTone: 'from-blue-500/25 to-cyan-500/5 text-blue-200',
      trend: {
        value: forecastVsPrev.pct_cost,
        text: `vs last month full (${formatSignedPercent(forecastVsPrev.pct_cost)})`,
      },
    },
    {
      id: 'budget',
      title: 'Budget Status',
      value: hasBudget ? budget.status : 'Not Set',
      helper: hasBudget ? `Budget: Rs ${monthlyBudget.toLocaleString()}` : 'Set a monthly budget for alerts',
      icon: Wallet,
      iconTone: 'from-primary/25 to-cyan-500/5 text-primary-200',
    },
  ]

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
              <div className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-foreground-tertiary">Dashboard</p>
                  <h1 className="font-sora text-3xl font-bold leading-tight text-foreground md:text-4xl">
                    Command Center,{' '}
                    <span className="bg-gradient-to-r from-cyan-200 via-primary-200 to-blue-200 bg-clip-text text-transparent">
                      {name}
                    </span>
                  </h1>
                  <p className="max-w-2xl text-sm text-foreground-secondary md:text-base">
                    {isMonthEnd
                      ? 'Month closed. Review your finalized performance and prepare next cycle targets.'
                      : 'Live month tracking with forecast signals, budget pressure, and anomaly alerts.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground-secondary">
                      {stats.timeframeLabels.mtd}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground-secondary">
                      Last Month: {stats.prevMonthFull.usage_kwh.toLocaleString()} kWh - Rs{' '}
                      {stats.prevMonthFull.cost_pkr.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowBudgetModal(true)}
                    className="border-white/15 bg-white/[0.03] text-foreground hover:bg-white/[0.08]"
                  >
                    <Wallet className="h-4 w-4" />
                    {hasBudget ? `Budget Rs ${monthlyBudget.toLocaleString()}` : 'Set Budget'}
                  </Button>
                  <Link
                    href="/readings"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400/90 via-primary to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_40px_rgba(0,212,170,0.35)] transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <Plus className="h-4 w-4" />
                    Enter Reading
                  </Link>
                </div>
              </div>

              <div className="relative mt-6">
                <div className="mb-2 flex items-center justify-between text-xs text-foreground-secondary">
                  <span>
                    Billing cycle progress: {timeWindow.daysElapsed}/{timeWindow.daysInMonth} days
                  </span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-primary to-blue-300 transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-foreground-tertiary">
                  Pace: {avgDailyUsage.toFixed(2)} kWh/day - Rs {avgDailyCost.toFixed(2)}/day
                </p>
              </div>
            </section>

            {(forecastOverBudget || forecastAtRisk) && (
              <section className="rounded-3xl border border-red-500/25 bg-red-500/10 p-5 md:p-6 animate-slide-up">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-red-400/30 bg-red-500/15 p-2.5">
                      <AlertTriangle className="h-5 w-5 text-red-200" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-red-100">
                        {forecastOverBudget ? 'Projected to exceed budget' : 'Budget risk is increasing'}
                      </p>
                      <p className="text-sm text-red-100/90">
                        {forecastOverBudget
                          ? `Forecast is Rs ${forecast.cost_pkr.toLocaleString()}, which is Rs ${forecastBudgetDelta.toLocaleString()} above budget.`
                          : `Forecast is close to the budget threshold at Rs ${forecast.cost_pkr.toLocaleString()}.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/optimization"
                      className="rounded-xl border border-red-300/35 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-500/20"
                    >
                      Open Optimization
                    </Link>
                    <Link
                      href="/analytics"
                      className="rounded-xl border border-red-300/35 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-500/20"
                    >
                      Open Analytics
                    </Link>
                  </div>
                </div>
              </section>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpiCards.map((item) => (
                <div key={item.id} className="animate-slide-up">
                  <Card className="h-full border border-white/10 bg-[#0f1727]/75 backdrop-blur-xl hover:-translate-y-1 hover:border-cyan-400/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-foreground-tertiary">{item.title}</p>
                        <p className="font-sora text-2xl font-semibold text-foreground">{item.value}</p>
                        <p className="text-xs text-foreground-secondary">{item.helper}</p>
                      </div>
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.iconTone} border border-white/10`}
                      >
                        <item.icon className="h-5 w-5" />
                      </span>
                    </div>
                    {item.trend && (
                      <div className="mt-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getDeltaTone(item.trend.value)}`}
                        >
                          {formatSignedPercent(item.trend.value)}
                        </span>
                        <p className="mt-2 text-xs text-foreground-tertiary">{item.trend.text}</p>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-[#0f1727]/75 p-6 backdrop-blur-xl md:p-7">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-sora text-xl font-semibold text-foreground">
                      <Target className="h-5 w-5 text-primary-200" />
                      Budget Pulse
                    </h2>
                    <p className="mt-1 text-sm text-foreground-secondary">
                      Track current and forecasted pressure against your monthly target.
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getBudgetStatusTone(budget.status)}`}>
                    {hasBudget ? budget.status : 'Not Set'}
                  </span>
                </div>

                {hasBudget ? (
                  <div className="space-y-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">Spent so far</span>
                        <span className="font-semibold text-foreground">
                          Rs {mtd.cost_pkr.toLocaleString()} / Rs {monthlyBudget.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-primary transition-all duration-1000"
                          style={{ width: `${mtdBudgetUsedPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">Forecast load</span>
                        <span className="font-semibold text-foreground">
                          Rs {forecast.cost_pkr.toLocaleString()} / Rs {monthlyBudget.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            forecastOverBudget
                              ? 'bg-gradient-to-r from-red-400 to-red-300'
                              : forecastAtRisk
                                ? 'bg-gradient-to-r from-amber-300 to-orange-300'
                                : 'bg-gradient-to-r from-emerald-300 to-primary'
                          }`}
                          style={{ width: `${forecastBudgetUsedPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-wide text-foreground-tertiary">Projected Overrun</p>
                        <p
                          className={`mt-1 text-xl font-semibold ${
                            budget.projected_overrun_pkr > 0 ? 'text-red-300' : 'text-emerald-300'
                          }`}
                        >
                          Rs {(budget.projected_overrun_pkr ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-wide text-foreground-tertiary">Remaining Budget</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          Rs {(budget.remaining_to_budget_pkr ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5">
                    <p className="text-sm text-foreground-secondary">
                      No budget set. Add a monthly target to unlock overrun detection and risk alerts.
                    </p>
                    <Button className="mt-4" onClick={() => setShowBudgetModal(true)}>
                      Set Monthly Budget
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0f1727]/75 p-6 backdrop-blur-xl md:p-7">
                <h2 className="flex items-center gap-2 font-sora text-xl font-semibold text-foreground">
                  <Activity className="h-5 w-5 text-cyan-300" />
                  Performance Signals
                </h2>
                <p className="mt-1 text-sm text-foreground-secondary">
                  Compare current behavior with baseline periods to catch drift quickly.
                </p>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-200">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {timeWindow.daysElapsed} days elapsed - {timeWindow.daysInMonth - timeWindow.daysElapsed} days remaining
                      </p>
                      <p className="text-xs text-foreground-tertiary">Current billing cycle pacing</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-wide text-foreground-tertiary">
                      {stats.timeframeLabels.mtd} vs Previous Month (Same Cutoff)
                    </p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-foreground-secondary">
                          Usage: {mtd.usage_kwh.toLocaleString()} kWh vs {prevSamePeriodUsage.toLocaleString()} kWh
                        </span>
                        <span className={mtdVsPrev.pct_kwh > 0 ? 'text-red-300' : 'text-emerald-300'}>
                          {formatSignedPercent(mtdVsPrev.pct_kwh)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-foreground-secondary">
                          Cost: Rs {mtd.cost_pkr.toLocaleString()} vs Rs {prevSamePeriodCost.toLocaleString()}
                        </span>
                        <span className={mtdVsPrev.pct_cost > 0 ? 'text-red-300' : 'text-emerald-300'}>
                          {formatSignedPercent(mtdVsPrev.pct_cost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-wide text-foreground-tertiary">
                      {stats.timeframeLabels.forecast} vs {stats.timeframeLabels.prevMonthFull}
                    </p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-foreground-secondary">
                          Usage: {forecast.usage_kwh.toLocaleString()} kWh vs {prevFullUsage.toLocaleString()} kWh
                        </span>
                        <span className={forecastVsPrev.pct_kwh > 0 ? 'text-red-300' : 'text-emerald-300'}>
                          {formatSignedPercent(forecastVsPrev.pct_kwh)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-foreground-secondary">
                          Cost: Rs {forecast.cost_pkr.toLocaleString()} vs Rs {prevFullCost.toLocaleString()}
                        </span>
                        <span className={forecastVsPrev.pct_cost > 0 ? 'text-red-300' : 'text-emerald-300'}>
                          {formatSignedPercent(forecastVsPrev.pct_cost)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs text-foreground-tertiary">
                      <Info className="h-3.5 w-3.5" />
                      Forecast method: {forecast.method}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0f1727]/75 p-6 backdrop-blur-xl md:p-7">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-sora text-xl font-semibold text-foreground">
                  <AlertTriangle className="h-5 w-5 text-amber-200" />
                  Active Alerts
                </h2>
                <Link
                  href="/analytics"
                  className="rounded-xl border border-white/15 px-3 py-2 text-sm text-foreground-secondary hover:bg-white/5 hover:text-foreground"
                >
                  Open Analytics
                </Link>
              </div>

              {alertFeed.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-sm text-foreground-secondary">
                  No active alerts right now. Your dashboard is stable.
                </div>
              ) : (
                <div className="space-y-3">
                  {alertFeed.slice(0, 4).map((alert) => (
                    <article key={alert.id} className={`rounded-2xl border p-4 ${getSeverityTone(alert.severity)}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{alert.title}</p>
                          <p className="text-sm">{alert.message}</p>
                        </div>
                        <span className="rounded-full border border-current/30 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                          {alert.severity}
                        </span>
                      </div>
                      {Array.isArray(alert.actions) && alert.actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {alert.actions.slice(0, 2).map((action, index) => (
                            <Link
                              key={`${alert.id}-action-${index}`}
                              href={action.href}
                              className="rounded-lg border border-current/30 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
                            >
                              {action.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <SetBudgetModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onBudgetSet={handleBudgetSet}
        currentBudget={monthlyBudget ?? undefined}
      />
    </div>
  )
}

export default Dashboard
