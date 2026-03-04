"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  DollarSign,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const slabColors = [
  "#38bdf8",
  "#22d3ee",
  "#00d4aa",
  "#f59e0b",
  "#f97316",
  "#ef4444",
];

type TabId = "overview" | "forecast" | "budget" | "anomalies" | "insights";

const formatSignedPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

const deltaTone = (value: number) =>
  value > 0
    ? "text-red-300"
    : value < 0
      ? "text-emerald-300"
      : "text-slate-300";

const alertTone = (severity: string) => {
  if (severity === "critical" || severity === "high")
    return "border-red-500/30 bg-red-500/10 text-red-100";
  if (severity === "medium")
    return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return "border-cyan-500/30 bg-cyan-500/10 text-cyan-100";
};

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedMeter, setSelectedMeter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [anomalyActionLoading, setAnomalyActionLoading] = useState<
    string | null
  >(null);

  const [usageData, setUsageData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [comparisonItems, setComparisonItems] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [alertFeed, setAlertFeed] = useState<any[]>([]);
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [meters, setMeters] = useState<Array<{ id: string; label: string }>>(
    [],
  );

  const fetchAnalyticsData = async () => {
    try {
      const meterQuery =
        selectedMeter !== "all" ? `?meterId=${selectedMeter}` : "";
      const alertsQuery =
        selectedMeter !== "all"
          ? `?meterId=${selectedMeter}&limit=8`
          : "?limit=8";
      const [
        usageRes,
        costRes,
        forecastRes,
        budgetRes,
        comparisonsRes,
        anomaliesRes,
        alertsRes,
        metersRes,
      ] = await Promise.all([
        fetch(`/api/analytics/usage${meterQuery}`),
        fetch(`/api/analytics/costs${meterQuery}`),
        fetch(`/api/forecast/bill${meterQuery}`),
        fetch(`/api/budget/monitor${meterQuery}`),
        fetch(`/api/analytics/comparisons${meterQuery}`),
        fetch(`/api/analytics/anomalies${meterQuery}`),
        fetch(`/api/alerts/feed${alertsQuery}`),
        fetch("/api/meters"),
      ]);

      if (usageRes.ok) {
        const usagePayload = await usageRes.json();
        setUsageData({
          monthToDateUsage: usagePayload?.data?.mtd?.usage_kwh ?? 0,
          monthToDateCost: usagePayload?.data?.mtd?.cost_pkr ?? 0,
          usageChangePct:
            usagePayload?.data?.mtd?.vs_prev_same_period?.pct_kwh ?? 0,
          costChangePct:
            usagePayload?.data?.mtd?.vs_prev_same_period?.pct_cost ?? 0,
          efficiencyScore: usagePayload?.data?.mtd?.efficiency_score ?? 0,
          efficiencyChange:
            usagePayload?.data?.mtd?.vs_prev_same_period?.pct_efficiency ?? 0,
          timeframeLabels: usagePayload?.data?.timeframeLabels ?? {},
          weeklyBreakdown: usagePayload?.data?.weeklyBreakdown ?? [],
        });
      } else {
        setUsageData(null);
      }

      const costPayload = costRes.ok ? await costRes.json() : null;
      const costInsights = Array.isArray(costPayload?.data?.insights)
        ? costPayload.data.insights
        : [];

      if (forecastRes.ok) {
        const forecastPayload = await forecastRes.json();
        setForecastData(forecastPayload?.data ?? null);
      } else {
        setForecastData(null);
      }

      if (budgetRes.ok) {
        const budgetPayload = await budgetRes.json();
        setBudgetData(budgetPayload?.data ?? null);
      } else {
        setBudgetData(null);
      }

      if (comparisonsRes.ok) {
        const comparisonsPayload = await comparisonsRes.json();
        const comparisons = comparisonsPayload?.data?.comparisons;
        setComparisonItems(
          Array.isArray(comparisons)
            ? comparisons
            : comparisons
              ? [comparisons]
              : [],
        );
        setInsights(
          [
            ...(comparisonsPayload?.data?.insights || []),
            ...costInsights,
          ].slice(0, 8),
        );
      } else {
        setComparisonItems([]);
        setInsights(costInsights);
      }

      if (anomaliesRes.ok) {
        const anomaliesPayload = await anomaliesRes.json();
        setAnomalies(
          Array.isArray(anomaliesPayload?.data?.anomalies)
            ? anomaliesPayload.data.anomalies
            : [],
        );
      } else {
        setAnomalies([]);
      }

      if (alertsRes.ok) {
        const alertsPayload = await alertsRes.json();
        setAlertFeed(
          Array.isArray(alertsPayload?.data?.alerts)
            ? alertsPayload.data.alerts
            : [],
        );
      } else {
        setAlertFeed([]);
      }

      if (metersRes.ok) {
        const metersPayload = await metersRes.json();
        const nextMeters = Array.isArray(metersPayload?.meters)
          ? metersPayload.meters.map((meter: any) => ({
              id: meter.id,
              label: meter.label,
            }))
          : [];
        setMeters(nextMeters);
      } else {
        setMeters([]);
      }
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
      setUsageData(null);
      setForecastData(null);
      setBudgetData(null);
      setComparisonItems([]);
      setInsights([]);
      setAnomalies([]);
      setAlertFeed([]);
      setMeters([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
  };

  const generateAiSuggestions = async () => {
    try {
      setAiGenerating(true);
      const body: {
        includeAppliances: boolean;
        meterId?: string;
        budget?: number;
      } = { includeAppliances: true };
      if (selectedMeter !== "all") body.meterId = selectedMeter;
      const budgetTarget = Number(budgetData?.budget?.target || 0);
      if (budgetTarget > 0) body.budget = budgetTarget;

      const response = await fetch("/api/optimization/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setAiPlan(null);
        return;
      }
      const payload = await response.json();
      setAiPlan(payload?.data?.optimization?.ai ?? null);
    } catch (error) {
      console.error("Failed to generate AI suggestions:", error);
      setAiPlan(null);
    } finally {
      setAiGenerating(false);
    }
  };

  const triggerAnomalyAction = async (
    anomalyId: string,
    action: "resolve" | "investigate",
  ) => {
    const key = `${action}:${anomalyId}`;
    try {
      setAnomalyActionLoading(key);
      const response = await fetch("/api/analytics/anomalies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anomalyId, action }),
      });
      if (response.ok) await fetchAnalyticsData();
    } catch (error) {
      console.error("Failed to update anomaly status:", error);
    } finally {
      setAnomalyActionLoading(null);
    }
  };

  useEffect(() => {
    setAiPlan(null);
    setLoading(true);
    void fetchAnalyticsData();
  }, [selectedMeter]);

  const weeklyChartData = useMemo(
    () =>
      (usageData?.weeklyBreakdown || []).map((week: any) => ({
        week: `W${week.week}`,
        usage: Number(week.usage || 0),
        cost: Number(week.cost || 0),
      })),
    [usageData],
  );

  const forecastChartData = useMemo(() => {
    const usage = forecastData?.forecast?.usage;
    const bill = forecastData?.forecast?.bill;
    if (!usage || !bill) return [];
    return [
      {
        name: "Low",
        usage: Number(usage.low || 0),
        cost: Number(bill.low || 0),
      },
      {
        name: "Expected",
        usage: Number(usage.expected || 0),
        cost: Number(bill.expected || 0),
      },
      {
        name: "High",
        usage: Number(usage.high || 0),
        cost: Number(bill.high || 0),
      },
    ];
  }, [forecastData]);

  const slabDistribution = useMemo(
    () =>
      (forecastData?.slabDistribution || []).map(
        (item: any, index: number) => ({
          ...item,
          color: slabColors[index % slabColors.length],
        }),
      ),
    [forecastData],
  );

  const budgetTarget = Number(budgetData?.budget?.target || 0);
  const budgetSpent = Number(budgetData?.budget?.spent || 0);
  const budgetProjected = Number(budgetData?.budget?.projected || 0);
  const hasBudget = budgetTarget > 0;
  const budgetSpentPct = hasBudget
    ? Math.min(100, (budgetSpent / budgetTarget) * 100)
    : 0;
  const budgetProjectedPct = hasBudget
    ? Math.min(100, (budgetProjected / budgetTarget) * 100)
    : 0;
  const forecastOverBudget = hasBudget && budgetProjected > budgetTarget;
  const forecastAtRisk =
    hasBudget && !forecastOverBudget && budgetProjected > budgetTarget * 0.9;

  const tabs: Array<{
    id: TabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "forecast", label: "Forecast", icon: TrendingUp },
    { id: "budget", label: "Budget", icon: Target },
    { id: "anomalies", label: "Anomalies", icon: AlertTriangle },
    { id: "insights", label: "Insights", icon: Brain },
  ];

  const aiRecommendations = Array.isArray(aiPlan?.recommendations)
    ? aiPlan.recommendations
    : [];
  const aiWarnings = Array.isArray(aiPlan?.warnings) ? aiPlan.warnings : [];

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
                Loading analytics...
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
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-primary/15 blur-[140px]" />
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
                    Analytics
                  </p>
                  <h1 className="font-sora text-3xl font-bold md:text-4xl">
                    Usage Intelligence
                  </h1>
                  <p className="max-w-2xl text-sm text-foreground-secondary md:text-base">
                    Cleaner trend, forecast, budget, anomaly, and AI insight
                    flows without duplicated sections.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5">
                    <select
                      value={selectedMeter}
                      onChange={(e) => setSelectedMeter(e.target.value)}
                      className="bg-transparent text-sm outline-none"
                    >
                      <option
                        value="all"
                        className="bg-background text-foreground"
                      >
                        All Meters
                      </option>
                      {meters.map((meter) => (
                        <option
                          key={meter.id}
                          value={meter.id}
                          className="bg-background text-foreground"
                        >
                          {meter.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void refreshData()}
                    disabled={refreshing}
                    className="border-white/15 bg-white/[0.03] text-foreground"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                  <Button
                    onClick={() => void generateAiSuggestions()}
                    disabled={aiGenerating}
                  >
                    <Brain className="h-4 w-4" />
                    {aiGenerating ? "Generating..." : "Generate AI"}
                  </Button>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: "Usage MTD",
                  value: `${Math.round(usageData?.monthToDateUsage || 0).toLocaleString()} kWh`,
                  delta: Number(usageData?.usageChangePct || 0),
                  icon: Zap,
                },
                {
                  title: "Cost MTD",
                  value: `Rs ${Math.round(usageData?.monthToDateCost || 0).toLocaleString()}`,
                  delta: Number(usageData?.costChangePct || 0),
                  icon: DollarSign,
                },
                {
                  title: "Forecast Bill",
                  value: `Rs ${Math.round(forecastData?.forecast?.bill?.expected || 0).toLocaleString()}`,
                  delta: Number(forecastData?.comparison?.vsLastMonth || 0),
                  icon: TrendingUp,
                },
                {
                  title: "Efficiency",
                  value: `${Math.round(usageData?.efficiencyScore || 0)}%`,
                  delta: Number(usageData?.efficiencyChange || 0),
                  icon: Target,
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
                      <p
                        className={`mt-2 text-sm font-semibold ${deltaTone(metric.delta)}`}
                      >
                        {formatSignedPercent(metric.delta)}
                      </p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <metric.icon className="h-5 w-5 text-cyan-200" />
                    </span>
                  </div>
                </Card>
              ))}
            </section>

            {(forecastOverBudget || forecastAtRisk) && (
              <section className="rounded-3xl border border-red-500/25 bg-red-500/10 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-red-100">
                    {forecastOverBudget
                      ? `Forecast is above budget by Rs ${Math.round(budgetProjected - budgetTarget).toLocaleString()}.`
                      : "Forecast is near budget threshold."}
                  </p>
                  <Link
                    href="/optimization"
                    className="text-sm font-semibold text-red-100 underline-offset-4 hover:underline"
                  >
                    Open Optimization
                  </Link>
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-white/10 bg-[#0f1727]/75 p-2">
              <div className="flex flex-wrap gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition ${activeTab === tab.id ? "bg-gradient-to-r from-cyan-400/25 to-primary/20 text-white" : "text-foreground-secondary hover:bg-white/5 hover:text-foreground"}`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>

            {activeTab === "overview" && (
              <section className="grid gap-6 xl:grid-cols-2">
                <Card className="border border-white/10 bg-[#0f1727]/75">
                  <h3 className="mb-4 font-sora text-xl font-semibold">
                    Weekly Trend
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#263246" />
                        <XAxis dataKey="week" stroke="#8a96a8" />
                        <YAxis yAxisId="usage" stroke="#8a96a8" />
                        <YAxis
                          yAxisId="cost"
                          orientation="right"
                          stroke="#8a96a8"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f1727",
                            border: "1px solid #2b3a52",
                            borderRadius: "12px",
                          }}
                        />
                        <Line
                          yAxisId="usage"
                          type="monotone"
                          dataKey="usage"
                          stroke="#00d4aa"
                          strokeWidth={2.5}
                        />
                        <Line
                          yAxisId="cost"
                          type="monotone"
                          dataKey="cost"
                          stroke="#f59e0b"
                          strokeWidth={2.5}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card className="border border-white/10 bg-[#0f1727]/75">
                  <h3 className="mb-4 font-sora text-xl font-semibold">
                    Slab Distribution
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={slabDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={4}
                          dataKey="units"
                        >
                          {slabDistribution.map((entry: any, index: number) => (
                            <Cell key={`slab-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f1727",
                            border: "1px solid #2b3a52",
                            borderRadius: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </section>
            )}

            {activeTab === "forecast" && (
              <section className="space-y-6">
                <Card className="border border-white/10 bg-[#0f1727]/75">
                  <h3 className="mb-4 font-sora text-xl font-semibold">
                    Scenario Model
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecastChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#263246" />
                        <XAxis dataKey="name" stroke="#8a96a8" />
                        <YAxis yAxisId="usage" stroke="#8a96a8" />
                        <YAxis
                          yAxisId="cost"
                          orientation="right"
                          stroke="#8a96a8"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f1727",
                            border: "1px solid #2b3a52",
                            borderRadius: "12px",
                          }}
                        />
                        <Bar
                          yAxisId="usage"
                          dataKey="usage"
                          fill="#00d4aa"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          yAxisId="cost"
                          dataKey="cost"
                          fill="#f59e0b"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <div className="grid gap-4 md:grid-cols-3">
                  {forecastChartData.map((scenario: any) => (
                    <Card
                      key={scenario.name}
                      className="border border-white/10 bg-[#0f1727]/75"
                    >
                      <p className="text-xs uppercase tracking-[0.16em] text-foreground-tertiary">
                        {scenario.name}
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {Math.round(scenario.usage).toLocaleString()} kWh
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        Rs {Math.round(scenario.cost).toLocaleString()}
                      </p>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "budget" && (
              <section className="space-y-6">
                {hasBudget ? (
                  <Card className="border border-white/10 bg-[#0f1727]/75">
                    <div className="space-y-4">
                      <h3 className="font-sora text-lg font-semibold">
                        Budget Load
                      </h3>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-foreground-secondary">
                            Spent
                          </span>
                          <span>
                            Rs {Math.round(budgetSpent).toLocaleString()} / Rs{" "}
                            {Math.round(budgetTarget).toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-primary"
                            style={{ width: `${budgetSpentPct}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-foreground-secondary">
                            Projected
                          </span>
                          <span>
                            Rs {Math.round(budgetProjected).toLocaleString()} /
                            Rs {Math.round(budgetTarget).toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${forecastOverBudget ? "bg-gradient-to-r from-red-400 to-red-300" : forecastAtRisk ? "bg-gradient-to-r from-amber-300 to-orange-300" : "bg-gradient-to-r from-emerald-300 to-primary"}`}
                            style={{ width: `${budgetProjectedPct}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {(budgetData?.recommendations || [])
                          .slice(0, 4)
                          .map((item: string, index: number) => (
                            <div
                              key={`budget-rec-${index}`}
                              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-foreground-secondary"
                            >
                              {item}
                            </div>
                          ))}
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="border border-white/10 bg-[#0f1727]/75">
                    <p className="text-sm text-foreground-secondary">
                      No budget target configured. Set one from dashboard to
                      unlock budget analysis.
                    </p>
                  </Card>
                )}
              </section>
            )}

            {activeTab === "anomalies" && (
              <section className="space-y-3">
                {anomalies.length > 0 ? (
                  anomalies.map((anomaly: any) => (
                    <Card
                      key={anomaly.id}
                      className="border border-white/10 bg-[#0f1727]/75"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">
                            {anomaly.title}
                          </p>
                          <p className="text-sm text-foreground-secondary">
                            {anomaly.description}
                          </p>
                          <p className="text-xs text-foreground-tertiary">
                            Severity: {anomaly.severity}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              anomalyActionLoading ===
                              `investigate:${anomaly.id}`
                            }
                            onClick={() =>
                              void triggerAnomalyAction(
                                anomaly.id,
                                "investigate",
                              )
                            }
                          >
                            {anomalyActionLoading ===
                            `investigate:${anomaly.id}`
                              ? "Updating..."
                              : "Investigate"}
                          </Button>
                          {!anomaly.resolved && (
                            <Button
                              size="sm"
                              disabled={
                                anomalyActionLoading === `resolve:${anomaly.id}`
                              }
                              onClick={() =>
                                void triggerAnomalyAction(anomaly.id, "resolve")
                              }
                            >
                              {anomalyActionLoading === `resolve:${anomaly.id}`
                                ? "Updating..."
                                : "Resolve"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="border border-white/10 bg-[#0f1727]/75">
                    <p className="text-sm text-foreground-secondary">
                      No active anomalies for this filter.
                    </p>
                  </Card>
                )}
              </section>
            )}

            {activeTab === "insights" && (
              <section className="grid gap-6 xl:grid-cols-2">
                <Card className="border border-white/10 bg-[#0f1727]/75">
                  <h3 className="mb-4 font-sora text-lg font-semibold">
                    System Insights
                  </h3>
                  <div className="space-y-3">
                    {insights.length > 0 ? (
                      insights
                        .slice(0, 6)
                        .map((insight: any, index: number) => (
                          <article
                            key={`insight-${index}`}
                            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                          >
                            <div className="flex items-start gap-2">
                              {insight.type === "warning" ||
                              insight.type === "critical" ? (
                                <AlertTriangle className="h-4 w-4 text-amber-300" />
                              ) : insight.type === "success" ? (
                                <CheckCircle className="h-4 w-4 text-emerald-300" />
                              ) : (
                                <Lightbulb className="h-4 w-4 text-cyan-300" />
                              )}
                              <div>
                                <p className="text-sm font-semibold">
                                  {insight.title}
                                </p>
                                <p className="text-sm text-foreground-secondary">
                                  {insight.message}
                                </p>
                              </div>
                            </div>
                          </article>
                        ))
                    ) : (
                      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-foreground-secondary">
                        Insights will appear as more data arrives.
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="border border-white/10 bg-[#0f1727]/75">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-sora text-lg font-semibold">
                      AI Recommendations
                    </h3>
                    <Button
                      onClick={() => void generateAiSuggestions()}
                      disabled={aiGenerating}
                    >
                      <Sparkles className="h-4 w-4" />
                      {aiGenerating ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {aiWarnings
                      .slice(0, 2)
                      .map((warning: any, index: number) => (
                        <div
                          key={`ai-warning-${index}`}
                          className={`rounded-xl border p-3 ${alertTone(warning.severity)}`}
                        >
                          <p className="text-sm font-semibold">
                            {warning.title}
                          </p>
                          <p className="text-sm">{warning.message}</p>
                        </div>
                      ))}
                    {aiRecommendations.length > 0 ? (
                      aiRecommendations
                        .slice(0, 4)
                        .map((recommendation: any, index: number) => (
                          <article
                            key={
                              recommendation.id ||
                              `${recommendation.title}-${index}`
                            }
                            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                          >
                            <p className="text-sm font-semibold">
                              {recommendation.title}
                            </p>
                            <p className="text-sm text-foreground-secondary">
                              {recommendation.reason}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-emerald-300">
                              Rs{" "}
                              {Math.round(
                                Number(recommendation.estimatedSavingsPkr || 0),
                              ).toLocaleString()}
                              /month
                            </p>
                          </article>
                        ))
                    ) : (
                      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-foreground-secondary">
                        Generate AI insights to get personalized actions.
                      </p>
                    )}
                  </div>
                </Card>
              </section>
            )}

            {alertFeed.length > 0 && (
              <section className="space-y-3">
                {alertFeed.slice(0, 3).map((alert: any) => (
                  <article
                    key={alert.id}
                    className={`rounded-2xl border p-4 ${alertTone(alert.severity)}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      <span className="rounded-full border border-current/30 px-2 py-0.5 text-[11px] uppercase">
                        {alert.severity}
                      </span>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnalyticsPage;
