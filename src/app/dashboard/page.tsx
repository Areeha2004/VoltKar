"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  Lightbulb
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SlabProgressIndicator from "../../components/readings/SlabProgressIndicator";
import SlabWarningAlert from "../../components/ui/SlabWarningAlert";
import SetBudgetButton from "../../components/ui/SetBudgetButton";

import { generateUsageInsights } from "../../lib/insights";
import { MonthlyBreakdown, Reading } from "@/lib/analytics";

interface DashboardProps {
  breakdown: MonthlyBreakdown;
  readings: Reading[];
}
localStorage.removeItem("monthlyBudgetKwh");

const Dashboard: React.FC<DashboardProps> = ({ breakdown, readings }) => {
  const { data: session, status } = useSession();
  const name =
    session?.user?.name ??
    session?.user?.email?.split("@")[0] ??
    "User";

  const image = session?.user?.image;
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2);

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [costInsights, setCostInsights] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  // Compute insights once breakdown + readings are available
  useEffect(() => {
    if (breakdown && readings) {
      const targetKwh = Number(localStorage.getItem("monthlyBudgetKwh")) || undefined;
      setInsights(generateUsageInsights(breakdown, readings, targetKwh));
    }
  }, [breakdown, readings]);

  const showSetBudget = insights.some((i) => i.id === "set-budget-tip");

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setDashboardStats(data);
          setAlerts(data.alerts || []);
        }

        // Fetch cost insights for mini cards
        const costResponse = await fetch("/api/analytics/costs");
        if (costResponse.ok) {
          const costData = await costResponse.json();
          setCostInsights(costData.data.insights?.slice(0, 2) || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchDashboardStats();
    }
  }, [session?.user?.id]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics/usage");
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };

    if (session?.user?.id) {
      fetchAnalytics();
    }
  }, [session?.user?.id]);



  const getMetrics = () => {
    if (!dashboardStats) {
      return [
        { title: 'Current Usage', value: '0', unit: 'kWh', change: '0%', changeType: 'neutral', icon: Zap, gradient: 'from-accent-blue to-accent-purple' },
        { title: 'Forecast Bill', value: '0', unit: 'PKR', change: '0%', changeType: 'neutral', icon: DollarSign, gradient: 'from-primary to-accent-cyan' },
        { title: 'Cost to Date', value: '0', unit: 'PKR', change: '0%', changeType: 'neutral', icon: TrendingUp, gradient: 'from-accent-amber to-accent-pink' },
        { title: 'Efficiency Score', value: '0', unit: '%', change: '0%', changeType: 'neutral', icon: Target, gradient: 'from-accent-emerald to-primary' }
      ]
    }

    return [
    {
      title: 'Current Usage',
      value: dashboardStats.stats.currentUsage.toString(),
      unit: 'kWh',
      change: dashboardStats.stats.usageChange,
      changeType: dashboardStats.stats.usageChange.startsWith('+') ? 'increase' : 'decrease',
      icon: Zap,
      gradient: 'from-accent-blue to-accent-purple'
    },
    {
      title: 'Forecast Bill',
      value: dashboardStats.stats.forecastBill.toLocaleString(),
      unit: 'PKR',
      change: dashboardStats.stats.costChange,
      changeType: dashboardStats.stats.usageChange.startsWith('+') ? 'increase' : 'decrease',
      icon: DollarSign,
      gradient: 'from-primary to-accent-cyan'
    },
    {
      title: 'Cost to Date',
      value: dashboardStats.stats.costToDate.toLocaleString(),
      unit: 'PKR',
      change: dashboardStats.stats.costChange,
      changeType: dashboardStats.stats.usageChange.startsWith('+') ? 'increase' : 'decrease',
      icon: TrendingUp,
      gradient: 'from-accent-amber to-accent-pink'
    },
    {
      title: 'Efficiency Score',
      value: dashboardStats.stats.efficiencyScore.toString(),
      unit: '%',
      change: '+12%',
      changeType: 'decrease',
      icon: Target,
      gradient: 'from-accent-emerald to-primary'
    }
    ]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-background-card rounded w-1/3"></div>
                <div className="grid md:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-background-card rounded-2xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const recentReadings = [
    { date: '2024-01-15', meter: 'Main House', reading: 15420, usage: 180, cost: 3200 },
    { date: '2024-01-10', meter: 'Main House', reading: 15240, usage: 165, cost: 2950 },
    { date: '2024-01-05', meter: 'Guest House', reading: 8750, usage: 95, cost: 1700 },
  ]

  const quickActions = [
    { icon: Plus, label: 'Enter Reading', href: '/readings', color: 'from-primary to-accent-cyan' },
    { icon: TrendingUp, label: 'View Analytics', href: '/analytics', color: 'from-accent-blue to-accent-purple' },
    { icon: Settings, label: 'Manage Devices', href: '/devices', color: 'from-accent-amber to-accent-pink' },
    { icon: Target, label: 'Start Challenge', href: '/challenges', color: 'from-accent-emerald to-primary' }
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-accent-amber" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-primary" />
      case 'info':
        return <Info className="h-5 w-5 text-accent-blue" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getAlertBorder = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-accent-amber'
      case 'medium': return 'border-l-4 border-l-primary'
      case 'low': return 'border-l-4 border-l-accent-blue'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-30" />
      
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-foreground font-sora">
                  Good morning, <span className="gradient-text">{name}</span>
                </h1>
                <p className="text-xl text-foreground-secondary">Here's your electricity overview for today</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button  className="premium-button h-13">
                  <Plus className="h-4 w-5 mr-2" />
                  Enter Reading
                </Button>
                <Button variant="outline" size="md">
                  <Settings className="h-5 w-5 mr-2" />
                  Optimize
                </Button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getMetrics().map((metric, index) => (
                <Card key={index} className="card-premium animate-fade-in"><div style={{ animationDelay: `${index * 0.1}s` }}>
                   <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-r ${metric.gradient} rounded-2xl blur-xl opacity-20`} />
                        <div className={`relative bg-gradient-to-r ${metric.gradient} p-3 rounded-2xl`}>
                          <metric.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className={`flex items-center space-x-1 text-sm font-medium ${
                        metric.changeType === 'decrease' ? 'text-primary' : 'text-accent-amber'
                      }`}>
                        {metric.changeType === 'decrease' ? 
                          <ArrowDown className="h-4 w-4" /> : 
                          <ArrowUp className="h-4 w-4" />
                        }
                        <span>{metric.change}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-foreground-secondary text-sm font-medium">{metric.title}</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-foreground font-mono">{metric.value}</span>
                        <span className="text-foreground-tertiary text-sm">{metric.unit}</span>
                      </div>
                      <p className="text-xs text-foreground-muted">vs last month</p>
                    </div>
                  </div>
                  </div>
                 
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Slab Warning Alert */}
              {dashboardStats?.stats.hasSlabWarnings && (
                <div className="lg:col-span-3">
                  <SlabWarningAlert 
                    units={dashboardStats.stats.currentUsage} 
                    showSuggestions={true}
                  />
                </div>
              )}

              {/* Slab Progress Indicator */}
              {analyticsData && (
                <div className="lg:col-span-2">
                  <Card className="card-premium">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-foreground font-sora">Weekly Usage Breakdown</h2>
                          <p className="text-foreground-secondary text-sm">Current month progress</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-4">
                        {analyticsData.weeklyBreakdown.map((week: any, index: number) => (
                          <div key={week.week} className="text-center p-4 rounded-2xl bg-background-card/30 border border-border/30">
                            <div className="space-y-2">
                              <p className="text-sm text-foreground-secondary">Week {week.week}</p>
                              <p className="text-2xl font-bold text-foreground font-mono">{week.usage}</p>
                              <p className="text-xs text-foreground-tertiary">kWh</p>
                              <div className="pt-2 border-t border-border/30">
                                <p className="text-sm font-semibold text-primary">Rs {Math.round(week.cost).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
                        <div className="text-center p-3 rounded-xl bg-background-card/50">
                          <p className="text-sm text-foreground-secondary">MTD Usage</p>
                          <p className="text-xl font-bold text-foreground">{analyticsData.monthToDateUsage} kWh</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-background-card/50">
                          <p className="text-sm text-foreground-secondary">MTD Cost</p>
                          <p className="text-xl font-bold text-primary">Rs {Math.round(analyticsData.monthToDateCost).toLocaleString()}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-background-card/50">
                          <p className="text-sm text-foreground-secondary">Daily Avg</p>
                          <p className="text-xl font-bold text-foreground">{analyticsData.averageDailyUsage} kWh</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Forecast Card */}
              <ForecastCard />

              {/* Original Slab Progress Indicator */}
              {dashboardStats?.stats.currentUsage > 0 && (
                <div className="lg:col-span-2">
                  <SlabProgressIndicator 
                    currentUnits={dashboardStats.stats.currentUsage}
                    projectedUnits={dashboardStats.stats.projectedMonthlyUsage || dashboardStats.stats.currentUsage * 4}
                  />
                </div>
              )}

              {/* Alerts Panel - Adjust column span based on analytics data */}
              <div className={dashboardStats?.stats.currentUsage > 0 ? "" : "lg:col-span-2"}>
                <Card className="card-premium">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-2 rounded-xl">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground font-sora">Smart Alerts</h2>
                      </div>
                      <Button variant="ghost" size="sm">View All</Button>
                    </div>
                    
                    <div className="space-y-4">
                      {alerts.map((alert, index) => (
                        <div key={index} className={`flex items-start space-x-4 p-6 rounded-2xl bg-background-card/50 backdrop-blur-sm ${getAlertBorder(alert.priority)} animate-fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="flex-shrink-0 mt-1">
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold text-foreground text-lg">{alert.title}</h3>
                            <p className="text-foreground-secondary leading-relaxed">{alert.message}</p>
                            <p className="text-foreground-muted text-sm">{alert.time}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Cost Insights Mini Cards */}
                      {costInsights.map((insight, index) => (
                        <div key={`cost-${index}`} className={`flex items-start space-x-4 p-6 rounded-2xl bg-background-card/50 backdrop-blur-sm border-l-4 ${
                          insight.type === 'warning' ? 'border-l-accent-amber' :
                          insight.type === 'success' ? 'border-l-primary' :
                          'border-l-accent-blue'
                        } animate-fade-in`} style={{ animationDelay: `${(alerts.length + index) * 0.1}s` }}>
                          <div className="flex-shrink-0 mt-1">
                            {insight.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-accent-amber" /> :
                             insight.type === 'success' ? <CheckCircle className="h-5 w-5 text-primary" /> :
                             <Info className="h-5 w-5 text-accent-blue" />}
                          </div>
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold text-foreground text-lg">{insight.title}</h3>
                            <p className="text-foreground-secondary leading-relaxed">{insight.message}</p>
                            {insight.impact && (
                              <p className="text-primary text-sm font-medium">{insight.impact}</p>
                            )}
                            <p className="text-foreground-muted text-sm">Cost Analysis</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Quick Actions</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-background-card/30 hover:bg-background-card/60 border border-border/50 hover:border-border-light transition-all duration-300 group animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className={`bg-gradient-to-r ${action.color} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-medium text-foreground text-lg">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Readings */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Recent Readings</h2>
                  </div>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                
                <div className="overflow-hidden rounded-2xl border border-border/50">
                  <table className="w-full">
                    <thead className="bg-background-card/50">
                      <tr>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Date</th>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Meter</th>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Week</th>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Reading</th>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Usage</th>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Cost</th>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboardStats?.recentReadings || recentReadings).map((reading: any, index: number) => (
                        <tr key={index} className="border-t border-border/30 hover:bg-background-card/30 transition-colors">
                          <td className="py-4 px-6 text-foreground font-mono">{reading.date}</td>
                          <td className="py-4 px-6 text-foreground">{reading.meter}</td>
                          <td className="py-4 px-6 text-foreground">
                            <span className="px-2 py-1 rounded-full text-xs bg-background-card text-foreground-secondary">
                              Week {reading.week || 1}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-foreground font-mono">{reading.reading?.toLocaleString() || '0'}</td>
                          <td className="py-4 px-6 text-foreground font-mono">{reading.usage} kWh</td>
                          <td className="py-4 px-6 text-primary font-mono font-semibold">Rs {(reading.cost || reading.estimatedCost || 0).toLocaleString()}</td>
                          <td className="py-4 px-6">
                            {reading.isOfficialEndOfMonth ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium">
                                Official
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs bg-background-card text-foreground-secondary">
                                Weekly
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
            <div>
  {insights.map((insight) => (
        <div key={insight.id}>{insight.title}</div>
      ))}

      {showSetBudget && <SetBudgetButton />}
</div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Forecast Card Component
const ForecastCard: React.FC = () => {
  const [forecastData, setForecastData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const response = await fetch('/api/forecast/bill')
        if (response.ok) {
          const data = await response.json()
          setForecastData(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch forecast:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()
  }, [])

  if (loading) {
    return (
      <Card className="card-premium">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-background-card rounded w-1/2"></div>
          <div className="h-8 bg-background-card rounded w-1/3"></div>
        </div>
      </Card>
    )
  }

  if (!forecastData) return null

  return (
    <Card className="card-premium">
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-accent-emerald to-primary p-2 rounded-xl">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground font-sora">Monthly Forecast</h2>
            <p className="text-foreground-secondary text-sm">Projected bill & usage</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
            <p className="text-sm text-foreground-secondary mb-2">Expected Usage</p>
            <p className="text-3xl font-bold text-foreground font-mono">{forecastData.forecast.usage.expected}</p>
            <p className="text-xs text-foreground-tertiary">kWh this month</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-accent-amber/10 to-accent-pink/10 border border-accent-amber/20">
            <p className="text-sm text-foreground-secondary mb-2">Expected Bill</p>
            <p className="text-3xl font-bold text-primary font-mono">Rs {forecastData.forecast.bill.expected.toLocaleString()}</p>
            <p className="text-xs text-foreground-tertiary">projected total</p>
          </div>
        </div>

        {forecastData.comparison.vsLastMonth && (
          <div className="text-center p-3 rounded-xl bg-background-card/30">
            <p className="text-sm text-foreground-secondary">vs Last Month: 
              <span className={`ml-2 font-semibold ${forecastData.comparison.vsLastMonth > 0 ? 'text-accent-amber' : 'text-primary'}`}>
                {forecastData.comparison.vsLastMonth > 0 ? '+' : ''}{forecastData.comparison.vsLastMonth}%
              </span>
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

export default Dashboard