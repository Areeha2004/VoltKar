'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowRightLeft, RefreshCw, Target } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface LoadBalancingPlan {
  fromMeterId: string
  fromLabel: string
  toMeterId: string
  toLabel: string
  shiftKwh: number
  estimatedSavingsPkr: number
  reason: string
}

interface LoadBalancingData {
  recommended: boolean
  total_shift_kwh: number
  estimated_savings_pkr: number
  plans: LoadBalancingPlan[]
  meter_headroom: Array<{
    meterId: string
    label: string
    projectedUsage: number
    currentRate: number
    headroomKwh: number
    slabMax: number
  }>
  rationale: string
}

export default function DualMeterPage() {
  const [loading, setLoading] = useState(true)
  const [loadBalancing, setLoadBalancing] = useState<LoadBalancingData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchDualMeter = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/stats/optimization')
      if (!response.ok) {
        throw new Error('Failed to load dual-meter analysis')
      }

      const payload = await response.json()
      setLoadBalancing(payload?.data?.optimization?.load_balancing || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dual-meter analysis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDualMeter()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dual-Meter Optimization</h1>
                <p className="text-foreground-secondary mt-1">
                  Balance projected load across meters using slab headroom.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchDualMeter}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Link href="/optimization">
                  <Button>
                    <Target className="h-4 w-4 mr-2" />
                    Full Optimization
                  </Button>
                </Link>
              </div>
            </div>

            {loading && (
              <Card className="card-premium">
                <p className="text-foreground-secondary">Loading dual-meter analysis...</p>
              </Card>
            )}

            {error && (
              <Card className="card-premium border border-red-500/20 bg-red-500/5">
                <p className="text-red-400">{error}</p>
              </Card>
            )}

            {!loading && !error && loadBalancing && (
              <>
                <Card className="card-premium">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-background-card/50">
                      <p className="text-xs text-foreground-tertiary uppercase">Recommended</p>
                      <p className="text-2xl font-bold text-foreground">
                        {loadBalancing.recommended ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-background-card/50">
                      <p className="text-xs text-foreground-tertiary uppercase">Shift Volume</p>
                      <p className="text-2xl font-bold text-foreground">
                        {loadBalancing.total_shift_kwh.toLocaleString()} kWh
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-background-card/50">
                      <p className="text-xs text-foreground-tertiary uppercase">Savings</p>
                      <p className="text-2xl font-bold text-primary">
                        Rs {loadBalancing.estimated_savings_pkr.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground-secondary mt-4">{loadBalancing.rationale}</p>
                </Card>

                <Card className="card-premium">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Transfer Plan</h2>
                  <div className="space-y-3">
                    {loadBalancing.plans.length > 0 ? (
                      loadBalancing.plans.map((plan, index) => (
                        <div
                          key={`${plan.fromMeterId}-${plan.toMeterId}-${index}`}
                          className="p-4 rounded-xl bg-background-card/50 border border-border/30"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ArrowRightLeft className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">
                                {plan.fromLabel} {'->'} {plan.toLabel}
                              </span>
                            </div>
                            <span className="text-primary font-semibold">
                              Save Rs {plan.estimatedSavingsPkr.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground-secondary mt-2">
                            Shift {plan.shiftKwh} kWh. {plan.reason}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-foreground-secondary">No transfer needed for current forecast.</p>
                    )}
                  </div>
                </Card>

                <Card className="card-premium">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Meter Slab Headroom</h2>
                  <div className="space-y-3">
                    {loadBalancing.meter_headroom.map(meter => (
                      <div
                        key={meter.meterId}
                        className="p-4 rounded-xl bg-background-card/50 border border-border/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-accent-blue" />
                            <span className="font-medium text-foreground">{meter.label}</span>
                          </div>
                          <span className="text-sm text-foreground-secondary">
                            Rate Rs {meter.currentRate}/kWh
                          </span>
                        </div>
                        <p className="text-sm text-foreground-secondary mt-2">
                          Forecast {meter.projectedUsage} kWh, headroom {meter.headroomKwh} kWh
                          {Number.isFinite(meter.slabMax) ? ` (slab max ${meter.slabMax})` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
