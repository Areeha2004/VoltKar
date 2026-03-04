'use client'

import React from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  Cpu,
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
  { label: 'Households + SMBs', value: '50K+' },
  { label: 'Verified Savings', value: 'Rs 2.5B+' },
  { label: 'Forecast Accuracy', value: '96%' },
  { label: 'System Availability', value: '99.9%' },
]

const capabilityCards = [
  {
    icon: Brain,
    title: 'AI Consumption Intelligence',
    description: 'Detect waste patterns, estimate upcoming bills, and get model-driven interventions before costs spike.',
  },
  {
    icon: BarChart3,
    title: 'Precision Analytics',
    description: 'Track month-to-date usage, day-level trends, and device-level attribution in one unified interface.',
  },
  {
    icon: Target,
    title: 'Optimization Playbooks',
    description: 'Turn insights into action with structured daily plans to control slabs and reduce avoidable spend.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by Design',
    description: 'Reliable platform controls with strong session security and private handling of operational data.',
  },
]

const workflowSteps = [
  {
    title: 'Connect your meter data',
    detail: 'Start with clean reading entries and appliance profiles to build a reliable usage baseline.',
  },
  {
    title: 'Review model output',
    detail: 'See how current patterns affect forecasted cost and where load concentration is forming.',
  },
  {
    title: 'Execute optimization',
    detail: 'Apply high-impact recommendations, then validate improvement in the next readings cycle.',
  },
]

const signalRibbon = [
  { icon: Activity, title: 'Live anomaly checks', text: 'Real-time detection across usage stream.' },
  { icon: LineChart, title: 'Forecast model updates', text: 'Continuous re-forecast with latest readings.' },
  { icon: Layers3, title: 'Device attribution', text: 'Map spend concentration by appliance group.' },
  { icon: Clock3, title: 'Action windows', text: 'Identify best timing to avoid slab jumps.' },
]

const partnerMarks = ['NOVA GRID', 'AXIS ENERGY', 'K-WAVE', 'LUMEN OPS', 'POWERSTACK']

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-[22rem] w-[22rem] rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute right-0 top-1/4 h-[26rem] w-[26rem] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-accent-blue/8 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/35 bg-gradient-to-br from-cyan-500/20 to-primary/20">
              <Zap className="h-5 w-5 text-cyan-200 transition-transform duration-300 group-hover:scale-110" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-foreground-tertiary">Energy OS</p>
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
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="px-4 pb-14 pt-16 md:px-6 md:pt-20">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Advanced Energy Intelligence
              </div>

              <div className="space-y-4">
                <h1 className="font-sora text-4xl font-bold leading-tight md:text-6xl">
                  A premium control plane for
                  <span className="block bg-gradient-to-r from-cyan-200 via-white to-emerald-200 bg-clip-text text-transparent">
                    high-precision electricity operations.
                  </span>
                </h1>
                <p className="max-w-2xl text-base text-foreground-secondary md:text-lg">
                  Volt combines high-precision analytics, AI forecasting, and optimization workflows so every
                  operational decision is based on clean data and measurable impact.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg">
                    Launch Workspace
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="border-white/15 bg-white/[0.03] text-foreground">
                    Preview Dashboard
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {['No noisy dashboards', 'Actionable AI guidance', 'Built for scale'].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                    <span className="text-foreground-secondary">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {partnerMarks.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] tracking-[0.16em] text-foreground-tertiary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card className="border border-white/10 bg-[#0f1727]/80">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-sora text-xl font-semibold">Live Command Center</h2>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
                      Stable
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { icon: Gauge, label: 'MTD Usage', value: '318 kWh' },
                      { icon: Zap, label: 'Forecast Bill', value: 'Rs 18,420' },
                      { icon: Cpu, label: 'AI Confidence', value: '91%' },
                      { icon: Target, label: 'Potential Savings', value: 'Rs 3,200' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <item.icon className="h-4 w-4 text-cyan-200" />
                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-foreground-tertiary">{item.label}</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.14em] text-foreground-tertiary">Forecast Momentum</p>
                      <p className="text-xs text-cyan-200">+4.2% optimization gain</p>
                    </div>
                    <div className="flex items-end gap-1.5">
                      {[22, 34, 29, 46, 40, 52, 61, 58, 66, 71].map((height, index) => (
                        <div
                          key={`bar-${index}`}
                          className="w-full rounded-md bg-gradient-to-t from-cyan-500/35 to-cyan-200/70"
                          style={{ height: `${height}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                    Optimization signal: move high-load appliance usage to off-peak window to reduce projected slab jump.
                  </div>
                </div>
              </Card>

              <div className="absolute -right-4 -top-4 hidden rounded-xl border border-white/10 bg-[#0e1628]/90 p-3 text-xs text-foreground-secondary shadow-premium md:block">
                <p className="text-cyan-200">AI Watch</p>
                <p className="mt-1">3 high-priority actions active</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-10 md:px-6">
          <div className="mx-auto mb-4 grid w-full max-w-7xl gap-3 md:grid-cols-2 xl:grid-cols-4">
            {signalRibbon.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
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
              <Card key={metric.label} className="border border-white/10 bg-gradient-to-br from-[#101a2c]/85 to-[#0b1423]/85">
                <p className="text-xs uppercase tracking-[0.16em] text-foreground-tertiary">{metric.label}</p>
                <p className="mt-3 font-sora text-3xl font-semibold text-foreground">{metric.value}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="capabilities" className="px-4 pb-14 md:px-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground-tertiary">Capabilities</p>
              <h2 className="font-sora text-3xl font-bold md:text-4xl">Designed for clean, high-impact decisions</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {capabilityCards.map((feature) => (
                <Card key={feature.title} className="border border-white/10 bg-[#0f1727]/75">
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
              <p className="text-xs uppercase tracking-[0.2em] text-foreground-tertiary">Workflow</p>
              <h2 className="font-sora text-3xl font-bold md:text-4xl">Simple operating rhythm</h2>
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

            <Card className="border border-white/10 bg-[#0d1628]/80">
              <div className="grid gap-5 md:grid-cols-3">
                {[
                  { title: 'Input quality', value: '98.7%', detail: 'Meter chain continuity' },
                  { title: 'Model reliability', value: '91.0%', detail: 'Current confidence index' },
                  { title: 'Execution readiness', value: '7 actions', detail: 'This week optimized tasks' },
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
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a1323]/95 via-[#0f1a2d]/95 to-[#081220]/95 p-8 shadow-premium md:p-10">
              <div className="space-y-6 text-center">
                <h2 className="font-sora text-3xl font-bold md:text-4xl">Ready to run your energy stack with precision?</h2>
                <p className="mx-auto max-w-2xl text-sm text-foreground-secondary md:text-base">
                  Start with your existing meter readings, clean up device inventory, and let Volt produce a structured
                  optimization plan.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/signup">
                    <Button size="lg">
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
