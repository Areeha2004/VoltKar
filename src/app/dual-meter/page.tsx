'use client'
import React, { useState } from 'react'
import { 
  Zap, 
  ArrowLeftRight, 
  DollarSign, 
  Clock, 
  Target,
  Home,
  Building2,
  Save,
  RefreshCw,
  Brain,
  Activity,
  TrendingUp,
  Sparkles,
  BarChart3,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const DualMeterPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [assignments, setAssignments] = useState({
    meterA: ['ac-living', 'lights-main', 'refrigerator'],
    meterB: ['ac-bedroom', 'heater', 'microwave']
  })

  const devices = [
    { id: 'ac-living', name: 'Living Room AC', power: 1500, hours: 8, icon: '❄️', priority: 'high' },
    { id: 'ac-bedroom', name: 'Bedroom AC', power: 1200, hours: 10, icon: '❄️', priority: 'high' },
    { id: 'refrigerator', name: 'Refrigerator', power: 150, hours: 24, icon: '🧊', priority: 'critical' },
    { id: 'lights-main', name: 'Main Lighting', power: 120, hours: 6, icon: '💡', priority: 'medium' },
    { id: 'heater', name: 'Water Heater', power: 2000, hours: 3, icon: '🚿', priority: 'high' },
    { id: 'microwave', name: 'Microwave', power: 800, hours: 1, icon: '📱', priority: 'low' },
    { id: 'washing', name: 'Washing Machine', power: 500, hours: 2, icon: '🧺', priority: 'medium' },
    { id: 'tv', name: 'Television', power: 100, hours: 5, icon: '📺', priority: 'low' }
  ]

  const timeSlots = [
    { label: 'Morning (6-12)', peak: false, rate: 15.5, usage: { meterA: 180, meterB: 120 } },
    { label: 'Afternoon (12-18)', peak: true, rate: 22.0, usage: { meterA: 320, meterB: 280 } },
    { label: 'Evening (18-22)', peak: true, rate: 25.5, usage: { meterA: 420, meterB: 380 } },
    { label: 'Night (22-6)', peak: false, rate: 12.0, usage: { meterA: 90, meterB: 60 } }
  ]

  const calculateMeterCost = (meterDevices: string[]) => {
    return meterDevices.reduce((total, deviceId) => {
      const device = devices.find(d => d.id === deviceId)
      if (!device) return total
      return total + (device.power * device.hours * 30 * 20) / 1000
    }, 0)
  }

  const calculateMeterUsage = (meterDevices: string[]) => {
    return meterDevices.reduce((total, deviceId) => {
      const device = devices.find(d => d.id === deviceId)
      if (!device) return total
      return total + (device.power * device.hours * 30) / 1000
    }, 0)
  }

  const moveDevice = (deviceId: string, toMeter: 'meterA' | 'meterB') => {
    const fromMeter = assignments.meterA.includes(deviceId) ? 'meterA' : 'meterB'
    if (fromMeter === toMeter) return

    setAssignments(prev => ({
      ...prev,
      [fromMeter]: prev[fromMeter].filter(id => id !== deviceId),
      [toMeter]: [...prev[toMeter], deviceId]
    }))
  }

  const meterAUsage = calculateMeterUsage(assignments.meterA)
  const meterBUsage = calculateMeterUsage(assignments.meterB)
  const meterACost = calculateMeterCost(assignments.meterA)
  const meterBCost = calculateMeterCost(assignments.meterB)
  const balanceScore = Math.max(0, 100 - Math.abs(meterAUsage - meterBUsage) * 2)

  const unassignedDevices = devices.filter(device => 
    !assignments.meterA.includes(device.id) && !assignments.meterB.includes(device.id)
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-500/5'
      case 'high': return 'border-l-accent-amber bg-accent-amber/5'
      case 'medium': return 'border-l-accent-blue bg-accent-blue/5'
      case 'low': return 'border-l-primary bg-primary/5'
      default: return 'border-l-border bg-background-secondary'
    }
  }

  const optimizationSuggestions = [
    {
      title: 'Load Balancing Opportunity',
      description: 'Move Bedroom AC to Meter A for better distribution',
      impact: 'Save Rs 420/month',
      priority: 'high',
      icon: Target
    },
    {
      title: 'Peak Hour Optimization',
      description: 'Schedule water heater during off-peak hours',
      impact: 'Save Rs 280/month',
      priority: 'medium',
      icon: Clock
    },
    {
      title: 'Efficiency Improvement',
      description: 'Current setup achieves 87% efficiency',
      impact: 'Potential Rs 1,240/month',
      priority: 'info',
      icon: TrendingUp
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(0,212,170,0.1),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
      
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-primary to-accent-cyan p-3 rounded-2xl">
                    <ArrowLeftRight className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground font-sora">Dual-Meter Optimizer</h1>
                    <p className="text-xl text-foreground-secondary">AI-powered load balancing for maximum efficiency and savings</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" className="border-border-light hover:border-primary">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Auto-Optimize
                </Button>
                <Button className="premium-button">
                  <Save className="h-5 w-5 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  title: 'Meter A Load',
                  value: `${meterAUsage.toFixed(0)} kWh`,
                  icon: Home,
                  gradient: 'from-primary to-accent-cyan',
                  description: 'Main connection',
                  trend: '+12%'
                },
                {
                  title: 'Meter B Load',
                  value: `${meterBUsage.toFixed(0)} kWh`,
                  icon: Building2,
                  gradient: 'from-accent-blue to-accent-purple',
                  description: 'Secondary connection',
                  trend: '-5%'
                },
                {
                  title: 'Total Cost',
                  value: `Rs ${(meterACost + meterBCost).toLocaleString()}`,
                  icon: DollarSign,
                  gradient: 'from-accent-amber to-accent-pink',
                  description: 'Monthly projection',
                  trend: '+8%'
                },
                {
                  title: 'Balance Score',
                  value: `${balanceScore.toFixed(0)}%`,
                  icon: Target,
                  gradient: 'from-accent-emerald to-primary',
                  description: 'Load distribution',
                  trend: balanceScore > 80 ? '+15%' : '-3%'
                }
              ].map((metric, index) => (
                <Card key={index} className="card-premium animate-fade-in"><div style={{ animationDelay: `${index * 0.1}s` }} >
  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-r ${metric.gradient} rounded-2xl blur-xl opacity-20`} />
                        <div className={`relative bg-gradient-to-r ${metric.gradient} p-3 rounded-2xl`}>
                          <metric.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className={`text-sm font-semibold px-2 py-1 rounded-full ${
                        metric.trend.startsWith('+') ? 'text-accent-amber bg-accent-amber/10' : 'text-primary bg-primary/10'
                      }`}>
                        {metric.trend}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-foreground-secondary text-sm font-medium">{metric.title}</p>
                      <p className="text-2xl font-bold text-foreground font-mono">{metric.value}</p>
                      <p className="text-xs text-foreground-muted">{metric.description}</p>
                    </div>
                  </div>
                </div>
                
                </Card>
              ))}
            </div>

            {/* Meter Assignment Interface */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Meter A */}
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-primary to-accent-cyan p-3 rounded-2xl">
                        <Home className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground font-sora">Meter A</h2>
                        <p className="text-sm text-foreground-secondary">Main Connection • Single Phase</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xl font-bold text-foreground">Rs {meterACost.toLocaleString()}</p>
                      <p className="text-sm text-foreground-secondary">{meterAUsage.toFixed(0)} kWh/month</p>
                      <p className="text-xs text-foreground-tertiary">Projected cost</p>
                    </div>
                  </div>

                  <div 
                    className="min-h-[400px] p-6 rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent-cyan/5 space-y-4 transition-all duration-300 hover:border-primary/50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const deviceId = e.dataTransfer.getData('text/plain')
                      moveDevice(deviceId, 'meterA')
                    }}
                  >
                    {assignments.meterA.map(deviceId => {
                      const device = devices.find(d => d.id === deviceId)
                      if (!device) return null
                      return (
                        <div
                          key={deviceId}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', deviceId)}
                          className={`flex items-center justify-between p-4 bg-background rounded-2xl border-l-4 cursor-move hover:shadow-card transition-all duration-300 group ${getPriorityColor(device.priority)}`}
                        >
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl">{device.icon}</span>
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">{device.name}</p>
                              <div className="flex items-center space-x-3 text-sm text-foreground-secondary">
                                <span>{device.power}W</span>
                                <span>•</span>
                                <span>{device.hours}h/day</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  device.priority === 'critical' ? 'text-red-500 bg-red-500/10' :
                                  device.priority === 'high' ? 'text-accent-amber bg-accent-amber/10' :
                                  device.priority === 'medium' ? 'text-accent-blue bg-accent-blue/10' :
                                  'text-primary bg-primary/10'
                                }`}>
                                  {device.priority}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ArrowLeftRight className="h-5 w-5 text-foreground-tertiary group-hover:text-foreground transition-colors" />
                        </div>
                      )
                    })}
                    {assignments.meterA.length === 0 && (
                      <div className="text-center text-foreground-secondary py-16">
                        <Home className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Drag devices here</p>
                        <p className="text-sm">Main connection meter</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Device Pool */}
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-2 rounded-xl">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground font-sora">Device Pool</h2>
                    </div>
                    <p className="text-sm text-foreground-secondary">Drag devices to assign to meters</p>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {/* Show all devices for redistribution */}
                    {devices.map(device => {
                      const isAssigned = assignments.meterA.includes(device.id) || assignments.meterB.includes(device.id)
                      return (
                        <div
                          key={device.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', device.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-l-4 cursor-move hover:shadow-card transition-all duration-300 group ${
                            isAssigned ? 'bg-background-tertiary/50 opacity-60' : 'bg-background-card'
                          } ${getPriorityColor(device.priority)}`}
                        >
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl">{device.icon}</span>
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">{device.name}</p>
                              <div className="flex items-center space-x-3 text-sm text-foreground-secondary">
                                <span>{device.power}W</span>
                                <span>•</span>
                                <span>{device.hours}h/day</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  device.priority === 'critical' ? 'text-red-500 bg-red-500/10' :
                                  device.priority === 'high' ? 'text-accent-amber bg-accent-amber/10' :
                                  device.priority === 'medium' ? 'text-accent-blue bg-accent-blue/10' :
                                  'text-primary bg-primary/10'
                                }`}>
                                  {device.priority}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ArrowLeftRight className="h-5 w-5 text-foreground-tertiary group-hover:text-foreground transition-colors" />
                        </div>
                      )
                    })}
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <div className="text-xs text-foreground-secondary space-y-1">
                      <p>• Critical: Always-on devices</p>
                      <p>• High: Major power consumers</p>
                      <p>• Medium: Regular appliances</p>
                      <p>• Low: Occasional use items</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Meter B */}
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-3 rounded-2xl">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground font-sora">Meter B</h2>
                        <p className="text-sm text-foreground-secondary">Secondary Connection • Single Phase</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xl font-bold text-foreground">Rs {meterBCost.toLocaleString()}</p>
                      <p className="text-sm text-foreground-secondary">{meterBUsage.toFixed(0)} kWh/month</p>
                      <p className="text-xs text-foreground-tertiary">Projected cost</p>
                    </div>
                  </div>

                  <div 
                    className="min-h-[400px] p-6 rounded-2xl border-2 border-dashed border-accent-blue/30 bg-gradient-to-br from-accent-blue/5 to-accent-purple/5 space-y-4 transition-all duration-300 hover:border-accent-blue/50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const deviceId = e.dataTransfer.getData('text/plain')
                      moveDevice(deviceId, 'meterB')
                    }}
                  >
                    {assignments.meterB.map(deviceId => {
                      const device = devices.find(d => d.id === deviceId)
                      if (!device) return null
                      return (
                        <div
                          key={deviceId}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', deviceId)}
                          className={`flex items-center justify-between p-4 bg-background rounded-2xl border-l-4 cursor-move hover:shadow-card transition-all duration-300 group ${getPriorityColor(device.priority)}`}
                        >
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl">{device.icon}</span>
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">{device.name}</p>
                              <div className="flex items-center space-x-3 text-sm text-foreground-secondary">
                                <span>{device.power}W</span>
                                <span>•</span>
                                <span>{device.hours}h/day</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  device.priority === 'critical' ? 'text-red-500 bg-red-500/10' :
                                  device.priority === 'high' ? 'text-accent-amber bg-accent-amber/10' :
                                  device.priority === 'medium' ? 'text-accent-blue bg-accent-blue/10' :
                                  'text-primary bg-primary/10'
                                }`}>
                                  {device.priority}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ArrowLeftRight className="h-5 w-5 text-foreground-tertiary group-hover:text-foreground transition-colors" />
                        </div>
                      )
                    })}
                    {assignments.meterB.length === 0 && (
                      <div className="text-center text-foreground-secondary py-16">
                        <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Drag devices here</p>
                        <p className="text-sm">Secondary connection meter</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Time-based Analysis */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-3 rounded-2xl">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Time-based Load Analysis</h2>
                    <p className="text-foreground-secondary">Peak vs off-peak usage distribution</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-4 gap-6">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      slot.peak 
                        ? 'border-accent-amber bg-gradient-to-br from-accent-amber/10 to-accent-pink/10' 
                        : 'border-primary bg-gradient-to-br from-primary/10 to-accent-cyan/10'
                    }`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">{slot.label}</h3>
                          {slot.peak && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent-amber text-black">
                              Peak
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-foreground-secondary">Rate:</span>
                            <span className="font-bold text-foreground">Rs {slot.rate}/kWh</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-foreground-secondary">Meter A:</span>
                            <span className="font-semibold text-foreground">{slot.usage.meterA} kWh</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-foreground-secondary">Meter B:</span>
                            <span className="font-semibold text-foreground">{slot.usage.meterB} kWh</span>
                          </div>
                          <div className="pt-2 border-t border-border/30">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-foreground-secondary">Cost:</span>
                              <span className="font-bold text-primary">
                                Rs {((slot.usage.meterA + slot.usage.meterB) * slot.rate).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* AI Optimization Suggestions */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-3 rounded-2xl">
                    <Brain className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">AI Optimization Insights</h2>
                    <p className="text-foreground-secondary">Smart recommendations for maximum efficiency</p>
                  </div>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Recommendations</h3>
                    {optimizationSuggestions.map((suggestion, index) => (
                      <div key={index} className={`p-5 rounded-2xl border-l-4 transition-all duration-300 hover:shadow-card animate-fade-in ${
                        suggestion.priority === 'high' ? 'border-l-accent-amber bg-accent-amber/5' :
                        suggestion.priority === 'medium' ? 'border-l-accent-blue bg-accent-blue/5' :
                        'border-l-primary bg-primary/5'
                      }`} style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-start space-x-4">
                          <suggestion.icon className="h-6 w-6 text-foreground mt-1" />
                          <div className="space-y-2">
                            <h4 className="font-semibold text-foreground">{suggestion.title}</h4>
                            <p className="text-sm text-foreground-secondary leading-relaxed">{suggestion.description}</p>
                            <div className="flex items-center space-x-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-primary">{suggestion.impact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-foreground">Performance Metrics</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium text-primary">Load Balance</span>
                          </div>
                          <p className="text-2xl font-bold text-foreground">{balanceScore.toFixed(0)}%</p>
                          <p className="text-xs text-foreground-secondary">Distribution efficiency</p>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-accent-amber/10 to-accent-pink/10 border border-accent-amber/20">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-accent-amber" />
                            <span className="text-sm font-medium text-accent-amber">Savings</span>
                          </div>
                          <p className="text-2xl font-bold text-foreground">Rs 1,240</p>
                          <p className="text-xs text-foreground-secondary">Monthly potential</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-background-card/50 to-background-secondary/50 border border-border/50">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-5 w-5 text-accent-blue" />
                          <h4 className="font-semibold text-foreground">Optimization Summary</h4>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-foreground-secondary">Current Efficiency:</span>
                            <span className="font-semibold text-foreground">87%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground-secondary">Peak Reduction:</span>
                            <span className="font-semibold text-foreground">22%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground-secondary">Cost Optimization:</span>
                            <span className="font-semibold text-primary">13% savings</span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-border/30">
                          <p className="text-xs text-foreground-secondary leading-relaxed">
                            Your current configuration is performing well. Implementing the suggested changes 
                            could further improve efficiency and reduce costs.
                          </p>
                        </div>
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

export default DualMeterPage