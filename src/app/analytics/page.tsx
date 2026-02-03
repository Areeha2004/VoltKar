'use client'
import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Zap,
  Brain,
  Activity,
  Clock,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Filter,
  Download,
  Lightbulb,
  Sparkles
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('current-month')
  const [selectedMeter, setSelectedMeter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [usageData, setUsageData] = useState<any>(null)
  const [costData, setCostData] = useState<any>(null)
  const [forecastData, setForecastData] = useState<any>(null)
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [meters, setMeters] = useState<any[]>([])

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      const [usageRes, costRes, metersRes] = await Promise.all([
      fetch(`/api/analytics/usage${selectedMeter !== 'all' ? `?meterId=${selectedMeter}` : ''}`),
      fetch(`/api/analytics/costs${selectedMeter !== 'all' ? `?meterId=${selectedMeter}` : ''}`),
      fetch('/api/meters')
    ])

    if (usageRes.ok) {
      const usage = await usageRes.json()
      setUsageData(usage.data)
      // Forecast data is now embedded in stats bundle returned via usage/costs if we want
      // But let's map it from costData for consistency
    }

    if (costRes.ok) {
      const cost = await costRes.json()
      setCostData(cost.data)
      setForecastData({
        forecast: {
          usage: { expected: cost.data.breakdown.projectedUsage },
          bill: { expected: cost.data.costs.projectedCost }
        },
        comparison: { vsLastMonth: cost.data.comparison.vsLastMonth }
      })
      // setInsights(cost.data.insights || []) // Keep hardcoded as requested
    }

      if (metersRes.ok) {
        const metersData = await metersRes.json()
        setMeters(metersData.meters || [])
      }

      // Simulate anomaly detection
      setAnomalies([
        {
          id: 1,
          type: 'usage_spike',
          severity: 'medium',
          title: 'Unusual Usage Pattern',
          description: 'Week 3 usage was 40% higher than average',
          date: '2024-01-19',
          impact: 'Rs 420 extra cost',
          resolved: false
        },
        {
          id: 2,
          type: 'cost_anomaly',
          severity: 'low',
          title: 'Rate Calculation Variance',
          description: 'Minor discrepancy in slab calculation detected',
          date: '2024-01-15',
          impact: 'Rs 15 difference',
          resolved: true
        }
      ])

    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange, selectedMeter])

  // Chart data preparation
  const weeklyChartData = usageData?.weeklyBreakdown?.map((week: any) => ({
    week: `Week ${week.week}`,
    usage: week.usage,
    cost: week.cost,
    target: 60 // Example target
  })) || []

  const forecastChartData = forecastData?.forecast ? [
    { scenario: 'Low', usage: forecastData.forecast.usage?.low ?? 0, cost: forecastData.forecast.bill?.low ?? 0 },
    { scenario: 'Expected', usage: forecastData.forecast.usage?.expected ?? 0, cost: forecastData.forecast.bill?.expected ?? 0 },
    { scenario: 'High', usage: forecastData.forecast.usage?.high ?? 0, cost: forecastData.forecast.bill?.high ?? 0 }
  ] : []

  const slabDistributionData = costData?.costs ? [
    { name: 'MTD Usage', value: costData.breakdown?.totalUsage || usageData?.monthToDateUsage || 0, cost: costData.costs?.actualToDateCost || usageData?.monthToDateCost || 0, color: '#3b82f6' },
    { name: 'Remaining Projected', value: Math.max(0, (costData.breakdown?.projectedUsage || 0) - (costData.breakdown?.totalUsage || 0)), cost: Math.max(0, (costData.costs?.projectedCost || 0) - (costData.costs?.actualToDateCost || 0)), color: '#8b5cf6' },
  ].filter(item => item.value > 0) : []

  const getAnomalySeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-500 bg-red-500/5'
      case 'medium': return 'border-l-accent-amber bg-accent-amber/5'
      case 'low': return 'border-l-accent-blue bg-accent-blue/5'
      default: return 'border-l-border bg-background-secondary'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-accent-amber" />
      case 'success': return <CheckCircle className="h-5 w-5 text-primary" />
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />
      default: return <Lightbulb className="h-5 w-5 text-accent-blue" />
    }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
      
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
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground font-sora">Analytics & Forecasting</h1>
                    <p className="text-xl text-foreground-secondary">Deep insights into your electricity usage patterns and costs</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedMeter}
                  onChange={(e) => setSelectedMeter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Meters</option>
                  {meters.map(meter => (
                    <option key={meter.id} value={meter.id}>{meter.label}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={refreshData} disabled={refreshing}>
                  <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button variant="outline">
                  <Download className="h-5 w-5 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  title: 'MTD Usage',
                  value: usageData?.monthToDateUsage || 0,
                  unit: 'kWh',
                  change: comparisonData?.comparisons?.[0]?.percentageChange?.usage || 0,
                  icon: Zap,
                  gradient: 'from-primary to-accent-cyan'
                },
                {
                  title: 'MTD Cost',
                  value: Math.round(usageData?.monthToDateCost || 0),
                  unit: 'PKR',
                  change: comparisonData?.comparisons?.[0]?.percentageChange?.cost || 0,
                  icon: DollarSign,
                  gradient: 'from-accent-blue to-accent-purple'
                },
                {
                  title: 'Forecast Bill',
                  value: Math.round(forecastData?.forecast?.bill?.expected || usageData?.monthToDateCost || 0),
                  unit: 'PKR',
                  change: forecastData?.comparison?.vsLastMonth || 0,
                  icon: TrendingUp,
                  gradient: 'from-accent-amber to-accent-pink'
                },
                {
                  title: 'Efficiency Score',
                  value: 87,
                  unit: '%',
                  change: 12,
                  icon: Target,
                  gradient: 'from-accent-emerald to-primary'
                }
              ].map((metric, index) => (
                <Card key={index} className="card-premium animate-fade-in" ><div style={{ animationDelay: `${index * 0.1}s` }}>
                   <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-r ${metric.gradient} rounded-2xl blur-xl opacity-20`} />
                        <div className={`relative bg-gradient-to-r ${metric.gradient} p-3 rounded-2xl`}>
                          <metric.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className={`flex items-center space-x-1 text-sm font-medium ${
                        metric.change > 0 ? 'text-red-400' : 'text-primary'
                      }`}>
                        {metric.change > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        <span>{Math.abs(metric.change)}%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-foreground-secondary text-sm font-medium">{metric.title}</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-foreground font-mono">
                          {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                        </span>
                        <span className="text-foreground-tertiary text-sm">{metric.unit}</span>
                      </div>
                    </div>
                  </div>
                  </div>
                 
                </Card>
              ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-background-secondary p-1 rounded-xl">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
                { id: 'budget', label: 'Budget Analysis', icon: Target },
                { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
                { id: 'insights', label: 'Insights', icon: Brain }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Weekly Usage Trend */}
                <Card className="card-premium">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                          <Activity className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-foreground font-sora">Weekly Usage Trend</h2>
                          <p className="text-foreground-secondary">Current month breakdown</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-foreground-secondary">
                        <div className="w-3 h-3 bg-primary rounded-full" />
                        <span>Usage (kWh)</span>
                        <div className="w-3 h-3 bg-accent-amber rounded-full ml-4" />
                        <span>Cost (PKR)</span>
                      </div>
                    </div>
                    
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                          <XAxis dataKey="week" stroke="#6b6b7d" />
                          <YAxis yAxisId="usage" orientation="left" stroke="#6b6b7d" />
                          <YAxis yAxisId="cost" orientation="right" stroke="#6b6b7d" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#141417', 
                              border: '1px solid #2a2a30',
                              borderRadius: '12px',
                              color: '#ffffff'
                            }} 
                          />
                          <Line 
                            yAxisId="usage"
                            type="monotone" 
                            dataKey="usage" 
                            stroke="#00d4aa" 
                            strokeWidth={3}
                            dot={{ fill: '#00d4aa', strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8, stroke: '#00d4aa', strokeWidth: 2 }}
                          />
                          <Line 
                            yAxisId="cost"
                            type="monotone" 
                            dataKey="cost" 
                            stroke="#f59e0b" 
                            strokeWidth={3}
                            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8, stroke: '#f59e0b', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>

                {/* Cost Distribution */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <Card className="card-premium">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-2 rounded-xl">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground font-sora">Slab Distribution</h3>
                          <p className="text-foreground-secondary">Current month usage by tariff slab</p>
                        </div>
                      </div>
                      
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={slabDistributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {slabDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#141417', 
                                border: '1px solid #2a2a30',
                                borderRadius: '12px',
                                color: '#ffffff'
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="space-y-2">
                        {slabDistributionData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-background-card/30">
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-foreground">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">{item.value} kWh</p>
                              <p className="text-sm text-foreground-secondary">Rs {item.cost}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Efficiency Metrics */}
                  <Card className="card-premium">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-accent-emerald to-primary p-2 rounded-xl">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground font-sora">Efficiency Analysis</h3>
                          <p className="text-foreground-secondary">Performance vs targets</p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {[
                          { label: 'Overall Efficiency', value: 87, target: 85, color: 'primary' },
                          { label: 'Cost Efficiency', value: 92, target: 90, color: 'accent-blue' },
                          { label: 'Peak Avoidance', value: 78, target: 80, color: 'accent-amber' },
                          { label: 'Slab Optimization', value: 95, target: 85, color: 'accent-emerald' }
                        ].map((metric, index) => (
                          <div key={index} className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-foreground font-medium">{metric.label}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-foreground">{metric.value}%</span>
                                {metric.value >= metric.target ? (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5 text-accent-amber" />
                                )}
                              </div>
                            </div>
                            <div className="relative">
                              <div className="w-full bg-background-secondary rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    metric.value >= metric.target 
                                      ? 'bg-gradient-to-r from-primary to-accent-cyan' 
                                      : 'bg-gradient-to-r from-accent-amber to-red-500'
                                  }`}
                                  style={{ width: `${metric.value}%` }}
                                />
                              </div>
                              <div 
                                className="absolute top-1/2 transform -translate-y-1/2 w-1 h-4 bg-white border border-foreground-tertiary"
                                style={{ left: `${metric.target}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-foreground-tertiary">
                              <span>0%</span>
                              <span>Target: {metric.target}%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Forecasting Tab */}
            {activeTab === 'forecasting' && (
              <div className="space-y-8">
                {/* Forecast Scenarios */}
                <Card className="card-premium">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground font-sora">Monthly Forecast Scenarios</h2>
                        <p className="text-foreground-secondary">Projected usage and costs based on current patterns</p>
                      </div>
                    </div>
                    
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={forecastChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                          <XAxis dataKey="scenario" stroke="#6b6b7d" />
                          <YAxis yAxisId="usage" orientation="left" stroke="#6b6b7d" />
                          <YAxis yAxisId="cost" orientation="right" stroke="#6b6b7d" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#141417', 
                              border: '1px solid #2a2a30',
                              borderRadius: '12px',
                              color: '#ffffff'
                            }} 
                          />
                          <Bar yAxisId="usage" dataKey="usage" fill="#00d4aa" radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="cost" dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>

                {/* Forecast Details */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {forecastChartData.map((scenario, index) => (
                    <Card key={index} className="card-premium">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-foreground">{scenario.scenario} Scenario</h3>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            scenario.scenario === 'Low' ? 'bg-primary/10 text-primary' :
                            scenario.scenario === 'Expected' ? 'bg-accent-blue/10 text-accent-blue' :
                            'bg-accent-amber/10 text-accent-amber'
                          }`}>
                            {scenario.scenario === 'Expected' ? 'Most Likely' : scenario.scenario}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-foreground-secondary">Usage:</span>
                            <span className="font-bold text-foreground">{scenario.usage} kWh</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground-secondary">Cost:</span>
                            <span className="font-bold text-primary">Rs {scenario.cost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground-secondary">vs Last Month:</span>
                            <span className={`font-medium ${
                              (forecastData?.comparison?.vsLastMonth || 0) > 0 ? 'text-red-400' : 'text-primary'
                            }`}>
                              {(forecastData?.comparison?.vsLastMonth || 0) > 0 ? '+' : ''}
                              {forecastData?.comparison?.vsLastMonth || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Budget Analysis Tab */}
            {activeTab === 'budget' && (
              <div className="space-y-8">
                <Card className="card-premium">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground font-sora">Budget Performance</h2>
                        <p className="text-foreground-secondary">Track your spending against monthly targets</p>
                      </div>
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-foreground">Monthly Budget Status</h3>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                On Track
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-foreground-secondary">Budget:</span>
                                <span className="font-bold text-foreground">Rs 25,000</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground-secondary">Spent:</span>
                                <span className="font-bold text-foreground">Rs {Math.round(usageData?.monthToDateCost || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground-secondary">Remaining:</span>
                                <span className="font-bold text-primary">Rs {(25000 - Math.round(usageData?.monthToDateCost || 0)).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground-secondary">Projected:</span>
                                <span className="font-bold text-foreground">Rs {Math.round(forecastData?.forecast?.bill?.expected || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Budget Recommendations</h4>
                          <div className="space-y-3">
                            {[
                              'Maintain current usage pattern to stay within budget',
                              'Consider reducing AC usage by 1 hour daily to save Rs 800',
                              'Schedule high-power appliances during off-peak hours'
                            ].map((rec, index) => (
                              <div key={index} className="flex items-start space-x-3 p-4 rounded-xl bg-background-card/30">
                                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                                <span className="text-foreground-secondary">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-amber/10 to-accent-pink/10 border border-accent-amber/20">
                          <div className="space-y-4">
                            <h3 className="font-semibold text-foreground">Daily Budget Tracking</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-foreground-secondary">Daily Target:</span>
                                <span className="font-bold text-foreground">Rs 833</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground-secondary">Daily Average:</span>
                                <span className="font-bold text-primary">Rs {Math.round((usageData?.monthToDateCost || 0) / 20)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground-secondary">Today's Usage:</span>
                                <span className="font-bold text-foreground">Rs 720</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Savings Opportunities</h4>
                          <div className="space-y-3">
                            {[
                              { action: 'Reduce AC by 2°C', savings: 'Rs 1,200/month' },
                              { action: 'Use timer for water heater', savings: 'Rs 800/month' },
                              { action: 'Switch to LED lighting', savings: 'Rs 400/month' }
                            ].map((opportunity, index) => (
                              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-background-card/30">
                                <span className="text-foreground">{opportunity.action}</span>
                                <span className="font-semibold text-primary">{opportunity.savings}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Anomalies Tab */}
            {activeTab === 'anomalies' && (
              <div className="space-y-8">
                <Card className="card-premium">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-red-500 to-accent-amber p-2 rounded-xl">
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-foreground font-sora">Anomaly Detection</h2>
                          <p className="text-foreground-secondary">Unusual patterns and calculation discrepancies</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-foreground-secondary">High</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-accent-amber rounded-full" />
                          <span className="text-foreground-secondary">Medium</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-accent-blue rounded-full" />
                          <span className="text-foreground-secondary">Low</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {anomalies.map((anomaly, index) => (
                        <div key={anomaly.id} className={`p-6 rounded-2xl border-l-4 transition-all duration-300 hover:shadow-card ${getAnomalySeverityColor(anomaly.severity)}`}>
                          <div className="flex items-start justify-between">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <AlertTriangle className={`h-5 w-5 ${
                                  anomaly.severity === 'high' ? 'text-red-500' :
                                  anomaly.severity === 'medium' ? 'text-accent-amber' :
                                  'text-accent-blue'
                                }`} />
                                <h3 className="font-semibold text-foreground text-lg">{anomaly.title}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  anomaly.resolved ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {anomaly.resolved ? 'Resolved' : 'Active'}
                                </span>
                              </div>
                              <p className="text-foreground-secondary leading-relaxed">{anomaly.description}</p>
                              <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4 text-foreground-tertiary" />
                                  <span className="text-foreground-tertiary">{anomaly.date}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-4 w-4 text-foreground-tertiary" />
                                  <span className="text-foreground-tertiary">{anomaly.impact}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                Investigate
                              </Button>
                              {!anomaly.resolved && (
                                <Button size="sm">
                                  Mark Resolved
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-8">
                <Card className="card-premium">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-2 rounded-xl">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground font-sora">AI-Powered Insights</h2>
                        <p className="text-foreground-secondary">Actionable recommendations based on your usage patterns</p>
                      </div>
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-foreground">Cost Optimization</h3>
                        <div className="space-y-4">
                          {insights.slice(0, 3).map((insight, index) => (
                            <div key={index} className="p-5 rounded-2xl bg-background-card/30 border border-border/30 space-y-3">
                              <div className="flex items-start space-x-3">
                                {getInsightIcon(insight.type)}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-foreground">{insight.title}</h4>
                                  <p className="text-foreground-secondary leading-relaxed">{insight.message}</p>
                                  {insight.impact && (
                                    <p className="text-primary text-sm font-medium">{insight.impact}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-foreground">Smart Recommendations</h3>
                        <div className="space-y-4">
                          {[
                            {
                              title: 'Peak Hour Optimization',
                              description: 'Shift 30% of usage to off-peak hours',
                              savings: 'Rs 1,200/month',
                              difficulty: 'Easy',
                              icon: Clock
                            },
                            {
                              title: 'Temperature Adjustment',
                              description: 'Increase AC temperature by 2°C',
                              savings: 'Rs 800/month',
                              difficulty: 'Easy',
                              icon: Target
                            },
                            {
                              title: 'Smart Scheduling',
                              description: 'Use timers for water heater and washing machine',
                              savings: 'Rs 600/month',
                              difficulty: 'Medium',
                              icon: Brain
                            }
                          ].map((rec, index) => (
                            <div key={index} className="p-5 rounded-2xl bg-background-card/30 border border-border/30 space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                  <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-lg">
                                    <rec.icon className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-foreground">{rec.title}</h4>
                                    <p className="text-foreground-secondary text-sm leading-relaxed">{rec.description}</p>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  rec.difficulty === 'Easy' ? 'bg-primary/10 text-primary' : 'bg-accent-amber/10 text-accent-amber'
                                }`}>
                                  {rec.difficulty}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  <span className="font-semibold text-primary">{rec.savings}</span>
                                </div>
                                <Button size="sm">
                                  Apply
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Comparison Analysis */}
            {comparisonData && (
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-accent-emerald to-primary p-2 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground font-sora">Comparison Analysis</h2>
                      <p className="text-foreground-secondary">Performance vs previous periods</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {Array.isArray(comparisonData.comparisons) ? 
                      comparisonData.comparisons.map((comparison: any, index: number) => (
                        <div key={index} className="p-6 rounded-2xl bg-background-card/30 border border-border/30">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-foreground">{comparison.comparisonType}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                comparison.trend === 'increasing' ? 'bg-red-500/10 text-red-400' :
                                comparison.trend === 'decreasing' ? 'bg-primary/10 text-primary' :
                                'bg-accent-blue/10 text-accent-blue'
                              }`}>
                                {comparison.trend}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-foreground-secondary">Usage Change:</span>
                                <span className={`font-bold ${
                                  comparison.percentageChange.usage > 0 ? 'text-red-400' : 'text-primary'
                                }`}>
                                  {comparison.percentageChange.usage > 0 ? '+' : ''}{comparison.percentageChange.usage}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground-secondary">Cost Change:</span>
                                <span className={`font-bold ${
                                  comparison.percentageChange.cost > 0 ? 'text-red-400' : 'text-primary'
                                }`}>
                                  {comparison.percentageChange.cost > 0 ? '+' : ''}{comparison.percentageChange.cost}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )) :
                      // Single comparison object
                      <div className="p-6 rounded-2xl bg-background-card/30 border border-border/30">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">{comparisonData.comparisons.comparisonType}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              comparisonData.comparisons.trend === 'increasing' ? 'bg-red-500/10 text-red-400' :
                              comparisonData.comparisons.trend === 'decreasing' ? 'bg-primary/10 text-primary' :
                              'bg-accent-blue/10 text-accent-blue'
                            }`}>
                              {comparisonData.comparisons.trend}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Usage Change:</span>
                              <span className={`font-bold ${
                                comparisonData.comparisons.percentageChange.usage > 0 ? 'text-red-400' : 'text-primary'
                              }`}>
                                {comparisonData.comparisons.percentageChange.usage > 0 ? '+' : ''}{comparisonData.comparisons.percentageChange.usage}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground-secondary">Cost Change:</span>
                              <span className={`font-bold ${
                                comparisonData.comparisons.percentageChange.cost > 0 ? 'text-red-400' : 'text-primary'
                              }`}>
                                {comparisonData.comparisons.percentageChange.cost > 0 ? '+' : ''}{comparisonData.comparisons.percentageChange.cost}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AnalyticsPage