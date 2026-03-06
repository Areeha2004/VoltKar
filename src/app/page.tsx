'use client'

import React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  Gauge,
  Layers3,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const platformMetrics = [
  { label: 'Active Meters', value: '52K+' },
  { label: 'Energy Events / Day', value: '2.1M' },
  { label: 'Forecast Reliability', value: '96.4%' },
  { label: 'Uptime', value: '99.97%' },
]

const capabilityCards = [
  {
    icon: Brain,
    title: 'Adaptive Consumption Models',
    description: 'Models continuously recalibrate from incoming readings to catch waste signals and cost drift early.',
  },
  {
    icon: BarChart3,
    title: 'High-Resolution Analytics',
    description: 'Track load by day, week, and appliance cluster with clean attribution and usage deltas.',
  },
  {
    icon: Target,
    title: 'Execution-Ready Playbooks',
    description: 'Turn detected issues into focused action lists ranked by expected monthly impact.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Operations Layer',
    description: 'Built-in session protection, reliable controls, and private handling of operational telemetry.',
  },
]

const workflowSteps = [
  {
    title: 'Ingest and normalize',
    detail: 'Bring in meter readings and appliance metadata to establish a stable baseline.',
  },
  {
    title: 'Decode load behavior',
    detail: 'Review anomaly triggers, forecast shifts, and concentration zones in one control view.',
  },
  {
    title: 'Execute with verification',
    detail: 'Apply recommended actions and validate recovery in the next readings cycle.',
  },
]

const signalRibbon = [
  { icon: Activity, title: 'Live Signal Monitoring', text: 'Usage drift and anomaly checks update continuously.' },
  { icon: LineChart, title: 'Forecast Stream', text: 'Bill projections refresh as soon as new data lands.' },
  { icon: Layers3, title: 'Load Mapping', text: 'Pinpoint where consumption concentration is building.' },
  { icon: Clock3, title: 'Timing Windows', text: 'Identify high-leverage hours before slab escalation.' },
]

const heroHighlights = [
  'Reading-to-forecast sync in near real time',
  'Slab risk alerts before billing close',
  'Appliance-level load attribution',
  'Every recommendation tied to Rs impact',
]

const pulseBars = [34, 48, 42, 56, 52, 68, 60, 74, 66, 79, 72, 88]
const partnerMarks = ['NOVA GRID', 'AXIS ENERGY', 'K-WAVE', 'LUMEN OPS', 'POWERSTACK', 'PHASEFLOW']

