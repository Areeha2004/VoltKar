"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import {
  Zap,
  TrendingUp,
  DollarSign,
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
  Clock
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SetBudgetModal from "../../components/budget/SetBudgetModal";
import { StatsBundle } from "@/lib/statsService";

const Dashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const name =
    session?.user?.name ??
    session?.user?.email?.split("@")[0] ??
    "User";

  const image = session?.user?.image;
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2);

  const [statsBundle, setStatsBundle] = useState<StatsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [recentReadings, setRecentReadings] = useState<any[]>([]);

  // Fetch unified stats bundle
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats/overview");
        if (response.ok) {
          const data = await response.json();
          setStatsBundle(data.data);
        }

        // Fetch recent readings for display
        const readingsResponse = await fetch("/api/readings?limit=5");
        if (readingsResponse.ok) {
          const readingsData = await readingsResponse.json();
          setRecentReadings(readingsData.readings || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchStats();
    }
  }, [session?.user?.id]);

  const handleBudgetSet = (budget: number) => {
    // Refresh dashboard stats to recalculate with new budget
    window.location.reload();
  };

  const getMetrics = () => {
    if (!statsBundle) {
      return [
        { title: 'Current Usage (MTD)', value: '0', unit: 'kWh', change: '0%', changeType: 'neutral', icon: Zap, gradient: 'from-accent-blue to-accent-purple' },
        { title: 'Forecast Bill (This Month)', value: '0', unit: 'PKR', change: '0%', changeType: 'neutral', icon: DollarSign, gradient: 'from-primary to-accent-cyan' },
        { title: 'Cost to Date (MTD)', value: '0', unit: 'PKR', change: '0%', changeType: 'neutral', icon: TrendingUp, gradient: 'from-accent-amber to-accent-pink' },
        { title: 'Efficiency Score (MTD)', value: '0', unit: '%', change: '0%', changeType: 'neutral', icon: Target, gradient: 'from-accent-emerald to-primary' }
      ]
    }

    return [
      {
        title: 'Current Usage (MTD) vs Last Month (same period)',
        value: statsBundle.mtd.usage_kwh.toString(),
        unit: 'kWh',
        change: `${statsBundle.mtd.vs_prev_same_period.pct_kwh > 0 ? '+' : ''}${statsBundle.mtd.vs_prev_same_period.pct_kwh}%`,
        changeType: statsBundle.mtd.vs_prev_same_period.pct_kwh > 0 ? 'increase' : 'decrease',
        icon: Zap,
        gradient: 'from-accent-blue to-accent-purple'
      },
      {
        title: 'Forecast Bill (This Month) vs Last Month (Full)',
        value: statsBundle.forecast.cost_pkr.toLocaleString(),
        unit: 'PKR',
        change: `${statsBundle.forecast.vs_prev_full.pct_cost > 0 ? '+' : ''}${statsBundle.forecast.vs_prev_full.pct_cost}%`,
        changeType: statsBundle.forecast.vs_prev_full.pct_cost > 0 ? 'increase' : 'decrease',
        icon: DollarSign,
        gradient: 'from-primary to-accent-cyan'
      },
      {
        title: 'Cost to Date (MTD) vs Last Month (same period)',
        value: statsBundle.mtd.cost_pkr.toLocaleString(),
        unit: 'PKR',
        change: `${statsBundle.mtd.vs_prev_same_period.pct_cost > 0 ? '+' : ''}${statsBundle.mtd.vs_prev_same_period.pct_cost}%`,
        changeType: statsBundle.mtd.vs_prev_same_period.pct_cost > 0 ? 'increase' : 'decrease',
        icon: TrendingUp,
        gradient: 'from-accent-amber to-accent-pink'
      },
      {
        title: 'Efficiency Score (MTD) vs Last Month (same period)',
        value: statsBundle.mtd.efficiency_score.toString(),
        unit: '%',
        change: `${statsBundle.mtd.vs_prev_same_period.pct_efficiency > 0 ? '+' : ''}${statsBundle.mtd.vs_prev_same_period.pct_efficiency}%`,
        changeType: statsBundle.mtd.vs_prev_same_period.pct_efficiency > 0 ? 'increase' : 'decrease',
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
                {!monthlyBudget && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBudgetModal(true)}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    <Wallet className="h-5 w-5 mr-2" />
                    Set Budget
                  </Button>
                )}
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

            {/* Budget Progress Card */}
            {statsBundle?.budget.monthly_pkr && (
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground font-sora">Budget Status</h3>
                        <p className="text-foreground-secondary">Rs {statsBundle.budget.monthly_pkr.toLocaleString()} monthly target</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statsBundle.budget.status === 'On Track' ? 'bg-primary/10 text-primary' :
                        statsBundle.budget.status === 'At Risk' ? 'bg-accent-amber/10 text-accent-amber' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {statsBundle.budget.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-xl bg-background-card/50">
                      <p className="text-sm text-foreground-secondary">Spent (MTD)</p>
                      <p className="text-lg font-bold text-foreground">Rs {statsBundle.mtd.cost_pkr.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-background-card/50">
                      <p className="text-sm text-foreground-secondary">Remaining</p>
                      <p className="text-lg font-bold text-primary">Rs {statsBundle.budget.remaining_to_budget_pkr.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-background-card/50">
                      <p className="text-sm text-foreground-secondary">Projected</p>
                      <p className={`text-lg font-bold ${statsBundle.budget.status === 'Over Budget' ? 'text-red-400' : 'text-foreground'}`}>
                        Rs {statsBundle.forecast.cost_pkr.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* No Budget Set Alert */}
            {!statsBundle?.budget.monthly_pkr && (
              <Card className="card-premium border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-accent-cyan/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-primary to-accent-cyan p-3 rounded-2xl">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Set Your Monthly Budget</h3>
                      <p className="text-foreground-secondary">
                        Track your electricity spending and get alerts when approaching your limit
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="premium-button"
                    onClick={() => setShowBudgetModal(true)}
                  >
                    <Target className="h-5 w-5 mr-2" />
                    Set Budget
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Weekly Usage Breakdown */}
              {statsBundle && (
                <div className="lg:col-span-2">
                  <Card className="card-premium">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-foreground font-sora">Current Month Progress</h2>
                          <p className="text-foreground-secondary text-sm">{statsBundle.timeframeLabels.mtd} - {statsBundle.window.daysElapsed} of {statsBundle.window.daysInMonth} days</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-xl bg-background-card/50">
                          <p className="text-sm text-foreground-secondary">MTD Usage</p>
                          <p className="text-xl font-bold text-foreground">{statsBundle.mtd.usage_kwh} kWh</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-background-card/50">
                          <p className="text-sm text-foreground-secondary">MTD Cost</p>
                          <p className="text-xl font-bold text-primary">Rs {statsBundle.mtd.cost_pkr.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-background-card/50">
                          <p className="text-sm text-foreground-secondary">Efficiency Score</p>
                          <p className="text-xl font-bold text-foreground">{statsBundle.mtd.efficiency_score}%</p>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-background-card/50 to-background-secondary/50 border border-border/50">
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Forecast Method: {statsBundle.forecast.method.replace('_', ' ')}</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Projected Usage:</span>
                              <span className="font-semibold text-foreground">{statsBundle.forecast.usage_kwh} kWh</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Projected Cost:</span>
                              <span className="font-semibold text-primary">Rs {statsBundle.forecast.cost_pkr.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Forecast Card */}
              <div className={statsBundle?.mtd.usage_kwh > 0 ? "" : "lg:col-span-2"}>
                <ForecastCard />
              </div>

              {/* Smart Alerts Panel */}
              <div className={statsBundle?.mtd.usage_kwh > 0 ? "" : "lg:col-span-2"}>
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
                      {/* Data Quality Warnings */}
                      {statsBundle?.data_quality.warnings.map((warning, index) => (
                        <div key={`budget-${index}`} className={`flex items-start space-x-4 p-6 rounded-2xl bg-background-card/50 backdrop-blur-sm border-l-4 ${
                          'border-l-accent-amber'
                        } animate-fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="flex-shrink-0 mt-1">
                            <AlertTriangle className="h-5 w-5 text-accent-amber" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold text-foreground text-lg">Data Quality Alert</h3>
                            <p className="text-foreground-secondary leading-relaxed">{warning}</p>
                            <p className="text-foreground-muted text-sm">System Health</p>
                          </div>
                        </div>
                      ))}

                      {/* Budget Status Alert */}
                      {statsBundle?.budget.status !== 'On Track' && (
                        <div className={`flex items-start space-x-4 p-6 rounded-2xl bg-background-card/50 backdrop-blur-sm border-l-4 ${
                          statsBundle.budget.status === 'Over Budget' ? 'border-l-red-500' : 'border-l-accent-amber'
                        } animate-fade-in`}>
                          <div className="flex-shrink-0 mt-1">
                            {statsBundle.budget.status === 'Over Budget' ? 
                              <AlertTriangle className="h-5 w-5 text-red-500" /> :
                              <AlertTriangle className="h-5 w-5 text-accent-amber" />
                            }
                          </div>
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold text-foreground text-lg">Budget {statsBundle.budget.status}</h3>
                            <p className="text-foreground-secondary leading-relaxed">
                              {statsBundle.budget.status === 'Over Budget' 
                                ? `Projected to exceed budget by Rs ${statsBundle.budget.projected_overrun_pkr.toLocaleString()}`
                                : `Approaching budget limit - projected Rs ${statsBundle.forecast.cost_pkr.toLocaleString()}`
                              }
                            </p>
                            <p className="text-foreground-muted text-sm">Budget Analysis</p>
                          </div>
                        </div>
                      )}
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

            {/* Budget Monitor Card */}
            {statsBundle?.budget.monthly_pkr && (
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground font-sora">Budget Monitor</h2>
                      <p className="text-foreground-secondary">Real-time tracking vs target</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground-secondary">Monthly Progress</span>
                      <span className="font-medium text-foreground">
                        {statsBundle.budget.mtd_vs_budget.pct_used.toFixed(1)}% used
                      </span>
                    </div>
                    
                    <div className="relative">
                      <div className="w-full bg-background-secondary rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            statsBundle.budget.status === 'Over Budget' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            statsBundle.budget.status === 'At Risk' ? 'bg-gradient-to-r from-accent-amber to-red-500' :
                            'bg-gradient-to-r from-primary to-accent-cyan'
                          }`}
                          style={{ width: `${Math.min(statsBundle.budget.mtd_vs_budget.pct_used, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

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
                      {recentReadings.map((reading: any, index: number) => (
                        <tr key={index} className="border-t border-border/30 hover:bg-background-card/30 transition-colors">
                          <td className="py-4 px-6 text-foreground font-mono">{reading.date}</td>
                          <td className="py-4 px-6 text-foreground">{reading.meter?.label || 'Unknown'}</td>
                          <td className="py-4 px-6 text-foreground">
                            <span className="px-2 py-1 rounded-full text-xs bg-background-card text-foreground-secondary">
                              Week {reading.week || 1}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-foreground font-mono">{reading.reading?.toLocaleString() || '0'}</td>
                          <td className="py-4 px-6 text-foreground font-mono">{reading.usage} kWh</td>
                          <td className="py-4 px-6 text-primary font-mono font-semibold">Rs {(reading.estimatedCost || 0).toLocaleString()}</td>
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
          </div>
        </main>
      </div>

      {/* Budget Modal */}
      <SetBudgetModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onBudgetSet={handleBudgetSet}
        currentBudget={monthlyBudget || undefined}
      />
    </div>
  )
}

// Forecast Card Component
const ForecastCard: React.FC = () => {
  const [statsBundle, setStatsBundle] = useState<StatsBundle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const response = await fetch('/api/stats/overview')
        if (response.ok) {
          const data = await response.json()
          setStatsBundle(data.data)
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

  if (!statsBundle) return null

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
            <p className="text-3xl font-bold text-foreground font-mono">{statsBundle.forecast.usage_kwh}</p>
            <p className="text-xs text-foreground-tertiary">kWh this month</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-accent-amber/10 to-accent-pink/10 border border-accent-amber/20">
            <p className="text-sm text-foreground-secondary mb-2">Expected Bill</p>
            <p className="text-3xl font-bold text-primary font-mono">Rs {statsBundle.forecast.cost_pkr.toLocaleString()}</p>
            <p className="text-xs text-foreground-tertiary">projected total</p>
          </div>
        </div>

        {statsBundle.forecast.vs_prev_full.pct_cost !== 0 && (
          <div className="text-center p-3 rounded-xl bg-background-card/30">
            <p className="text-sm text-foreground-secondary">vs Last Month: 
              <span className={`ml-2 font-semibold ${statsBundle.forecast.vs_prev_full.pct_cost > 0 ? 'text-accent-amber' : 'text-primary'}`}>
                {statsBundle.forecast.vs_prev_full.pct_cost > 0 ? '+' : ''}{statsBundle.forecast.vs_prev_full.pct_cost}%
              </span>
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

export default Dashboard