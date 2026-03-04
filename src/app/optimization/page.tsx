"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Brain,
  DollarSign,
  RefreshCw,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

type PlaybookItem = {
  id: string;
  title: string;
  description: string;
  priority: string;
  timeframe: string;
  difficulty: string;
  estimatedSavings: number;
  steps: string[];
};

const priorityTone = (priority: string) => {
  if (priority === "high")
    return "text-red-300 bg-red-500/10 border-red-500/25";
  if (priority === "medium")
    return "text-amber-300 bg-amber-500/10 border-amber-500/25";
  return "text-cyan-300 bg-cyan-500/10 border-cyan-500/25";
};

const difficultyTone = (difficulty: string) => {
  if (difficulty === "Hard") return "text-red-300 bg-red-500/10";
  if (difficulty === "Medium") return "text-amber-300 bg-amber-500/10";
  return "text-emerald-300 bg-emerald-500/10";
};

const OptimizationPage: React.FC = () => {
  const searchParams = useSearchParams();
  const fromDualMeter = searchParams.get("source") === "dual-meter";
  const meterIdFromQuery = searchParams.get("meterId");

  const [statsBundle, setStatsBundle] = useState<any>(null);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  const fetchAnalysisData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `/api/stats/optimization${meterIdFromQuery ? `?meterId=${meterIdFromQuery}` : ""}`,
      );
      if (!response.ok) {
        setStatsBundle(null);
        setOptimizationData(null);
        return;
      }

      const payload = await response.json();
      setStatsBundle(payload?.data?.stats ?? null);
      setOptimizationData(payload?.data?.optimization ?? null);
    } catch (error) {
      console.error("Failed to fetch optimization data:", error);
      setStatsBundle(null);
      setOptimizationData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateOptimizations = async () => {
    try {
      setGenerating(true);
      const requestBody: {
        includeAppliances: boolean;
        meterId?: string;
        budget?: number;
      } = {
        includeAppliances: true,
      };
      if (meterIdFromQuery) requestBody.meterId = meterIdFromQuery;
      const budgetTarget = Number(statsBundle?.budget?.monthly_pkr || 0);
      if (budgetTarget > 0) requestBody.budget = budgetTarget;

      const response = await fetch("/api/optimization/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) return;
      const payload = await response.json();
      setStatsBundle(payload?.data?.stats ?? null);
      setOptimizationData(payload?.data?.optimization ?? null);
    } catch (error) {
      console.error("Failed to generate optimization plan:", error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    void fetchAnalysisData();
  }, [meterIdFromQuery]);

  const aiPlan = optimizationData?.ai || null;
  const aiRecommendations = Array.isArray(aiPlan?.recommendations)
    ? aiPlan.recommendations
    : [];
  const aiWarnings = Array.isArray(aiPlan?.warnings) ? aiPlan.warnings : [];

  const playbook = useMemo<PlaybookItem[]>(() => {
    if (aiRecommendations.length > 0) {
      return aiRecommendations.slice(0, 6).map((item: any) => ({
        id: item.id || item.title,
        title: item.title,
        description: item.reason,
        priority: item.priority || "medium",
        timeframe:
          item.timeframe === "today"
            ? "Today"
            : item.timeframe === "this_month"
              ? "This month"
              : "This week",
        difficulty:
          item.effort === "hard"
            ? "Hard"
            : item.effort === "medium"
              ? "Medium"
              : "Easy",
        estimatedSavings: Number(item.estimatedSavingsPkr || 0),
        steps: Array.isArray(item.steps) ? item.steps : [],
      }));
    }

    const fallbackActions = Array.isArray(optimizationData?.priority_actions)
      ? optimizationData.priority_actions
      : Array.isArray(optimizationData?.optimization?.priority_actions)
        ? optimizationData.optimization.priority_actions
        : [];

    return fallbackActions.map((item: any, index: number) => ({
      id: `fallback-${index}`,
      title: item.action || "Action",
      description: `Expected impact: ${item.impact || "Not specified"}`,
      priority: index < 2 ? "high" : "medium",
      timeframe: item.timeframe || "This week",
      difficulty: item.difficulty || "Medium",
      estimatedSavings:
        Number(String(item.impact || "").replace(/[^\d.]/g, "")) || 0,
      steps: [
        "Apply this action and monitor next meter readings.",
        "Re-check forecast after implementation.",
        "Keep the strategy if trend improves.",
      ],
    }));
  }, [aiRecommendations, optimizationData]);

  const loadBalancing =
    optimizationData?.load_balancing ||
    optimizationData?.optimization?.load_balancing ||
    null;
  const actionPlan = Array.isArray(optimizationData?.action_plan)
    ? optimizationData.action_plan
    : Array.isArray(optimizationData?.optimization?.action_plan)
      ? optimizationData.optimization.action_plan
      : [];
  const applianceBreakdown = Array.isArray(optimizationData?.savingsBreakdown)
    ? [...optimizationData.savingsBreakdown].sort(
        (a: any, b: any) =>
          Number(b.currentCost || 0) - Number(a.currentCost || 0),
      )
    : [];

  const potentialSavings = Number(optimizationData?.potential_savings_pkr || 0);
  const confidence = Number(optimizationData?.metadata?.confidence || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex flex-1 items-center justify-center px-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
              <p className="text-sm text-foreground-secondary">
                Loading optimization center...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
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
                  <p className="text-xs uppercase tracking-[0.22em] text-foreground-tertiary">
                    Optimization
                  </p>
                  <h1 className="font-sora text-3xl font-bold md:text-4xl">
                    AI Optimization Coach
                  </h1>
                  <p className="max-w-2xl text-sm text-foreground-secondary md:text-base">
                    Clean action pipeline: identify high-impact actions, execute
                    a 7-day plan, and track cost recovery.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void fetchAnalysisData(true)}
                    disabled={refreshing}
                    className="border-white/15 bg-white/[0.03] text-foreground"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                  <Button
                    onClick={() => void generateOptimizations()}
                    disabled={generating}
                  >
                    <Brain className="h-4 w-4" />
                    {generating ? "Generating..." : "Generate Plan"}
                  </Button>
                </div>
              </div>
            </section>

            {fromDualMeter && (
              <section className="rounded-3xl border border-cyan-500/25 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                Dual-meter route redirected here. Priority actions now include
                meter balancing and slab control steps.
              </section>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: "Usage MTD",
                  value: `${Math.round(Number(statsBundle?.optimization?.current_usage_mtd_kwh || 0)).toLocaleString()} kWh`,
                  icon: Zap,
                },
                {
                  title: "Projected Cost",
                  value: `Rs ${Math.round(Number(statsBundle?.optimization?.projected_cost_pkr || 0)).toLocaleString()}`,
                  icon: DollarSign,
                },
                {
                  title: "Budget Status",
                  value: statsBundle?.budget?.status || "Not Set",
                  icon: Target,
                },
                {
                  title: "Potential Savings",
                  value: `Rs ${Math.round(potentialSavings).toLocaleString()}`,
                  icon: TrendingUp,
                },
              ].map((metric) => (
                <Card
                  key={metric.title}
                  className="border border-white/10 bg-[#0f1727]/75"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-foreground-tertiary">
                        {metric.title}
                      </p>
                      <p className="mt-2 font-sora text-2xl font-semibold">
                        {metric.value}
                      </p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <metric.icon className="h-5 w-5 text-cyan-200" />
                    </span>
                  </div>
                </Card>
              ))}
            </section>

            {aiWarnings.length > 0 && (
              <section className="space-y-3">
                {aiWarnings.slice(0, 2).map((warning: any, index: number) => (
                  <article
                    key={`ai-warning-${index}`}
                    className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-red-100"
                  >
                    <p className="text-sm font-semibold">{warning.title}</p>
                    <p className="text-sm">{warning.message}</p>
                  </article>
                ))}
              </section>
            )}

            <section className="rounded-3xl border border-white/10 bg-[#0f1727]/75 p-6 md:p-7">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-sora text-xl font-semibold">
                  Priority Playbook
                </h2>
                <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-foreground-secondary">
                  {playbook.length} actions
                </span>
              </div>

              {playbook.length > 0 ? (
                <div className="space-y-3">
                  {playbook.map((action) => (
                    <article
                      key={action.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {action.title}
                          </p>
                          <p className="text-sm text-foreground-secondary">
                            {action.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] ${priorityTone(action.priority)}`}
                          >
                            {action.priority}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${difficultyTone(action.difficulty)}`}
                          >
                            {action.difficulty}
                          </span>
                          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-foreground-secondary">
                            {action.timeframe}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-emerald-300">
                          Estimated savings: Rs{" "}
                          {Math.round(action.estimatedSavings).toLocaleString()}
                          /month
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedActionId(
                              expandedActionId === action.id ? null : action.id,
                            )
                          }
                          className="text-xs font-semibold text-cyan-200 hover:underline"
                        >
                          {expandedActionId === action.id
                            ? "Hide Steps"
                            : "Show Steps"}
                        </button>
                      </div>
                      {expandedActionId === action.id && (
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                          <ul className="space-y-1 text-sm text-foreground-secondary">
                            {action.steps.length > 0 ? (
                              action.steps.slice(0, 4).map((step, index) => (
                                <li
                                  key={`${action.id}-step-${index}`}
                                  className="flex items-start gap-2"
                                >
                                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                                  <span>{step}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-foreground-tertiary">
                                No detailed steps available yet.
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-foreground-secondary">
                  No actions available yet. Generate a plan after adding more
                  readings/devices.
                </p>
              )}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="border border-white/10 bg-[#0f1727]/75">
                <h3 className="mb-3 font-sora text-lg font-semibold">
                  Meter and Slab Strategy
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {optimizationData?.recommendation?.meter_strategy ||
                    optimizationData?.optimization?.recommendation
                      ?.meter_strategy ||
                    "Generate a plan for meter strategy guidance."}
                </p>
                <p className="mt-3 text-sm text-foreground-secondary">
                  {optimizationData?.recommendation?.slab_advice ||
                    optimizationData?.optimization?.recommendation
                      ?.slab_advice ||
                    "Slab advice will appear after forecast analysis."}
                </p>

                {loadBalancing?.recommended &&
                  Array.isArray(loadBalancing?.plans) &&
                  loadBalancing.plans.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {loadBalancing.plans
                        .slice(0, 3)
                        .map((plan: any, index: number) => (
                          <div
                            key={`load-plan-${index}`}
                            className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-foreground-secondary"
                          >
                            Shift{" "}
                            {Math.round(
                              Number(plan.shiftKwh || 0),
                            ).toLocaleString()}{" "}
                            kWh from {plan.fromLabel} to {plan.toLabel} (save Rs{" "}
                            {Math.round(
                              Number(plan.estimatedSavingsPkr || 0),
                            ).toLocaleString()}
                            ).
                          </div>
                        ))}
                    </div>
                  )}
              </Card>

              <Card className="border border-white/10 bg-[#0f1727]/75">
                <h3 className="mb-3 font-sora text-lg font-semibold">
                  7-Day Execution Plan
                </h3>
                <div className="space-y-2">
                  {actionPlan.length > 0 ? (
                    actionPlan.slice(0, 7).map((day: any, index: number) => (
                      <div
                        key={`day-plan-${index}`}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground">
                            {day.dayName || `Day ${index + 1}`}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${priorityTone(day.priority || "medium")}`}
                          >
                            {day.priority || "medium"}
                          </span>
                        </div>
                        <p className="mt-1 text-foreground-secondary">
                          {day.recommendation}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-emerald-300">
                          Rs{" "}
                          {Math.round(
                            Number(day.expectedSavings || 0),
                          ).toLocaleString()}{" "}
                          expected savings
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-foreground-secondary">
                      No execution plan yet. Generate optimization to build one.
                    </p>
                  )}
                </div>
              </Card>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0f1727]/75 p-6 md:p-7">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-sora text-xl font-semibold">
                  Appliance Actions
                </h2>
                <Link
                  href="/devices"
                  className="text-sm font-semibold text-cyan-200 hover:underline"
                >
                  Manage Devices
                </Link>
              </div>
              {applianceBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {applianceBreakdown.slice(0, 6).map((appliance: any) => (
                    <article
                      key={appliance.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {appliance.name}
                        </p>
                        <p className="text-xs text-foreground-tertiary">
                          {appliance.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-foreground-secondary">
                          Current: Rs{" "}
                          {Math.round(
                            Number(appliance.currentCost || 0),
                          ).toLocaleString()}
                        </p>
                        <p className="text-xs font-semibold text-emerald-300">
                          Potential: Rs{" "}
                          {Math.round(
                            Number(appliance.potentialSavings || 0),
                          ).toLocaleString()}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-foreground-secondary">
                  No appliance profile available yet. Add appliances in Devices
                  to get device-level optimization.
                </p>
              )}
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "AI Confidence",
                  value: `${Math.round(confidence)}%`,
                  icon: Brain,
                  tone: "text-cyan-200",
                },
                {
                  label: "Budget Status",
                  value: String(statsBundle?.budget?.status || "Not Set"),
                  icon: Target,
                  tone: "text-foreground",
                },
                {
                  label: "Peak Potential",
                  value: `${Math.round(Number(optimizationData?.insights?.peak_optimization_potential || optimizationData?.optimization?.insights?.peak_optimization_potential || 0))}%`,
                  icon: Activity,
                  tone: "text-amber-300",
                },
                {
                  label: "Slab Score",
                  value: `${Math.round(Number(optimizationData?.insights?.slab_optimization_score || optimizationData?.optimization?.insights?.slab_optimization_score || 0))}%`,
                  icon: BarChart3,
                  tone: "text-emerald-300",
                },
              ].map((item) => (
                <Card
                  key={item.label}
                  className="border border-white/10 bg-[#0f1727]/75"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-foreground-tertiary">
                        {item.label}
                      </p>
                      <p className={`mt-2 text-2xl font-semibold ${item.tone}`}>
                        {item.value}
                      </p>
                    </div>
                    <item.icon className={`h-5 w-5 ${item.tone}`} />
                  </div>
                </Card>
              ))}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OptimizationPage;