const LandingPage: React.FC = () => {
  const { data: session } = useSession()
  const authCtaHref = session?.user ? '/dashboard' : '/login'
  const authCtaLabel = session?.user ? 'Dashboard' : 'Sign In'

  return (
    <div className="min-h-screen bg-[#060b14] text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-[-6rem] h-[26rem] w-[26rem] rounded-full bg-cyan-500/18 blur-[130px]" />
        <div className="absolute right-[-10rem] top-1/4 h-[28rem] w-[28rem] rounded-full bg-primary/18 blur-[150px]" />
        <div className="absolute bottom-[-6rem] left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-emerald-400/12 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.24] [background-image:linear-gradient(rgba(16,185,129,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.16)_1px,transparent_1px)] [background-size:52px_52px]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:repeating-linear-gradient(120deg,rgba(34,211,238,0.35)_0,rgba(34,211,238,0.35)_2px,transparent_2px,transparent_30px)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-cyan-400/10 bg-[#050a13]/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-400/20 to-emerald-400/20">
              <Zap className="h-5 w-5 text-cyan-100 transition-transform duration-300 group-hover:scale-110" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.85)]" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-tertiary">Electric Intelligence</p>
              <p className="font-sora text-xl font-bold text-foreground">Volt</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-foreground-secondary md:flex">
            <a href="#capabilities" className="hover:text-foreground">
              Capabilities
            </a>
            <a href="#workflow" className="hover:text-foreground">
              Workflow
            </a>
            <a href="#launch" className="hover:text-foreground">
              Launch
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href={authCtaHref}>
              <Button variant="ghost" size="sm">
                {authCtaLabel}
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="shadow-[0_0_22px_rgba(0,212,170,0.25)]">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="px-4 pb-14 pt-12 md:px-6 md:pt-16">
          <div className="mx-auto w-full max-w-7xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-[#070f1d]/95 via-[#0a1628]/95 to-[#081120]/95 p-6 shadow-premium md:p-10">
              <div className="pointer-events-none absolute -left-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-cyan-500/22 blur-[140px]" />
              <div className="pointer-events-none absolute -right-16 top-4 h-72 w-72 rounded-full bg-emerald-400/18 blur-[130px]" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(90deg,rgba(34,211,238,0.14)_1px,transparent_1px),linear-gradient(rgba(16,185,129,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="pointer-events-none absolute inset-y-8 right-8 hidden w-32 opacity-65 lg:block [background-image:linear-gradient(to_bottom,rgba(45,212,191,0.85)_2px,transparent_2px),linear-gradient(to_right,rgba(34,211,238,0.25)_1px,transparent_1px)] [background-size:100%_34px,16px_16px]" />

              <div className="relative grid gap-8 lg:grid-cols-[1.04fr_0.96fr]">
                <div className="space-y-7">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    Grid Intelligence Platform
                  </div>

                  <div className="space-y-4">
                    <h1 className="font-sora text-4xl font-bold leading-[1.05] md:text-[4.25rem]">
                      Run your
                      <span className="block bg-gradient-to-r from-cyan-200 via-cyan-100 to-emerald-200 bg-clip-text text-transparent">
                        electricity stack
                      </span>
                      with precision.
                    </h1>
                    <p className="max-w-2xl text-base text-foreground-secondary md:text-lg md:leading-relaxed">
                      Volt merges live meter signals, forecasting, and optimization into a single command surface so your next action is always clear.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {heroHighlights.map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                        <span className="text-foreground-secondary">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href={session?.user ? '/dashboard' : '/signup'}>
                      <Button size="lg" className="shadow-[0_0_30px_rgba(0,212,170,0.28)]">
                        {session?.user ? 'Open Dashboard' : 'Launch Workspace'}
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/optimization">
                      <Button variant="outline" size="lg" className="border-white/15 bg-white/[0.03] text-foreground">
                        Explore Optimization
                      </Button>
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {partnerMarks.map(item => (
                      <span
                        key={item}
                        className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] tracking-[0.16em] text-foreground-tertiary"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#0d1829]/85 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                    <div className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.28)_0,transparent_45%),radial-gradient(circle_at_80%_90%,rgba(16,185,129,0.22)_0,transparent_40%)]" />
                    <div className="relative space-y-5">
                      <div className="flex items-center justify-between">
                        <h2 className="font-sora text-xl font-semibold">Grid Pulse Board</h2>
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
                          synchronized
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          { icon: Gauge, label: 'Current Draw', value: '4.8 kW' },
                          { icon: Zap, label: 'Forecast Bill', value: 'Rs 18,420' },
                          { icon: Target, label: 'Budget Recovery', value: '72%' },
                          { icon: Activity, label: 'Anomaly Risk', value: 'Low' },
                        ].map(item => (
                          <div key={item.label} className="rounded-xl border border-white/10 bg-[#0d1728]/75 p-4">
                            <item.icon className="h-4 w-4 text-cyan-200" />
                            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-foreground-tertiary">{item.label}</p>
                            <p className="mt-1 text-lg font-semibold text-foreground">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-2xl border border-cyan-300/20 bg-[#08111f]/75 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs uppercase tracking-[0.14em] text-foreground-tertiary">Voltage Wave</p>
                          <p className="text-xs text-cyan-200">streaming input</p>
                        </div>
                        <div className="relative flex h-24 items-end gap-1.5 overflow-hidden rounded-lg border border-cyan-300/20 px-2 pb-2 pt-4">
                          <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_top,rgba(34,211,238,0.2)_1px,transparent_1px)] [background-size:100%_18px]" />
                          {pulseBars.map((height, index) => (
                            <div
                              key={`hero-pulse-bar-${index}`}
                              className="w-full rounded-md bg-gradient-to-t from-cyan-500/35 via-primary/45 to-emerald-300/80"
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#0c1524]/80 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.14em] text-foreground-tertiary">Signal Throughput</p>
                      <p className="text-xs text-cyan-200">+4.8% modeling efficiency</p>
                    </div>
                    <div className="flex items-end gap-1.5">
                      {[30, 38, 35, 47, 44, 55, 52, 61, 58, 67].map((height, index) => (
                        <div
                          key={`throughput-bar-${index}`}
                          className="w-full rounded-md bg-gradient-to-t from-cyan-500/35 via-primary/40 to-emerald-300/75"
                          style={{ height: `${height}px` }}
                        />
                      ))}
                    </div>
                  </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { icon: Activity, title: '3', text: 'priority actions' },
                        { icon: LineChart, title: 'Rs 3,200', text: 'projected monthly gain' },
                        { icon: Clock3, title: '7 days', text: 'verification cycle' },
                      ].map(item => (
                        <div key={item.text} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <item.icon className="h-4 w-4 text-cyan-200" />
                        <p className="mt-2 text-lg font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-foreground-secondary">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-10 md:px-6">
          <div className="mx-auto mb-4 grid w-full max-w-7xl gap-3 md:grid-cols-2 xl:grid-cols-4">
            {signalRibbon.map((item) => (
              <div key={item.title} className="rounded-2xl border border-cyan-300/15 bg-[#0b1423]/80 p-4">
                <item.icon className="h-4 w-4 text-cyan-200" />
                <p className="mt-2 text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-foreground-secondary">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 pb-14 md:px-6">
          <div className="mx-auto grid w-full max-w-7xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {platformMetrics.map((metric) => (
              <Card key={metric.label} className="border border-cyan-300/15 bg-gradient-to-br from-[#0f1b2f]/85 to-[#0a1321]/85">
                <p className="text-xs uppercase tracking-[0.16em] text-foreground-tertiary">{metric.label}</p>
                <p className="mt-3 font-sora text-3xl font-semibold text-foreground">{metric.value}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="capabilities" className="px-4 pb-14 md:px-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground-tertiary">Core Engine</p>
              <h2 className="font-sora text-3xl font-bold md:text-4xl">Built for high-confidence decisions at grid speed</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {capabilityCards.map((feature) => (
                <Card key={feature.title} className="border border-cyan-300/15 bg-[#0d1728]/80">
                  <feature.icon className="h-6 w-6 text-cyan-200" />
                  <h3 className="mt-4 font-sora text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-foreground-secondary md:text-base">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="px-4 pb-16 md:px-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground-tertiary">Execution Flow</p>
              <h2 className="font-sora text-3xl font-bold md:text-4xl">Three-step loop from data to action</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <Card key={step.title} className="border border-white/10 bg-[#0f1727]/75">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-sm font-semibold text-cyan-100">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-sora text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-foreground-secondary md:text-base">{step.detail}</p>
                </Card>
              ))}
            </div>

            <Card className="border border-cyan-300/15 bg-[#0d1628]/80">
              <div className="grid gap-5 md:grid-cols-3">
                {[
                  { title: 'Input quality', value: '98.7%', detail: 'Meter chain continuity' },
                  { title: 'Model confidence', value: '91.0%', detail: 'Current reliability index' },
                  { title: 'Execution queue', value: '7 actions', detail: 'This week optimization tasks' },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-foreground-tertiary">{item.title}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
                    <p className="mt-1 text-xs text-foreground-secondary">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section id="launch" className="px-4 pb-20 md:px-6">
          <div className="mx-auto w-full max-w-5xl">
            <section className="relative overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-[#071121]/95 via-[#0d1a2e]/95 to-[#081220]/95 p-8 shadow-premium md:p-10">
              <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(34,211,238,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.14)_1px,transparent_1px)] [background-size:30px_30px]" />
              <div className="space-y-6 text-center">
                <h2 className="font-sora text-3xl font-bold md:text-4xl">Ready to switch your grid decisions into high fidelity?</h2>
                <p className="mx-auto max-w-2xl text-sm text-foreground-secondary md:text-base">
                  Start with your existing meter chain, map appliance load, and let Volt produce a focused optimization lane.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/signup">
                    <Button size="lg" className="shadow-[0_0_30px_rgba(0,212,170,0.28)]">
                      Create Account
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="border-white/15 bg-white/[0.03] text-foreground">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}

export default LandingPage
