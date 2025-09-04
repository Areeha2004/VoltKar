'use client'
import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  Target, 
  Zap, 
  TrendingUp, 
  Calendar,
  Lightbulb,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BarChart3,
  Home,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Star,
  Award,
  Timer,
  Thermometer
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { StatsBundle } from '../../lib/statService'

const OptimizationPage: React.FC = () => {
  const [statsBundle, setStatsBundle] = useState<StatsBundle | null>(null)
  const [optimizationData, setOptimizationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  // Fetch analysis data
  const fetchAnalysisData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stats/optimization')
      if (response.ok) {
        const data = await response.json()
        setStatsBundle(data.data.stats)
        setOptimizationData(data.data.optimization)
      }
    } catch (error) {
      console.error('Failed to fetch analysis data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate AI suggestions
  const generateOptimizations = async () => {
    try {
      setGenerating(true)
      const response = await fetch('/api/optimization/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: statsBundle?.budget.monthly_pkr || 25000,
          includeAppliances: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        setOptimizationData(data.data)
      }
    } catch (error) {
      console.error('Failed to generate optimizations:', error)
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    fetchAnalysisData()
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-500/5'
      case 'medium': return 'border-l-accent-amber bg-accent-amber/5'
      case 'low': return 'border-l-accent-blue bg-accent-blue/5'
      default: return 'border-l-border bg-background-secondary'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-primary bg-primary/10'
      case 'Medium': return 'text-accent-amber bg-accent-amber/10'
      case 'Hard': return 'text-red-500 bg-red-500/10'
      default: return 'text-foreground-secondary bg-background-secondary'
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
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,212,170,0.1),transparent_50%)] pointer-events-none" />
      
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-3 rounded-2xl">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground font-sora">AI Optimization Coach</h1>
                    <p className="text-xl text-foreground-secondary">Personalized electricity optimization powered by artificial intelligence</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={fetchAnalysisData}>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Refresh Data
                </Button>
                <Button 
                  className="premium-button"
                  onClick={generateOptimizations}
                  disabled={generating}
                >
                  <Brain className="h-5 w-5 mr-2" />
                  {generating ? 'Generating...' : 'Generate New Plan'}
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  title: 'Current Usage (MTD)',
                  value: statsBundle?.optimization.current_usage_mtd_kwh?.toString() || '0',
                  unit: 'kWh',
                  icon: Zap,
                  gradient: 'from-primary to-accent-cyan',
                  description: 'Month to date'
                },
                {
                  title: 'Projected Cost',
                  value: `Rs ${(statsBundle?.optimization.projected_cost_pkr || 0).toLocaleString()}`,
                  icon: DollarSign,
                  gradient: 'from-accent-blue to-accent-purple',
                  description: 'End of month'
                },
                {
                  title: 'Budget Status',
                  value: statsBundle?.budget.status || 'Not Set',
                  icon: Target,
                  gradient: 'from-accent-amber to-accent-pink',
                  description: statsBundle?.budget.monthly_pkr ? `Rs ${statsBundle.budget.monthly_pkr.toLocaleString()} target` : 'Set budget to track'
                },
                {
                  title: 'Savings Potential',
                  value: `Rs ${(statsBundle?.optimization.potential_savings_pkr || 0).toLocaleString()}`,
                  icon: TrendingUp,
                  gradient: 'from-accent-emerald to-primary',
                  description: 'AI estimated'
                }
              ].map((metric, index) => (
                <Card key={index} className="card-premium animate-fade-in" > <div style={{ animationDelay: `${index * 0.1}s` }}>
<div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-r ${metric.gradient} rounded-2xl blur-xl opacity-20`} />
                        <div className={`relative bg-gradient-to-r ${metric.gradient} p-3 rounded-2xl`}>
                          <metric.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-foreground-secondary text-sm font-medium">{metric.title}</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-foreground font-mono">{metric.value}</span>
                        {metric.unit && <span className="text-foreground-tertiary text-sm">{metric.unit}</span>}
                      </div>
                      <p className="text-xs text-foreground-muted">{metric.description}</p>
                    </div>
                  </div>
                </div>
                  
                </Card>
              ))}
            </div>

            {/* AI Optimization Suggestions */}
            {optimizationData && (
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-3 rounded-2xl">
                        <Brain className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground font-sora">AI Optimization Recommendations</h2>
                        <p className="text-foreground-secondary">Personalized suggestions based on your usage patterns</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {optimizationData.metadata?.confidence || 85}% Confidence
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-accent-blue/10 text-accent-blue">
                        AI Powered
                      </div>
                    </div>
                  </div>

                  {/* Optimization Opportunities */}
                  {optimizationData.opportunities && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Optimization Opportunities</h3>
                      <div className="grid md:grid-cols-3 gap-6">
                        {optimizationData.opportunities.map((opportunity: any, index: number) => (
                          <div key={index} className="p-6 rounded-2xl bg-background-card/30 border border-border/30 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-foreground">{opportunity.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                opportunity.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                                opportunity.priority === 'medium' ? 'bg-accent-amber/10 text-accent-amber' :
                                'bg-accent-blue/10 text-accent-blue'
                              }`}>
                                {opportunity.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-foreground-secondary leading-relaxed">{opportunity.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-primary">Rs {opportunity.potential_savings.toLocaleString()}</span>
                              <Button size="sm">Apply</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Meter Strategy */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Meter Strategy</h3>
                      </div>
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
                        <p className="text-foreground-secondary leading-relaxed">
                          {optimizationData.optimization?.recommendation?.meter_strategy || 'Single meter optimization - focus on peak hour management'}
                        </p>
                      </div>
                    </div>

                    {/* Slab Advice */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-accent-blue" />
                        <h3 className="text-lg font-semibold text-foreground">Slab Optimization</h3>
                      </div>
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border border-accent-blue/20">
                        <p className="text-foreground-secondary leading-relaxed">
                          {optimizationData.optimization?.recommendation?.slab_advice || 'Stay within current slab to maintain optimal rates'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Appliance Tips */}
                  {optimizationData.optimization?.recommendation?.appliance_tips && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="h-5 w-5 text-accent-amber" />
                        <h3 className="text-lg font-semibold text-foreground">Smart Appliance Tips</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {optimizationData.optimization.recommendation.appliance_tips.map((tip: string, index: number) => (
                          <div key={index} className="p-5 rounded-2xl bg-background-card/30 border border-border/30 space-y-3">
                            <div className="flex items-start space-x-3">
                              <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-2 rounded-lg">
                                <Lightbulb className="h-4 w-4 text-white" />
                              </div>
                              <p className="text-foreground-secondary leading-relaxed">{tip}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expected Savings */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-accent-emerald/10 to-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-accent-emerald to-primary p-3 rounded-2xl">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">Expected Savings</h3>
                          <p className="text-foreground-secondary">Following these recommendations</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          Rs {(optimizationData.potential_savings_pkr || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-foreground-secondary">Potential monthly savings</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Priority Actions */}
            {optimizationData?.optimization?.priority_actions && (
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-red-500 to-accent-amber p-3 rounded-2xl">
                      <Target className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground font-sora">Priority Action Plan</h2>
                      <p className="text-foreground-secondary">Immediate steps for maximum impact</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {optimizationData.optimization.priority_actions.map((action: any, index: number) => (
                      <div key={index} className={`p-6 rounded-2xl border-l-4 transition-all duration-300 hover:shadow-card cursor-pointer ${
                        selectedAction === action.action ? 'border-l-primary bg-primary/5' : 'border-l-border bg-background-card/30'
                      }`} onClick={() => setSelectedAction(selectedAction === action.action ? null : action.action)}>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                                <Target className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">{action.action}</h3>
                                <p className="text-sm text-foreground-secondary">Impact: {action.impact}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(action.difficulty)}`}>
                                {action.difficulty}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent-blue/10 text-accent-blue">
                                {action.timeframe}
                              </span>
                            </div>
                          </div>

                          {selectedAction === action.action && (
                            <div className="pt-4 border-t border-border/30 space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-background-card/50">
                                  <h4 className="font-medium text-foreground mb-2">Implementation Steps</h4>
                                  <ul className="space-y-1 text-sm text-foreground-secondary">
                                    {action.difficulty === 'Easy' ? [
                                      'Adjust thermostat settings',
                                      'Monitor for 3 days',
                                      'Track savings impact'
                                    ] : action.difficulty === 'Medium' ? [
                                      'Purchase smart timer device',
                                      'Install and configure',
                                      'Set optimal schedule',
                                      'Monitor performance'
                                    ] : [
                                      'Plan meter switching schedule',
                                      'Install monitoring system',
                                      'Implement gradual transition',
                                      'Track optimization results'
                                    ].map((step, i) => (
                                      <li key={i} className="flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="p-4 rounded-xl bg-background-card/50">
                                  <h4 className="font-medium text-foreground mb-2">Expected Results</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Monthly Savings:</span>
                                      <span className="font-semibold text-primary">{action.impact}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Implementation Time:</span>
                                      <span className="font-semibold text-foreground">{action.timeframe}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Difficulty Level:</span>
                                      <span className={`font-semibold ${
                                        action.difficulty === 'Easy' ? 'text-primary' :
                                        action.difficulty === 'Medium' ? 'text-accent-amber' :
                                        'text-red-500'
                                      }`}>{action.difficulty}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Button className="w-full">
                                <Play className="h-4 w-4 mr-2" />
                                Start This Action
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Action Calendar */}
            {optimizationData?.optimization?.action_plan && (
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-3 rounded-2xl">
                      <Calendar className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground font-sora">7-Day Action Calendar</h2>
                      <p className="text-foreground-secondary">Daily optimization schedule</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-7 gap-4">
                    {optimizationData.optimization.action_plan.map((day: any, index: number) => (
                      <div key={index} className={`p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-card ${
                        day.priority === 'high' ? 'border-primary bg-primary/10' :
                        day.priority === 'medium' ? 'border-accent-amber bg-accent-amber/10' :
                        'border-border bg-background-card/30'
                      }`}>
                        <div className="space-y-3">
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">{day.dayName}</p>
                            <p className="text-xs text-foreground-secondary">{new Date(day.date).getDate()}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-foreground-secondary leading-relaxed">{day.recommendation}</p>
                            <div className="flex items-center justify-center space-x-1">
                              <DollarSign className="h-3 w-3 text-primary" />
                              <span className="text-xs font-semibold text-primary">Rs {day.expectedSavings}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Meter Performance Analysis */}
            {statsBundle && (
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-primary to-accent-cyan p-3 rounded-2xl">
                      <Home className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground font-sora">Current Month Performance</h2>
                      <p className="text-foreground-secondary">MTD usage and cost analysis</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-background-card/30 border border-border/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
                            <Home className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">Current Usage</h3>
                            <p className="text-sm text-foreground-secondary">MTD Performance</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-foreground">{statsBundle.mtd.efficiency_score}%</p>
                          <p className="text-xs text-foreground-secondary">Efficiency</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded-xl bg-background-card/50">
                          <p className="text-sm text-foreground-secondary">Current Usage</p>
                          <p className="text-lg font-bold text-foreground">{statsBundle.mtd.usage_kwh} kWh</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-background-card/50">
                          <p className="text-sm text-foreground-secondary">Current Cost</p>
                          <p className="text-lg font-bold text-primary">Rs {statsBundle.mtd.cost_pkr.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-background-card/30 border border-border/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-r from-accent-emerald to-primary p-2 rounded-xl">
                            <TrendingUp className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">Forecast</h3>
                            <p className="text-sm text-foreground-secondary">End of Month</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-foreground">{statsBundle.forecast.usage_kwh} kWh</p>
                          <p className="text-xs text-foreground-secondary">Projected</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded-xl bg-background-card/50">
                          <p className="text-sm text-foreground-secondary">Projected Usage</p>
                          <p className="text-lg font-bold text-foreground">{statsBundle.forecast.usage_kwh} kWh</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-background-card/50">
                          <p className="text-sm text-foreground-secondary">Projected Cost</p>
                          <p className="text-lg font-bold text-primary">Rs {statsBundle.forecast.cost_pkr.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Optimization Opportunities */}
            {optimizationData?.opportunities && optimizationData.opportunities.length > 0 && (
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-3 rounded-2xl">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground font-sora">Optimization Opportunities</h2>
                      <p className="text-foreground-secondary">Identified areas for improvement</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {optimizationData.opportunities.map((opportunity: any, index: number) => (
                      <div key={index} className={`p-6 rounded-2xl border-l-4 transition-all duration-300 hover:shadow-card ${getPriorityColor(opportunity.priority)}`}>
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                                {opportunity.type === 'budget' && <Target className="h-5 w-5 text-white" />}
                                {opportunity.type === 'slab' && <BarChart3 className="h-5 w-5 text-white" />}
                                {opportunity.type === 'appliance' && <Lightbulb className="h-5 w-5 text-white" />}
                                {opportunity.type === 'appliance_optimization' && <Lightbulb className="h-5 w-5 text-white" />}
                                {opportunity.type === 'usage_timing' && <Clock className="h-5 w-5 text-white" />}
                                {opportunity.type === 'slab_optimization' && <BarChart3 className="h-5 w-5 text-white" />}
                                {opportunity.type === 'load_balancing' && <Activity className="h-5 w-5 text-white" />}
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">{opportunity.title}</h3>
                                <p className="text-foreground-secondary leading-relaxed">{opportunity.description}</p>
                                <div className="flex items-center space-x-2">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium text-primary">Rs {opportunity.potential_savings.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              opportunity.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                              opportunity.priority === 'medium' ? 'bg-accent-amber/10 text-accent-amber' :
                              'bg-accent-blue/10 text-accent-blue'
                            }`}>
                              {opportunity.priority.toUpperCase()}
                            </span>
                          </div>

                          <Button variant="outline" className="w-full">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Apply Optimization
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Appliance Optimization */}
            {optimizationData?.savingsBreakdown && (
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-accent-emerald to-primary p-3 rounded-2xl">
                        <Lightbulb className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground font-sora">Smart Appliance Insights</h2>
                        <p className="text-foreground-secondary">AI-powered device optimization</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => window.location.href = '/devices'}>
                      <Settings className="h-5 w-5 mr-2" />
                      Manage Devices
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="h-6 w-6 text-primary" />
                          <h3 className="font-semibold text-primary text-lg">Total Devices</h3>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{optimizationData.savingsBreakdown.length}</p>
                        <p className="text-sm text-foreground-secondary">Connected appliances</p>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border border-accent-blue/20">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-6 w-6 text-accent-blue" />
                          <h3 className="font-semibold text-accent-blue text-lg">Total Consumption</h3>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{Math.round(statsBundle?.optimization.current_usage_mtd_kwh || 0)} kWh</p>
                        <p className="text-sm text-foreground-secondary">Monthly estimate</p>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-amber/10 to-accent-pink/10 border border-accent-amber/20">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-6 w-6 text-accent-amber" />
                          <h3 className="font-semibold text-accent-amber text-lg">Appliance Costs</h3>
                        </div>
                        <p className="text-3xl font-bold text-foreground">Rs {Math.round(optimizationData.savingsBreakdown.reduce((sum: number, app: any) => sum + app.currentCost, 0)).toLocaleString()}</p>
                        <p className="text-sm text-foreground-secondary">Monthly projection</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Consumers with AI Tips */}
                  {optimizationData.savingsBreakdown && optimizationData.savingsBreakdown.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Top Energy Consumers</h3>
                      <div className="space-y-3">
                        {optimizationData.savingsBreakdown.slice(0, 5).map((appliance: any, index: number) => (
                          <div key={appliance.id} className="flex items-center justify-between p-5 rounded-2xl bg-background-card/30 border border-border/30">
                            <div className="flex items-center space-x-4">
                              <div className="text-2xl">
                                {appliance.category === 'Air Conditioner' ? '❄️' :
                                 appliance.category === 'Refrigerator' ? '🧊' :
                                 appliance.category === 'Water Heater' ? '🚿' :
                                 appliance.category === 'Lighting' ? '💡' : '⚡'}
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">{appliance.name}</h4>
                                <p className="text-sm text-foreground-secondary">{appliance.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="font-bold text-foreground">Rs {appliance.currentCost.toLocaleString()}</p>
                                <p className="text-sm text-foreground-secondary">Rs {appliance.potentialSavings.toLocaleString()} savings</p>
                              </div>
                              <div className="px-3 py-1 rounded-full text-xs font-medium bg-accent-amber/10 text-accent-amber flex items-center space-x-1">
                                <Brain className="h-3 w-3" />
                                <span>AI Tip</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Performance Insights */}
            {optimizationData?.optimization?.insights && (
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-3 rounded-2xl">
                      <Award className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground font-sora">Performance Insights</h2>
                      <p className="text-foreground-secondary">AI analysis of your optimization potential</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-6">
                    {[
                      {
                        title: 'Budget Status',
                        value: statsBundle?.budget.status || 'Not Set',
                        icon: Target,
                        color: statsBundle?.budget.status === 'On Track' ? 'text-primary' : 'text-red-500'
                      },
                      {
                        title: 'Efficiency Score',
                        value: `${Math.round(statsBundle?.mtd.efficiency_score || 0)}%`,
                        icon: Star,
                        color: 'text-accent-blue'
                      },
                      {
                        title: 'Peak Optimization',
                        value: `${optimizationData.optimization.insights.peak_optimization_potential}%`,
                        icon: Clock,
                        color: 'text-accent-amber'
                      },
                      {
                        title: 'Slab Optimization',
                        value: `${optimizationData.optimization.insights.slab_optimization_score}%`,
                        icon: BarChart3,
                        color: 'text-accent-emerald'
                      }
                    ].map((insight, index) => (
                      <div key={index} className="p-5 rounded-2xl bg-background-card/30 border border-border/30 text-center space-y-3">
                        <insight.icon className={`h-8 w-8 mx-auto ${insight.color}`} />
                        <div>
                          <p className="text-sm text-foreground-secondary">{insight.title}</p>
                          <p className={`text-2xl font-bold ${insight.color}`}>{insight.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Implementation Guide */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-primary to-accent-cyan p-3 rounded-2xl">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Implementation Guide</h2>
                    <p className="text-foreground-secondary">Step-by-step optimization roadmap</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      step: 1,
                      title: 'Immediate Actions',
                      timeframe: 'Today',
                      icon: Timer,
                      color: 'from-red-500 to-accent-amber',
                      actions: [
                        'Adjust AC temperature to 26°C',
                        'Turn off unnecessary lights',
                        'Unplug idle electronics'
                      ]
                    },
                    {
                      step: 2,
                      title: 'Weekly Optimizations',
                      timeframe: 'This Week',
                      icon: Calendar,
                      color: 'from-accent-amber to-accent-pink',
                      actions: [
                        'Install smart timers',
                        'Schedule heavy appliances',
                        'Monitor daily usage'
                      ]
                    },
                    {
                      step: 3,
                      title: 'Long-term Strategy',
                      timeframe: 'This Month',
                      icon: TrendingUp,
                      color: 'from-accent-blue to-accent-purple',
                      actions: [
                        'Implement meter switching',
                        'Upgrade to efficient appliances',
                        'Establish usage patterns'
                      ]
                    }
                  ].map((phase, index) => (
                    <div key={index} className="p-6 rounded-2xl bg-background-card/30 border border-border/30 space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className={`bg-gradient-to-r ${phase.color} p-3 rounded-2xl`}>
                          <phase.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Step {phase.step}: {phase.title}</h3>
                          <p className="text-sm text-foreground-secondary">{phase.timeframe}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {phase.actions.map((action, actionIndex) => (
                          <div key={actionIndex} className="flex items-center space-x-2 p-3 rounded-lg bg-background-card/50">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="text-sm text-foreground-secondary">{action}</span>
                          </div>
                        ))}
                      </div>

                      <Button variant="outline" className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Start Step {phase.step}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default OptimizationPage