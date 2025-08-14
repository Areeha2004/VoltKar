'use client'
import React, { useState } from 'react'
import { useEffect } from 'react'
import { TrendingUp, Calendar, Download, Target, Zap, DollarSign, Activity, Brain, Sparkles, ArrowUp, ArrowDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { BarChart3 } from 'lucide-react'
const AnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState('monthly')
  const [forecastMonths, setForecastMonths] = useState(3)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [forecastData, setForecastData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Sample data for charts
  const usageData = [
    { month: 'Jan', usage: 450, cost: 8500, forecast: null, efficiency: 72 },
    { month: 'Feb', usage: 520, cost: 9800, forecast: null, efficiency: 68 },
    { month: 'Mar', usage: 480, cost: 9200, forecast: null, efficiency: 75 },
    { month: 'Apr', usage: 610, cost: 11500, forecast: null, efficiency: 71 },
    { month: 'May', usage: 750, cost: 14200, forecast: null, efficiency: 69 },
    { month: 'Jun', usage: 820, cost: 15800, forecast: null, efficiency: 78 },
    { month: 'Jul', usage: 890, cost: 17200, forecast: 920, efficiency: 82 },
    { month: 'Aug', usage: null, cost: null, forecast: 880, efficiency: null },
    { month: 'Sep', usage: null, cost: null, forecast: 760, efficiency: null },
  ]

  const dailyUsage = [
    { day: 'Mon', usage: 25, peak: 18, offPeak: 7 },
    { day: 'Tue', usage: 28, peak: 20, offPeak: 8 },
    { day: 'Wed', usage: 32, peak: 24, offPeak: 8 },
    { day: 'Thu', usage: 29, peak: 21, offPeak: 8 },
    { day: 'Fri', usage: 35, peak: 26, offPeak: 9 },
    { day: 'Sat', usage: 38, peak: 28, offPeak: 10 },
    { day: 'Sun', usage: 33, peak: 24, offPeak: 9 },
  ]

  const applianceUsage = [
    { name: 'Air Conditioner', usage: 45, color: '#3b82f6', trend: '+12%' },
    { name: 'Refrigerator', usage: 20, color: '#10b981', trend: '-3%' },
    { name: 'Lights', usage: 15, color: '#f59e0b', trend: '+5%' },
    { name: 'Water Heater', usage: 12, color: '#8b5cf6', trend: '-8%' },
    { name: 'Others', usage: 8, color: '#ec4899', trend: '+2%' },
  ]

  const comparisons = [
    { period: 'This Month vs Last Month', change: '+15%', type: 'increase', value: '890 kWh vs 774 kWh' },
    { period: 'This Year vs Last Year', change: '-8%', type: 'decrease', value: '6,820 kWh vs 7,413 kWh' },
    { period: 'vs Neighborhood Average', change: '+22%', type: 'increase', value: '890 kWh vs 729 kWh' },
  ]

  const insights = [
    {
      title: 'Peak Usage Optimization',
      description: 'Your AC usage during peak hours (6-10 PM) can be reduced by 25% with smart scheduling',
      impact: 'Save Rs 1,240/month',
      priority: 'high',
      icon: Brain
    },
    {
      title: 'Efficiency Improvement',
      description: 'Water heater efficiency dropped 12% this month. Consider maintenance or timer optimization',
      impact: 'Save Rs 680/month',
      priority: 'medium',
      icon: Target
    },
    {
      title: 'Load Balancing',
      description: 'Distribute high-power appliances across different time slots for better cost management',
      impact: 'Save Rs 420/month',
      priority: 'low',
      icon: Activity
    }
  ]

  // Fetch analytics and forecast data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch analytics data
        const analyticsResponse = await fetch('/api/analytics/usage')
        const forecastResponse = await fetch('/api/forecast/bill')
        
        if (analyticsResponse.ok) {
          const analyticsResult = await analyticsResponse.json()
          setAnalyticsData(analyticsResult.data)
        }
        
        if (forecastResponse.ok) {
          const forecastResult = await forecastResponse.json()
          setForecastData(forecastResult.data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Transform analytics data for charts
  const chartData = analyticsData ? analyticsData.weeklyBreakdown.map((week: any) => ({
    week: `Week ${week.week}`,
    usage: week.usage,
    cost: week.cost
  })) : usageData.slice(0, 5)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-accent-amber bg-accent-amber/5'
      case 'medium': return 'border-l-accent-blue bg-accent-blue/5'
      case 'low': return 'border-l-primary bg-primary/5'
      default: return 'border-l-border bg-background-secondary'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl text-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(0,212,170,0.1),transparent_50%)] pointer-events-none" />
      
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-3 rounded-2xl">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground font-sora">Usage Analytics</h1>
                    <p className="text-xl text-foreground-secondary">Advanced insights into your electricity consumption patterns</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-background-card/50 border border-border/50">
                  <Calendar className="h-4 w-4 text-foreground-secondary" />
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="bg-transparent text-foreground border-none outline-none"
                  >
                    <option value="daily">Daily View</option>
                    <option value="weekly">Weekly View</option>
                    <option value="monthly">Monthly View</option>
                    <option value="yearly">Yearly View</option>
                  </select>
                </div>
                <Button variant="outline" className="border-border-light hover:border-primary">
                  <Download className="h-5 w-5 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { 
                  title: 'Current Usage', 
                  value: analyticsData?.monthToDateUsage?.toString() || '0', 
                  unit: 'kWh', 
                  change: '+12%', 
                  changeType: 'increase',
                  icon: Zap,
                  gradient: 'from-accent-blue to-accent-purple',
                  description: 'This month'
                },
                { 
                  title: 'Projected Bill', 
                  value: forecastData?.forecast?.bill?.expected?.toLocaleString() || '0', 
                  unit: 'PKR', 
                  change: forecastData?.comparison?.vsLastMonth ? `${forecastData.comparison.vsLastMonth > 0 ? '+' : ''}${forecastData.comparison.vsLastMonth}%` : '0%', 
                  changeType: forecastData?.comparison?.vsLastMonth > 0 ? 'increase' : 'decrease',
                  icon: DollarSign,
                  gradient: 'from-primary to-accent-cyan',
                  description: 'Based on current usage'
                },
                { 
                  title: 'Efficiency Score', 
                  value: '82', 
                  unit: '%', 
                  change: '+5%', 
                  changeType: 'decrease',
                  icon: Target,
                  gradient: 'from-accent-emerald to-primary',
                  description: 'Above average'
                },
                { 
                  title: 'Cost per kWh', 
                  value: analyticsData?.metrics?.costPerKwh?.toString() || '0', 
                  unit: 'PKR', 
                  change: '-2%', 
                  changeType: 'decrease',
                  icon: Activity,
                  gradient: 'from-accent-amber to-accent-pink',
                  description: 'Optimized rate'
                }
              ].map((metric, index) => (
                <Card key={index} className="card-premium animate-fade-in" ><div style={{ animationDelay: `${index * 0.1}s` }}>
<div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-r ${metric.gradient} rounded-2xl blur-xl opacity-20`} />
                        <div className={`relative bg-gradient-to-r ${metric.gradient} p-4 rounded-2xl`}>
                          <metric.icon className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <div className={`flex items-center space-x-1 text-sm font-semibold px-3 py-1 rounded-full ${
                        metric.changeType === 'decrease' ? 'text-primary bg-primary/10' : 'text-accent-amber bg-accent-amber/10'
                      }`}>
                        {metric.changeType === 'decrease' ? 
                          <ArrowDown className="h-4 w-4" /> : 
                          <ArrowUp className="h-4 w-4" />
                        }
                        <span>{metric.change}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-foreground-secondary text-sm font-medium">{metric.title}</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-foreground font-mono">{metric.value}</span>
                        <span className="text-foreground-tertiary text-lg">{metric.unit}</span>
                      </div>
                      <p className="text-xs text-foreground-muted">{metric.description}</p>
                    </div>
                  </div>
                  </div>
                  
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Usage Trends Chart */}
              <div className="lg:col-span-2">
                <Card className="card-premium">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-foreground font-sora">Usage Trends & AI Forecast</h2>
                          <p className="text-foreground-secondary">Predictive analytics with machine learning insights</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-foreground-secondary">Forecast horizon:</span>
                          <input
                            type="range"
                            min="1"
                            max="6"
                            value={forecastMonths}
                            onChange={(e) => setForecastMonths(parseInt(e.target.value))}
                            className="w-24 accent-primary"
                          />
                          <span className="text-sm text-foreground font-medium">{forecastMonths}m</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="week" stroke="#a1a1aa" fontSize={12} />
                          <YAxis stroke="#a1a1aa" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0a0a0b', 
                              border: '1px solid #27272a',
                              borderRadius: '16px',
                              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="usage"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="url(#usageGradient)"
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{analyticsData?.daysElapsed || 0}</p>
                        <p className="text-sm text-foreground-secondary">Days Elapsed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent-blue">{forecastData?.forecast?.usage?.expected || 0}</p>
                        <p className="text-sm text-foreground-secondary">Projected Usage</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent-amber">94%</p>
                        <p className="text-sm text-foreground-secondary">Forecast Accuracy</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Real Analytics Data */}
              {analyticsData && (
                <Card className="card-premium">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground font-sora">Live Analytics</h2>
                        <p className="text-foreground-secondary text-sm">Real data from your readings</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-background-card/30">
                        <p className="text-sm text-foreground-secondary">Active Weeks</p>
                        <p className="text-2xl font-bold text-foreground">{analyticsData.metrics?.activeWeeks || 0}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-background-card/30">
                        <p className="text-sm text-foreground-secondary">Total Readings</p>
                        <p className="text-2xl font-bold text-foreground">{analyticsData.metrics?.totalReadings || 0}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* AI Insights */}
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-2 rounded-xl">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground font-sora">AI Insights</h2>
                      <p className="text-foreground-secondary text-sm">Smart recommendations</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <div key={index} className={`p-5 rounded-2xl border-l-4 ${getPriorityColor(insight.priority)} animate-fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-start space-x-3">
                          <insight.icon className="h-5 w-5 text-foreground mt-1" />
                          <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">{insight.title}</h3>
                            <p className="text-sm text-foreground-secondary leading-relaxed">{insight.description}</p>
                            <div className="flex items-center space-x-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-primary">{insight.impact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full">
                    <Brain className="h-4 w-4 mr-2" />
                    View All Recommendations
                  </Button>
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Daily Usage Pattern */}
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-2 rounded-xl">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground font-sora">Weekly Usage Pattern</h2>
                      <p className="text-foreground-secondary text-sm">Peak vs off-peak consumption</p>
                    </div>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyUsage}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} />
                        <YAxis stroke="#a1a1aa" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0a0a0b', 
                            border: '1px solid #27272a',
                            borderRadius: '12px'
                          }}
                        />
                        <Bar dataKey="peak" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="offPeak" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-accent-amber rounded-full" />
                      <span className="text-foreground-secondary">Peak Hours (6-10 PM)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      <span className="text-foreground-secondary">Off-Peak Hours</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Appliance Breakdown */}
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground font-sora">Appliance Breakdown</h2>
                      <p className="text-foreground-secondary text-sm">Usage distribution by device</p>
                    </div>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={applianceUsage}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={3}
                          dataKey="usage"
                        >
                          {applianceUsage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0a0a0b', 
                            border: '1px solid #27272a',
                            borderRadius: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-3">
                    {applianceUsage.map((appliance, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-background-card/30">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: appliance.color }}
                          />
                          <span className="text-foreground font-medium">{appliance.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-foreground font-semibold">{appliance.usage}%</span>
                          <span className={`text-sm font-medium ${
                            appliance.trend.startsWith('+') ? 'text-accent-amber' : 'text-primary'
                          }`}>
                            {appliance.trend}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Comparisons & Forecast */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Performance Analysis</h2>
                    <p className="text-foreground-secondary">Comparative insights and future projections</p>
                  </div>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Usage Comparisons</h3>
                    {comparisons.map((comparison, index) => (
                      <div key={index} className="flex items-center justify-between p-5 rounded-2xl bg-background-card/30 border border-border/30 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="space-y-1">
                          <span className="text-foreground font-medium">{comparison.period}</span>
                          <p className="text-sm text-foreground-secondary">{comparison.value}</p>
                        </div>
                        <div className={`flex items-center space-x-2 px-3 py-2 rounded-full font-semibold ${
                          comparison.type === 'decrease' ? 'text-primary bg-primary/10' : 'text-accent-amber bg-accent-amber/10'
                        }`}>
                          {comparison.type === 'decrease' ? 
                            <ArrowDown className="h-4 w-4" /> : 
                            <ArrowUp className="h-4 w-4" />
                          }
                          <span>{comparison.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-accent-blue/5 to-accent-purple/10 border border-primary/20">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">AI Forecast Summary</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Next Month Prediction:</span>
                          <span className="font-semibold text-foreground">920 kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Estimated Bill:</span>
                          <span className="font-semibold text-foreground">Rs 17,800</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Potential Savings:</span>
                          <span className="font-semibold text-primary">Rs 2,340</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-border/30">
                        <p className="text-sm text-foreground-secondary leading-relaxed">
                          Based on current trends and seasonal patterns, implementing our AI recommendations 
                          could reduce your next bill by up to 13% while maintaining comfort levels.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AnalyticsPage