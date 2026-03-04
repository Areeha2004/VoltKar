'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Brain,
  Calculator,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit,
  Lightbulb,
  Plus,
  RefreshCw,
  Settings,
  Target,
  Trash2,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Appliance, useAppliances } from '../../hooks/useAppliances'
import { useApplianceCategories } from '../../hooks/useApplianceCategories'
import { calculateApplianceCost } from '../../lib/applianceCalculations'

const CHART_COLORS = ['#00d4aa', '#38bdf8', '#22d3ee', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6']

type ApplianceFormState = {
  name: string
  category: string
  type: string
  wattage: string
  hoursPerDay: string
  daysPerMonth: string
}

const defaultForm: ApplianceFormState = {
  name: '',
  category: '',
  type: 'Non-Inverter',
  wattage: '',
  hoursPerDay: '',
  daysPerMonth: '30',
}

const efficiencyTone = (efficiency: string) => {
  if (efficiency === 'excellent') return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25'
  if (efficiency === 'good') return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25'
  if (efficiency === 'fair') return 'text-amber-300 bg-amber-500/10 border-amber-500/25'
  return 'text-red-300 bg-red-500/10 border-red-500/25'
}

const categoryBadge = (category: string) =>
  category
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AP'

const DevicesPage: React.FC = () => {
  const { appliances, summary, loading, error, createAppliance, updateAppliance, deleteAppliance, refetch } =
    useAppliances(true)
  const { metadata, getWattageGuide, getUsageGuide, getTypicalValues } = useApplianceCategories()

  const [showForm, setShowForm] = useState(false)
  const [editingDevice, setEditingDevice] = useState<string | null>(null)
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ApplianceFormState>(defaultForm)

  useEffect(() => {
    if (!formData.category || !metadata) return
    const typical = getTypicalValues(formData.category)
    const defaultWattage = typical.wattage > 0 ? String(typical.wattage) : ''
    const defaultHours = typical.hoursPerDay > 0 ? String(typical.hoursPerDay) : ''

    setFormData((prev) => {
      const nextWattage = prev.wattage || defaultWattage
      const nextHours = prev.hoursPerDay || defaultHours
      if (nextWattage === prev.wattage && nextHours === prev.hoursPerDay) return prev
      return { ...prev, wattage: nextWattage, hoursPerDay: nextHours }
    })
  }, [formData.category, metadata, getTypicalValues])

  const preview = useMemo(() => {
    const wattage = Number(formData.wattage || 0)
    const hours = Number(formData.hoursPerDay || 0)
    const days = Number(formData.daysPerMonth || 0)
    if (
      !Number.isFinite(wattage) ||
      !Number.isFinite(hours) ||
      !Number.isFinite(days) ||
      wattage <= 0 ||
      hours <= 0 ||
      days <= 0
    ) {
      return { kwh: 0, cost: 0 }
    }

    let estimatedKwh = (wattage * hours * days) / 1000
    if (formData.type === 'Inverter') estimatedKwh *= 0.7

    return {
      kwh: Math.round(estimatedKwh * 100) / 100,
      cost: Math.round(calculateApplianceCost(estimatedKwh)),
    }
  }, [formData])

  const forecastLabel = summary?.meter?.timeframeLabels?.forecast || 'Forecast'
  const meterSummary = summary?.meter
  const consistency = summary?.consistency
  const categoryOptions = metadata?.categories || []
  const typeOptions = metadata?.types?.length ? metadata.types : ['Non-Inverter', 'Inverter']

  const chartData = useMemo(
    () =>
      appliances
        .map((appliance) => ({
          name: appliance.name,
          usageShare: Number(appliance.usageSharePct ?? appliance.contribution ?? 0),
          billShare: Number(appliance.billSharePct ?? appliance.contribution ?? 0),
          attributedCost: Number(appliance.attributedCostForecastPkr ?? 0),
          attributedKwh: Number(appliance.attributedUsageForecastKwh ?? 0),
        }))
        .filter((item) => item.usageShare > 0 || item.attributedCost > 0),
    [appliances]
  )

  const resetForm = () => {
    setFormData(defaultForm)
    setFormError(null)
  }

  const openAddForm = () => {
    resetForm()
    setEditingDevice(null)
    setShowForm(true)
  }

  const openEditForm = (appliance: Appliance) => {
    setFormData({
      name: appliance.name || '',
      category: appliance.category || '',
      type: appliance.type || 'Non-Inverter',
      wattage: String(appliance.wattage || ''),
      hoursPerDay: String(appliance.hoursPerDay || ''),
      daysPerMonth: String(appliance.daysPerMonth || '30'),
    })
    setEditingDevice(appliance.id)
    setShowForm(true)
    setFormError(null)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingDevice(null)
    resetForm()
  }

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!formData.name.trim() || !formData.category || !formData.wattage || !formData.hoursPerDay) {
      setFormError('Please fill in all required fields.')
      return
    }

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      type: formData.type,
      wattage: Number(formData.wattage),
      hoursPerDay: Number(formData.hoursPerDay),
      daysPerMonth: Number(formData.daysPerMonth || 30),
    }

    if (
      !Number.isFinite(payload.wattage) ||
      !Number.isFinite(payload.hoursPerDay) ||
      !Number.isFinite(payload.daysPerMonth) ||
      payload.wattage <= 0 ||
      payload.hoursPerDay <= 0 ||
      payload.daysPerMonth <= 0
    ) {
      setFormError('Wattage, hours/day, and days/month must be valid positive numbers.')
      return
    }

    try {
      setSubmitting(true)
      if (editingDevice) {
        await updateAppliance(editingDevice, payload)
      } else {
        await createAppliance(payload)
      }
      closeForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save appliance')
    } finally {
      setSubmitting(false)
    }
  }

  const removeAppliance = async (applianceId: string, applianceName: string) => {
    const confirmed = window.confirm(`Delete appliance "${applianceName}"?`)
    if (!confirmed) return

    try {
      await deleteAppliance(applianceId)
    } catch {
      window.alert('Failed to delete appliance.')
    }
  }

  const refreshPage = async () => {
    try {
      setRefreshing(true)
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  const sortedAppliances = useMemo(
    () => [...appliances].sort((a, b) => Number(b.estimatedCost || 0) - Number(a.estimatedCost || 0)),
    [appliances]
  )

  const totalKwh = Number(
    summary?.totalKwh || appliances.reduce((acc, item) => acc + Number(item.estimatedKwh || 0), 0)
  )
  const totalCost = Number(
    summary?.totalCost || appliances.reduce((acc, item) => acc + Number(item.estimatedCost || 0), 0)
  )
  const averageEfficiencyRaw = Number(summary?.averageEfficiency || 0)
  const averageEfficiency =
    averageEfficiencyRaw > 0 ? (averageEfficiencyRaw <= 1 ? averageEfficiencyRaw * 100 : averageEfficiencyRaw) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex flex-1 items-center justify-center px-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
              <p className="text-sm text-foreground-secondary">Loading device workspace...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-primary/15 blur-[130px]" />
      </div>

      <Navbar />

      <div className="relative flex">
        <Sidebar />

        <main className="flex-1 px-4 pb-10 pt-6 md:px-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a1323]/95 via-[#0f1a2d]/95 to-[#081220]/95 p-6 shadow-premium md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-foreground-tertiary">Devices</p>
                  <h1 className="font-sora text-3xl font-bold md:text-4xl">Appliance Intelligence Hub</h1>
                  <p className="max-w-2xl text-sm text-foreground-secondary md:text-base">
                    Build a clean device profile, estimate monthly consumption, and track what drives your bill.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void refreshPage()}
                    disabled={refreshing}
                    className="border-white/15 bg-white/[0.03] text-foreground"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Button onClick={openAddForm}>
                    <Plus className="h-4 w-4" />
                    Add Device
                  </Button>
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
                  title: 'Total Devices',
                  value: String(summary?.totalAppliances || appliances.length),
                  helper: 'Tracked appliances',
                  icon: Activity,
                },
                {
                  title: 'Estimated Usage',
                  value: `${totalKwh.toFixed(1)} kWh`,
                  helper: 'Monthly projection',
                  icon: Zap,
                },
                {
                  title: 'Estimated Cost',
                  value: `Rs ${Math.round(totalCost).toLocaleString()}`,
                  helper: forecastLabel,
                  icon: DollarSign,
                },
                {
                  title: 'Efficiency Index',
                  value: averageEfficiency > 0 ? `${averageEfficiency.toFixed(0)}%` : 'N/A',
                  helper: 'Portfolio average',
                  icon: Target,
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

            {(meterSummary || consistency) && (
              <section className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/80">Meter MTD</p>
                    <p className="mt-1 text-lg font-semibold text-cyan-50">
                      {Math.round(Number(meterSummary?.mtdUsageKwh || 0)).toLocaleString()} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/80">{forecastLabel}</p>
                    <p className="mt-1 text-lg font-semibold text-cyan-50">
                      Rs {Math.round(Number(meterSummary?.forecastCostPkr || 0)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/80">Model Delta</p>
                    <p className="mt-1 text-lg font-semibold text-cyan-50">
                      {Number(consistency?.forecastDeltaPct || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <Card className="border border-white/10 bg-[#0f1727]/75">
                  {showForm ? (
                    <form onSubmit={submitForm} className="space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="font-sora text-xl font-semibold">
                            {editingDevice ? 'Edit Appliance' : 'Add Appliance'}
                          </h2>
                          <p className="text-sm text-foreground-secondary">
                            Enter realistic usage values for better optimization outputs.
                          </p>
                        </div>
                        <Button type="button" variant="outline" onClick={closeForm}>
                          Cancel
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          label="Appliance Name"
                          value={formData.name}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, name: event.target.value }))
                          }
                          placeholder="e.g. Bedroom AC"
                          required
                        />
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-foreground-secondary">Category</label>
                          <select
                            value={formData.category}
                            onChange={(event) =>
                              setFormData((prev) => ({ ...prev, category: event.target.value }))
                            }
                            className="input-field w-full"
                            required
                          >
                            <option value="">Select category</option>
                            {categoryOptions.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-foreground-secondary">Type</label>
                          <select
                            value={formData.type}
                            onChange={(event) =>
                              setFormData((prev) => ({ ...prev, type: event.target.value }))
                            }
                            className="input-field w-full"
                            required
                          >
                            {typeOptions.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input
                          type="number"
                          label="Wattage"
                          value={formData.wattage}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, wattage: event.target.value }))
                          }
                          min="1"
                          step="1"
                          placeholder="1200"
                          required
                        />
                        <Input
                          type="number"
                          label="Hours / Day"
                          value={formData.hoursPerDay}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, hoursPerDay: event.target.value }))
                          }
                          min="0.1"
                          step="0.1"
                          placeholder="8"
                          required
                        />
                        <Input
                          type="number"
                          label="Days / Month"
                          value={formData.daysPerMonth}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, daysPerMonth: event.target.value }))
                          }
                          min="1"
                          step="1"
                          placeholder="30"
                          required
                        />
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Calculator className="h-4 w-4 text-cyan-200" />
                            Live Preview
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="text-xs text-foreground-tertiary">Estimated Usage</p>
                              <p className="mt-1 text-lg font-semibold text-foreground">
                                {preview.kwh.toFixed(2)} kWh
                              </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="text-xs text-foreground-tertiary">Estimated Cost</p>
                              <p className="mt-1 text-lg font-semibold text-emerald-300">
                                Rs {preview.cost.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Settings className="h-4 w-4 text-cyan-200" />
                            Category Guide
                          </div>
                          {formData.category ? (
                            <div className="space-y-2 text-sm">
                              <p className="text-foreground-secondary">
                                Wattage:{' '}
                                <span className="text-foreground">
                                  {getWattageGuide(formData.category)?.min ?? 0}-
                                  {getWattageGuide(formData.category)?.max ?? 0}W
                                </span>
                              </p>
                              <p className="text-foreground-secondary">
                                Usage:{' '}
                                <span className="text-foreground">
                                  {getUsageGuide(formData.category)?.min ?? 0}-
                                  {getUsageGuide(formData.category)?.max ?? 0} hrs/day
                                </span>
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-foreground-secondary">
                              Select a category to view recommended usage ranges.
                            </p>
                          )}
                        </div>
                      </div>

                      {formError && (
                        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-100">
                          {formError}
                        </div>
                      )}

                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : editingDevice ? 'Update Device' : 'Save Device'}
                      </Button>
                    </form>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-foreground-secondary">
                      <p className="text-foreground">
                        Device editor is hidden to keep the interface clean.
                      </p>
                      <p className="mt-1">Use Add Device to register a new appliance or edit an existing one.</p>
                    </div>
                  )}
                </Card>
              </div>

              <Card className="border border-white/10 bg-[#0f1727]/75">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-sora text-xl font-semibold">Load Distribution</h2>
                    <p className="text-xs text-foreground-secondary">Share of portfolio by usage and bill</p>
                  </div>
                  <Brain className="h-5 w-5 text-cyan-200" />
                </div>

                {chartData.length > 0 ? (
                  <div className="space-y-5">
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              border: '1px solid rgba(148,163,184,0.25)',
                              borderRadius: '12px',
                            }}
                          />
                          <Bar dataKey="usageShare" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`usage-${entry.name}-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="attributedCost"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cost-${entry.name}-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              border: '1px solid rgba(148,163,184,0.25)',
                              borderRadius: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-sm text-foreground-secondary">
                    Add at least one appliance to generate distribution charts.
                  </div>
                )}
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <Card className="border border-white/10 bg-[#0f1727]/75">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-sora text-xl font-semibold">Device Inventory</h2>
                      <p className="text-xs text-foreground-secondary">No duplicates. One clean card per appliance.</p>
                    </div>
                    <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-foreground-secondary">
                      {sortedAppliances.length} items
                    </span>
                  </div>

                  <div className="space-y-3">
                    {sortedAppliances.length > 0 ? (
                      sortedAppliances.map((appliance) => {
                        const isExpanded = expandedDevice === appliance.id
                        return (
                          <article key={appliance.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div className="flex min-w-0 items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-xs font-bold text-cyan-200">
                                  {categoryBadge(appliance.category)}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-foreground">{appliance.name}</p>
                                  <p className="text-xs text-foreground-tertiary">
                                    {appliance.category} | {appliance.type}
                                  </p>
                                  <span
                                    className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] ${efficiencyTone(appliance.efficiency)}`}
                                  >
                                    {appliance.efficiency || 'unknown'}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm md:min-w-[260px]">
                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                  <p className="text-xs text-foreground-tertiary">kWh / month</p>
                                  <p className="mt-1 font-semibold text-foreground">
                                    {Number(appliance.estimatedKwh || 0).toFixed(2)}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                  <p className="text-xs text-foreground-tertiary">Cost / month</p>
                                  <p className="mt-1 font-semibold text-emerald-300">
                                    Rs {Math.round(Number(appliance.estimatedCost || 0)).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditForm(appliance)}>
                                <Edit className="h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void removeAppliance(appliance.id, appliance.name)}
                                className="border-red-500/30 text-red-200 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedDevice((prev) => (prev === appliance.id ? null : appliance.id))
                                }
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {isExpanded ? 'Hide Details' : 'More Details'}
                              </Button>
                            </div>

                            {isExpanded && (
                              <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm md:grid-cols-2">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.12em] text-foreground-tertiary">
                                    Operation Profile
                                  </p>
                                  <p className="mt-2 text-foreground-secondary">
                                    {Number(appliance.wattage || 0).toLocaleString()}W x{' '}
                                    {Number(appliance.hoursPerDay || 0).toFixed(1)}h/day x{' '}
                                    {Number(appliance.daysPerMonth || 0).toFixed(0)} days
                                  </p>
                                  <p className="mt-1 text-foreground-secondary">
                                    Usage Share: {Number(appliance.usageSharePct ?? appliance.contribution ?? 0).toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-[0.12em] text-foreground-tertiary">
                                    Recommendations
                                  </p>
                                  {appliance.optimizationSuggestions && appliance.optimizationSuggestions.length > 0 ? (
                                    <ul className="mt-2 space-y-1 text-foreground-secondary">
                                      {appliance.optimizationSuggestions.slice(0, 3).map((tip) => (
                                        <li key={`${appliance.id}-${tip}`} className="flex items-start gap-2">
                                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-200" />
                                          <span>{tip}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="mt-2 text-foreground-secondary">
                                      Keep this profile updated with actual usage for smarter recommendations.
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </article>
                        )
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-sm text-foreground-secondary">
                        No appliances added yet. Start by adding your largest energy consumers.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <Card className="border border-white/10 bg-[#0f1727]/75">
                <div className="mb-4 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-cyan-200" />
                  <h2 className="font-sora text-xl font-semibold">Optimization Notes</h2>
                </div>
                <div className="space-y-3 text-sm text-foreground-secondary">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="font-semibold text-foreground">Forecast delta</p>
                    <p className="mt-1">
                      Device model vs meter forecast: {Number(consistency?.forecastDeltaKwh || 0).toFixed(1)} kWh (
                      {Number(consistency?.forecastDeltaPct || 0).toFixed(1)}%).
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="font-semibold text-foreground">Calibration factor</p>
                    <p className="mt-1">
                      Current model factor: {Number(consistency?.calibrationFactorMtd || 0).toFixed(2)}x
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="font-semibold text-foreground">Cleanup guidance</p>
                    <p className="mt-1">
                      Remove inactive appliances and keep one accurate record per device to avoid noisy forecasts.
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DevicesPage
