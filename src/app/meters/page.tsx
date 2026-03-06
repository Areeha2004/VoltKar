'use client'
import React, { useMemo, useState } from 'react'
import { Activity, AlertTriangle, Home, Plus, TrendingUp, WalletCards, Zap } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import MeterCard from '../../components/meters/MeterCard'
import CreateMeterModal from '../../components/meters/CreateMeterModal'
import { useMeters } from '../../hooks/useMeters'

const MetersPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { meters, loading, error, createMeter, updateMeter, deleteMeter } = useMeters()

  const handleCreateMeter = async (data: { label: string; type: string }) => {
    await createMeter(data)
  }

  const handleUpdateMeter = async (id: string, data: { label: string; type: string }) => {
    await updateMeter(id, data)
  }

  const handleDeleteMeter = async (id: string) => {
    await deleteMeter(id)
  }

  const stats = useMemo(() => {
    const activeCount = meters.filter(m => m.status === 'active').length
    const withReadings = meters.filter(m => typeof m.lastReading === 'number' && m.lastReading > 0)
    const avgLastReading =
      withReadings.length > 0
        ? Math.round(withReadings.reduce((sum, meter) => sum + (meter.lastReading || 0), 0) / withReadings.length)
        : 0

    return [
      {
        title: 'Total Meters',
        value: meters.length.toString(),
        helper: 'Registered connections',
        icon: WalletCards,
        tone: 'from-cyan-500/25 to-blue-500/5 text-cyan-300'
      },
      {
        title: 'Active Meters',
        value: activeCount.toString(),
        helper: 'Currently monitoring',
        icon: Zap,
        tone: 'from-emerald-500/25 to-primary/5 text-emerald-300'
      },
      {
        title: 'Meters with Readings',
        value: withReadings.length.toString(),
        helper: 'Data-ready meters',
        icon: TrendingUp,
        tone: 'from-amber-500/25 to-amber-500/5 text-amber-200'
      },
      {
        title: 'Average Last Reading',
        value: avgLastReading > 0 ? avgLastReading.toLocaleString() : '--',
        unit: avgLastReading > 0 ? 'units' : '',
        helper: 'Snapshot across active history',
        icon: Activity,
        tone: 'from-primary/25 to-cyan-500/5 text-primary-200'
      }
    ]
  }, [meters])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex flex-1 items-center justify-center px-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
              <p className="text-sm text-foreground-secondary">Loading meter workspace...</p>
            </div>
          </main>
        </div>
      </div>
    )
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
                  <h1 className="font-sora text-3xl font-bold leading-tight text-foreground md:text-4xl">
                    Meter Management
                  </h1>
                  <p className="max-w-2xl text-sm text-foreground-secondary md:text-base">
                    Keep all connections organized, maintain reading continuity, and ensure stable analytics for your
                    full energy workspace.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground-secondary">
                      {meters.length} meters configured
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground-secondary">
                      {stats[1].value} active
                    </span>
                  </div>
                </div>

                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4" />
                  Add Meter
                </Button>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(stat => (
                <Card key={stat.title} className="h-full border border-white/10 bg-[#0f1727]/75 backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-foreground-tertiary">{stat.title}</p>
                      <p className="font-sora text-2xl font-semibold text-foreground">
                        {stat.value}
                        {stat.unit && <span className="ml-1 text-sm font-normal text-foreground-secondary">{stat.unit}</span>}
                      </p>
                      <p className="text-xs text-foreground-secondary">{stat.helper}</p>
                    </div>
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br ${stat.tone}`}
                    >
                      <stat.icon className="h-5 w-5" />
                    </span>
                  </div>
                </Card>
              ))}
            </section>

            {error && (
              <section className="rounded-3xl border border-red-500/25 bg-red-500/10 p-5 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-red-400/30 bg-red-500/15 p-2.5">
                      <AlertTriangle className="h-5 w-5 text-red-200" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-100">Unable to fetch meters</p>
                      <p className="text-sm text-red-100/90">{error}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </section>
            )}

            {meters.length > 0 ? (
              <section className="rounded-3xl border border-white/10 bg-[#0f1727]/75 p-6 backdrop-blur-xl md:p-7">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-sora text-xl font-semibold text-foreground">Your Meters</h2>
                  <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-foreground-secondary">
                    {meters.length} entries
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {meters.map((meter, index) => (
                    <div key={meter.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <MeterCard
                        meter={meter}
                        onUpdate={handleUpdateMeter}
                        onDelete={handleDeleteMeter}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="rounded-3xl border border-white/10 bg-[#0f1727]/75 p-8 text-center backdrop-blur-xl md:p-12">
                <div className="mx-auto max-w-lg space-y-5">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                    <Home className="h-8 w-8 text-cyan-200" />
                  </div>
                  <div>
                    <h3 className="font-sora text-2xl font-semibold text-foreground">No meters added yet</h3>
                    <p className="mt-2 text-sm text-foreground-secondary md:text-base">
                      Add your first meter to unlock reading capture, slab analysis, and optimization workflows.
                    </p>
                  </div>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4" />
                    Add Your First Meter
                  </Button>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      <CreateMeterModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateMeter}
      />
    </div>
  )
}

export default MetersPage
