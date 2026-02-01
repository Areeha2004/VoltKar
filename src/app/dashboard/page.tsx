"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import {
  Zap,
  TrendingUp,
  DollarSign,
  Clock,
  Plus,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  ArrowUp,
  ArrowDown,
  Activity,
  Lightbulb,
  Wallet,
  Calendar
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SetBudgetModal from "../../components/budget/SetBudgetModal";

import { getBudgetFromStorage } from "../../lib/budgetManager";
import { StatsBundle } from "@/lib/statService";

const Dashboard: React.FC = () => {
  const { data: session } = useSession();
  const name = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "User";

  const [stats, setStats] = useState<StatsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);

  useEffect(() => {
    setMonthlyBudget(getBudgetFromStorage());
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchStats();
    }
  }, [session?.user?.id]);

  const handleBudgetSet = (budget: number) => {
    setMonthlyBudget(budget);
    window.location.reload();
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { mtd, forecast, budget, window: timeWindow } = stats;
  const isMonthEnd = timeWindow.daysElapsed === timeWindow.daysInMonth;
  const progressPercent = (timeWindow.daysElapsed / timeWindow.daysInMonth) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Over Budget': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'At Risk': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-30" />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground font-sora">
                    Welcome back, <span className="gradient-text">{name}</span>
                  </h1>
                  <p className="text-foreground-secondary mt-1">
                    {isMonthEnd ? "Month finalized. Review your actual usage below." : "Current month tracking and forecasting."}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowBudgetModal(true)}>
                    <Wallet className="h-4 w-4 mr-2" />
                    {monthlyBudget ? `Rs ${monthlyBudget.toLocaleString()}` : "Set Budget"}
                  </Button>
                  <Link href="/readings">
                    <Button className="premium-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Enter Reading
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Correctness Verification Display */}
              <div className="text-xs font-medium text-foreground-tertiary flex items-center gap-2 px-1">
                <span className="bg-background-card px-2 py-0.5 rounded-full border border-border/30">
                  Last Month: {stats.prevMonthFull.usage_kwh} kWh · Rs {stats.prevMonthFull.cost_pkr.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Primary Section – Current Month (MTD Focus) */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="card-premium">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-500/10 p-2 rounded-xl">
                    <Zap className="h-6 w-6 text-blue-500" />
                  </div>
                  <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Usage MTD</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-mono">{mtd.usage_kwh.toLocaleString()}</span>
                    <span className="text-foreground-tertiary">kWh</span>
                  </div>
                  <p className="text-sm text-foreground-secondary">Units consumed this month</p>
                </div>
              </Card>

              <Card className="card-premium">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-500/10 p-2 rounded-xl">
                    <DollarSign className="h-6 w-6 text-emerald-500" />
                  </div>
                  <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Cost MTD</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-mono">Rs {mtd.cost_pkr.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-foreground-secondary">Accrued cost so far</p>
                </div>
              </Card>

              <Card className="card-premium relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-purple-500/10 p-2 rounded-xl">
                    {isMonthEnd ? <Calendar className="h-6 w-6 text-purple-500" /> : <TrendingUp className="h-6 w-6 text-purple-500" />}
                  </div>
                  <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    {isMonthEnd ? "Actual Bill" : "Forecasted Bill"}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-mono text-purple-500">Rs {forecast.cost_pkr.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    {isMonthEnd ? "Final bill for the month" : "Projected end-of-month cost"}
                  </p>
                </div>
                {!isMonthEnd && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-background-card">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-1000" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </Card>
            </div>

            {/* Forecast & Budget Comparison */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="card-premium">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Budget Tracking
                  </h2>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(budget.status)}`}>
                    {budget.status.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Monthly Budget</span>
                      <span className="font-semibold">Rs {monthlyBudget?.toLocaleString() ?? "Not Set"}</span>
                    </div>
                    <div className="h-3 bg-background-card rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          budget.status === 'Over Budget' ? 'bg-red-500' :
                          budget.status === 'At Risk' ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(100, (forecast.cost_pkr / (monthlyBudget || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-background-card/50">
                      <p className="text-xs text-foreground-muted uppercase mb-1">Projected Overrun</p>
                      <p className={`text-xl font-bold ${budget.projected_overrun_pkr > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        Rs {budget.projected_overrun_pkr.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-background-card/50">
                      <p className="text-xs text-foreground-muted uppercase mb-1">Remaining Budget</p>
                      <p className="text-xl font-bold">Rs {budget.remaining_to_budget_pkr.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="card-premium">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <Activity className="h-5 w-5 text-accent-blue" />
                  Comparison Insights
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-background-card/50 border border-border/30">
                    <div className="bg-accent-blue/10 p-3 rounded-xl">
                      <Clock className="h-5 w-5 text-accent-blue" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{timeWindow.daysElapsed} days passed</p>
                      <p className="text-xs text-foreground-secondary">{timeWindow.daysInMonth - timeWindow.daysElapsed} days remaining in cycle</p>
                    </div>
                  </div>

                  {isMonthEnd ? (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-2xl border ${forecast.cost_pkr <= (monthlyBudget || 0) ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <p className="text-sm font-medium">
                          {forecast.cost_pkr <= (monthlyBudget || 0) 
                            ? "🎉 Success! You stayed under your budget this month." 
                            : "⚠️ Budget exceeded. Consider reviewing high-usage devices."}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-sm p-2">
                        <span className="text-foreground-secondary">Actual vs Forecast</span>
                        <span className="font-mono text-foreground-secondary">
                          Matched Expected
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-foreground-secondary leading-relaxed">
                        Based on your current pace, you are projected to spend 
                        <span className="font-bold text-foreground"> Rs {forecast.cost_pkr.toLocaleString()} </span>
                        by the end of {timeWindow.now.toLocaleString('default', { month: 'long' })}.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-foreground-muted">
                        <Info className="h-3 w-3" />
                        Forecasting uses {forecast.method} calculation logic.
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
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
  );
};

export default Dashboard;
