'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  History,
  Home,
  Plus,
  RefreshCw,
  Save,
  TrendingUp,
  Zap,
} from 'lucide-react'

import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { calculateUsage, getSlabWarningMessage, tariffEngine } from '../../lib/tariffEngine'

type Meter = {
  id: string
  label: string
  type: string
  lastReading: number
  lastReadingDate: string | null
  status: 'active' | 'inactive' | string
}

type ReadingItem = {
  id: string
  week: number
  reading: number
  usage: number
  estimatedCost: number
  isOfficialEndOfMonth: boolean
  notes?: string | null
  date: string
  createdAt: string
  meter: {
    id: string
    label: string
    type: string
  }
}

const ReadingEntryPage: React.FC = () => {
  const { data: session } = useSession()

  const [selectedMeter, setSelectedMeter] = useState('')
  const [week, setWeek] = useState(Math.ceil(new Date().getDate() / 7))
  const [reading, setReading] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isOfficialEndOfMonth, setIsOfficialEndOfMonth] = useState(false)

  const [meters, setMeters] = useState<Meter[]>([])
  const [recentReadings, setRecentReadings] = useState<ReadingItem[]>([])
  const [mtdUsageKwh, setMtdUsageKwh] = useState(0)
  const [mtdDaysElapsed, setMtdDaysElapsed] = useState(new Date().getDate())

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchPageData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const [metersResponse, readingsResponse, statsResponse] = await Promise.all([
        fetch('/api/meters'),
        fetch('/api/readings?limit=10'),
        fetch('/api/dashboard/stats'),
      ])

      if (!metersResponse.ok) throw new Error('Failed to fetch meters')
      if (!readingsResponse.ok) throw new Error('Failed to fetch readings')

      const metersData = await metersResponse.json()
      const readingsData = await readingsResponse.json()
      const statsData = statsResponse.ok ? await statsResponse.json() : null

      const nextMeters = (metersData?.meters || []) as Meter[]
      const nextReadings = (readingsData?.readings || []) as ReadingItem[]

      setMeters(nextMeters)
      setRecentReadings(nextReadings)
      setMtdUsageKwh(Number(statsData?.mtd?.usage_kwh || 0))
      setMtdDaysElapsed(Number(statsData?.window?.daysElapsed || new Date().getDate()))

      setSelectedMeter((prev) => {
        if (prev && nextMeters.some((meter) => meter.id === prev)) return prev
        return nextMeters[0]?.id || ''
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load reading data'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }
    void fetchPageData()
  }, [session?.user?.id])

  const selectedMeterData = meters.find((meter) => meter.id === selectedMeter)
  const parsedReading = Number(reading)
  const usageDelta =
    selectedMeterData && Number.isFinite(parsedReading)
      ? calculateUsage(parsedReading, Number(selectedMeterData.lastReading || 0))
      : 0
  const previewCost = usageDelta > 0 ? tariffEngine(usageDelta) : null
  const slabWarning = usageDelta > 0 ? getSlabWarningMessage(usageDelta) : null

  const avgDailyUsage = useMemo(
    () => (mtdDaysElapsed > 0 ? mtdUsageKwh / mtdDaysElapsed : 0),
    [mtdUsageKwh, mtdDaysElapsed]
  )

  const handleDateChange = (value: string) => {
    setDate(value)
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      setWeek(Math.ceil(parsed.getDate() / 7))
    }
  }

  const clearForm = () => {
    setReading('')
    setNotes('')
    setIsOfficialEndOfMonth(false)
    const today = new Date()
    setDate(today.toISOString().split('T')[0])
    setWeek(Math.ceil(today.getDate() / 7))
  }

  const submitReading = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    setSuccessMessage(null)

    if (!selectedMeter || !reading || !date) {
      setSubmitError('Please fill in meter, date, and reading.')
      return
    }

    const numericReading = Number(reading)
    if (!Number.isFinite(numericReading) || numericReading < 0) {
      setSubmitError('Reading must be a valid non-negative number.')
      return
    }

    if (selectedMeterData && numericReading < Number(selectedMeterData.lastReading || 0)) {
      setSubmitError('Current reading cannot be lower than the previous meter reading.')
      return
    }

    try {
      setSubmitting(true)

      const readingDate = new Date(date)
      const month = readingDate.getMonth() + 1
      const year = readingDate.getFullYear()

      const response = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterId: selectedMeter,
          reading: numericReading,
          week,
          month,
          year,
          date: readingDate.toISOString(),
          isOfficialEndOfMonth,
          notes: notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Failed to submit reading')
      }

      const payload = await response.json()
      const newReading = payload?.reading as ReadingItem

      if (newReading) {
        setRecentReadings((prev) => [newReading, ...prev].slice(0, 10))
      }

      clearForm()
      setSuccessMessage('Reading submitted successfully.')
      await fetchPageData(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit reading'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
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
              <p className="text-sm text-foreground-secondary">Loading readings workspace...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-500/15 blur-[110px]" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-primary/12 blur-[130px]" />
      </div>

      <Navbar />

      <div className="relative flex">
        <Sidebar />

        <main className="flex-1 px-4 pb-10 pt-6 md:px-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a1323]/95 via-[#0f1a2d]/95 to-[#081220]/95 p-6 shadow-premium md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-foreground-tertiary">Readings</p>
                  <h1 className="font-sora text-3xl font-bold md:text-4xl">Meter Reading Entry</h1>
                  <p className="max-w-2xl text-sm text-foreground-secondary md:text-base">
                    Submit accurate cumulative meter values and keep your billing chain reliable.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void fetchPageData(true)}
                    disabled={refreshing}
                    className="border-white/15 bg-white/[0.03] text-foreground"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Link
                    href="/meters"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-white/[0.08]"
                  >
                    <Home className="h-4 w-4" />
                    Manage Meters
                  </Link>
                </div>
              </div>
            </section>

            {error && (
              <section className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-red-100">
                <p className="text-sm">{error}</p>
              </section>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: 'Total Meters',
                  value: meters.length.toString(),
                  helper: 'Active connections',
                  icon: Home,
                },
                {
                  title: 'Usage MTD',
                  value: `${Math.round(mtdUsageKwh).toLocaleString()} kWh`,
                  helper: 'Current billing cycle',
                  icon: Zap,
                },
                {
                  title: 'Avg Daily',
                  value: `${avgDailyUsage.toFixed(2)} kWh`,
                  helper: `${mtdDaysElapsed} days elapsed`,
                  icon: TrendingUp,
                },
                {
                  title: 'Last Reading',
                  value:
                    recentReadings.length > 0
                      ? `${Math.max(0, Math.ceil((Date.now() - new Date(recentReadings[0].date).getTime()) / (1000 * 60 * 60 * 24)))} days`
                      : 'None',
                  helper: recentReadings[0]?.meter?.label || 'No records yet',
                  icon: Clock,
                },
              ].map((item) => (
                <Card key={item.title} className="border border-white/10 bg-[#0f1727]/75">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-foreground-tertiary">{item.title}</p>
                      <p className="mt-2 font-sora text-2xl font-semibold">{item.value}</p>
                      <p className="mt-2 text-xs text-foreground-secondary">{item.helper}</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <item.icon className="h-5 w-5 text-cyan-200" />
                    </span>
                  </div>
                </Card>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="border border-white/10 bg-[#0f1727]/75">
                  <form onSubmit={submitReading} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-sora text-xl font-semibold">New Reading</h2>
                        <p className="text-sm text-foreground-secondary">Enter cumulative meter value for selected date.</p>
                      </div>
                      <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-foreground-secondary">
                        Week {week}
                      </span>
                    </div>

                    {meters.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {meters.map((meter) => {
                          const isSelected = meter.id === selectedMeter
                          return (
                            <button
                              key={meter.id}
                              type="button"
                              onClick={() => setSelectedMeter(meter.id)}
                              className={`rounded-2xl border p-4 text-left transition ${
                                isSelected
                                  ? 'border-cyan-400/35 bg-cyan-500/10'
                                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                              }`}
                            >
                              <p className="text-sm font-semibold text-foreground">{meter.label}</p>
                              <p className="text-xs text-foreground-tertiary">{meter.type || 'Meter'}</p>
                              <p className="mt-2 text-xs text-foreground-secondary">
                                Last reading: {Number(meter.lastReading || 0).toLocaleString()}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-sm text-foreground-secondary">
                        No meters found. Add one first from the meters page.
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                      <Input
                        type="date"
                        label="Reading Date"
                        value={date}
                        onChange={(event) => handleDateChange(event.target.value)}
                        required
                      />

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground-secondary">Week of Month</label>
                        <select
                          value={week}
                          onChange={(event) => setWeek(Number(event.target.value))}
                          className="input-field w-full"
                        >
                          {[1, 2, 3, 4, 5].map((value) => (
                            <option key={`week-${value}`} value={value}>
                              Week {value}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Input
                        type="number"
                        label="Reading (Cumulative kWh)"
                        placeholder="Enter meter value"
                        value={reading}
                        onChange={(event) => setReading(event.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <input
                        id="official-end-month"
                        type="checkbox"
                        checked={isOfficialEndOfMonth}
                        onChange={(event) => setIsOfficialEndOfMonth(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-background"
                      />
                      <div>
                        <label htmlFor="official-end-month" className="text-sm font-semibold text-foreground">
                          Official End-of-Month Reading
                        </label>
                        <p className="text-xs text-foreground-secondary">
                          Enable when this reading is your official monthly close reading.
                        </p>
                      </div>
                    </div>

                    {reading && selectedMeterData && usageDelta > 0 && previewCost && (
                      <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-100">
                          <Zap className="h-4 w-4" />
                          Preview
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
                            <p className="text-foreground-tertiary">Usage Delta</p>
                            <p className="mt-1 text-lg font-semibold text-foreground">{usageDelta.toFixed(2)} kWh</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
                            <p className="text-foreground-tertiary">Estimated Cost</p>
                            <p className="mt-1 text-lg font-semibold text-emerald-300">
                              Rs {Math.round(previewCost.totalCost).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {slabWarning && (
                          <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-100">
                            {slabWarning}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground-secondary">Notes (optional)</label>
                      <textarea
                        rows={4}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Optional context about this reading"
                        className="input-field w-full resize-none"
                      />
                    </div>

                    {submitError && (
                      <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-100">
                        {submitError}
                      </div>
                    )}

                    {successMessage && (
                      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                        {successMessage}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={submitting || !selectedMeter || meters.length === 0}
                      className="w-full"
                    >
                      <Save className="h-4 w-4" />
                      {submitting
                        ? 'Saving...'
                        : `Save ${isOfficialEndOfMonth ? 'Official' : 'Reading'} Entry`}
                    </Button>
                  </form>
                </Card>
              </div>

              <Card className="border border-white/10 bg-[#0f1727]/75">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-sora text-xl font-semibold">Recent Entries</h2>
                    <p className="text-xs text-foreground-secondary">Latest 10 readings</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => void fetchPageData(true)} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="space-y-3">
                  {recentReadings.length > 0 ? (
                    recentReadings.map((entry) => (
                      <article key={entry.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{entry.meter?.label || 'Meter'}</p>
                            <p className="text-xs text-foreground-tertiary">
                              {new Date(entry.date || entry.createdAt).toLocaleDateString()} | Week {entry.week || 1}
                            </p>
                          </div>
                          {entry.isOfficialEndOfMonth && (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
                              Official
                            </span>
                          )}
                        </div>

                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-foreground-tertiary">Reading</p>
                            <p className="font-semibold text-foreground">{Number(entry.reading || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-foreground-tertiary">Usage</p>
                            <p className="font-semibold text-foreground">{Number(entry.usage || 0).toFixed(2)} kWh</p>
                          </div>
                          <div>
                            <p className="text-foreground-tertiary">Cost</p>
                            <p className="font-semibold text-emerald-300">Rs {Math.round(Number(entry.estimatedCost || 0)).toLocaleString()}</p>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm text-foreground-secondary">
                      No readings yet. Submit your first entry.
                    </div>
                  )}
                </div>

                <Link
                  href="/analytics"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-foreground-secondary hover:bg-white/5 hover:text-foreground"
                >
                  <History className="h-4 w-4" />
                  Open Analytics
                </Link>
              </Card>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0f1727]/75 p-6">
              <h2 className="mb-4 font-sora text-lg font-semibold">Reading Rules</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: 'Use cumulative value',
                    description: 'Enter the total meter number shown, not weekly or monthly consumption.',
                    icon: Plus,
                  },
                  {
                    title: 'Keep interval consistent',
                    description: 'Use similar reading intervals to improve forecast and anomaly detection quality.',
                    icon: Calendar,
                  },
                  {
                    title: 'Validate before submit',
                    description: 'Check meter, date, and value to avoid chain recalculation conflicts.',
                    icon: CheckCircle,
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <item.icon className="h-5 w-5 text-cyan-200" />
                    <p className="mt-2 text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-foreground-secondary">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ReadingEntryPage
