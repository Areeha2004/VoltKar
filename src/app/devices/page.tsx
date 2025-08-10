'use client'
import React, { useState } from 'react'
import { 
  Lightbulb, 
  Plus, 
  Settings, 
  Zap, 
  Clock, 
  Thermometer,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
  Save,
  Brain,
  Target,
  Activity,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Power,
  Timer
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const DevicesPage: React.FC = () => {
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null)
  const [editingDevice, setEditingDevice] = useState<string | null>(null)

  const [devices, setDevices] = useState([
    {
      id: '1',
      name: 'Living Room AC',
      type: 'air-conditioner',
      icon: '❄️',
      power: 1500,
      hours: 8,
      temperature: 24,
      efficiency: 'High',
      monthlyCost: 4200,
      monthlyUsage: 360,
      status: 'active',
      smartFeatures: ['Timer', 'Temperature Control', 'Energy Saver'],
      lastOptimized: '2 days ago',
      tips: [
        'Set temperature to 26°C to save 15% energy',
        'Use timer function during sleep hours',
        'Clean filters monthly for optimal efficiency'
      ]
    },
    {
      id: '2',
      name: 'Kitchen Refrigerator',
      type: 'refrigerator',
      icon: '🧊',
      power: 150,
      hours: 24,
      temperature: 4,
      efficiency: 'Medium',
      monthlyCost: 1080,
      monthlyUsage: 108,
      status: 'active',
      smartFeatures: ['Temperature Monitor', 'Defrost Alert'],
      lastOptimized: '1 week ago',
      tips: [
        'Keep refrigerator 80% full for efficiency',
        'Check door seals regularly',
        'Set temperature to 4°C for optimal cooling'
      ]
    },
    {
      id: '3',
      name: 'LED Lighting System',
      type: 'lighting',
      icon: '💡',
      power: 120,
      hours: 6,
      temperature: null,
      efficiency: 'High',
      monthlyCost: 216,
      monthlyUsage: 21.6,
      status: 'active',
      smartFeatures: ['Dimming', 'Scheduling', 'Motion Sensor'],
      lastOptimized: '3 days ago',
      tips: [
        'Use daylight sensors to reduce usage',
        'Switch to smart bulbs for scheduling',
        'Consider warm light in evenings'
      ]
    },
    {
      id: '4',
      name: 'Water Heater',
      type: 'heater',
      icon: '🚿',
      power: 2000,
      hours: 3,
      temperature: 60,
      efficiency: 'Medium',
      monthlyCost: 1800,
      monthlyUsage: 180,
      status: 'maintenance',
      smartFeatures: ['Timer', 'Temperature Control'],
      lastOptimized: '2 weeks ago',
      tips: [
        'Use timer to heat water before use',
        'Insulate pipes to reduce heat loss',
        'Lower temperature to 50°C when possible'
      ]
    }
  ])

  const updateDevice = (id: string, field: string, value: any) => {
    setDevices(devices.map(device => 
      device.id === id ? { ...device, [field]: value } : device
    ))
  }

  const calculateSavings = (device: any, newHours: number) => {
    const currentCost = (device.power * device.hours * 30 * 20) / 1000
    const newCost = (device.power * newHours * 30 * 20) / 1000
    return currentCost - newCost
  }

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'High': return 'text-primary bg-primary/10'
      case 'Medium': return 'text-accent-amber bg-accent-amber/10'
      case 'Low': return 'text-red-500 bg-red-500/10'
      default: return 'text-foreground-secondary bg-background-secondary'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-primary bg-primary/10'
      case 'maintenance': return 'text-accent-amber bg-accent-amber/10'
      case 'offline': return 'text-red-500 bg-red-500/10'
      default: return 'text-foreground-secondary bg-background-secondary'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />
      
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
                    <Lightbulb className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground font-sora">Smart Device Manager</h1>
                    <p className="text-xl text-foreground-secondary">AI-powered appliance optimization and control center</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline">
                  <Brain className="h-5 w-5 mr-2" />
                  Auto-Optimize All
                </Button>
                <Button className="premium-button">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Device
                </Button>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  title: 'Total Devices',
                  value: devices.length.toString(),
                  icon: Zap,
                  gradient: 'from-primary to-accent-cyan',
                  description: 'Connected appliances'
                },
                {
                  title: 'Monthly Cost',
                  value: `Rs ${devices.reduce((sum, device) => sum + device.monthlyCost, 0).toLocaleString()}`,
                  icon: DollarSign,
                  gradient: 'from-accent-blue to-accent-purple',
                  description: 'Current projection'
                },
                {
                  title: 'Energy Usage',
                  value: `${devices.reduce((sum, device) => sum + device.monthlyUsage, 0).toFixed(0)} kWh`,
                  icon: Activity,
                  gradient: 'from-accent-amber to-accent-pink',
                  description: 'This month'
                },
                {
                  title: 'Efficiency Score',
                  value: '87%',
                  icon: Target,
                  gradient: 'from-accent-emerald to-primary',
                  description: 'Above average'
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
                      <p className="text-2xl font-bold text-foreground font-mono">{metric.value}</p>
                      <p className="text-xs text-foreground-muted">{metric.description}</p>
                    </div>
                  </div>
                  </div>

                 
                </Card>
              ))}
            </div>

            {/* Devices List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground font-sora">Your Devices</h2>
                <div className="flex items-center space-x-2 text-sm text-foreground-secondary">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-accent-amber rounded-full" />
                    <span>Maintenance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>Offline</span>
                  </div>
                </div>
              </div>

              {devices.map((device, index) => (
                <Card key={device.id} className="card-premium transition-all duration-500 animate-fade-in" ><div style={{ animationDelay: `${index * 0.1}s` }}>
 <div className="space-y-6">
                    {/* Device Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="text-4xl p-2">{device.icon}</div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                            device.status === 'active' ? 'bg-primary' : 
                            device.status === 'maintenance' ? 'bg-accent-amber' : 'bg-red-500'
                          }`} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-2xl font-semibold text-foreground font-sora">{device.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                              {device.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-foreground-secondary">
                            <div className="flex items-center space-x-1">
                              <Power className="h-4 w-4" />
                              <span>{device.power}W</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Timer className="h-4 w-4" />
                              <span>{device.hours}h/day</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEfficiencyColor(device.efficiency)}`}>
                              {device.efficiency} Efficiency
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-foreground-tertiary">
                            <Sparkles className="h-3 w-3" />
                            <span>Last optimized: {device.lastOptimized}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right space-y-1">
                          <p className="text-2xl font-bold text-foreground font-mono">Rs {device.monthlyCost.toLocaleString()}</p>
                          <p className="text-sm text-foreground-secondary">{device.monthlyUsage} kWh/month</p>
                          <p className="text-xs text-foreground-tertiary">Projected cost</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingDevice(editingDevice === device.id ? null : device.id)}
                            className="hover:bg-background-card"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setExpandedDevice(expandedDevice === device.id ? null : device.id)}
                            className="hover:bg-background-card"
                          >
                            {expandedDevice === device.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Smart Features */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-foreground-secondary">Smart Features:</span>
                      <div className="flex items-center space-x-2">
                        {device.smartFeatures.map((feature, idx) => (
                          <span key={idx} className="px-2 py-1 rounded-lg bg-background-card text-xs text-foreground-secondary border border-border/50">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Editing Mode */}
                    {editingDevice === device.id && (
                      <div className="p-6 rounded-2xl bg-gradient-to-r from-background-card/50 to-background-secondary/50 border border-border/50 space-y-6">
                        <h4 className="font-semibold text-foreground flex items-center space-x-2">
                          <Settings className="h-5 w-5" />
                          <span>Device Settings</span>
                        </h4>
                        <div className="grid md:grid-cols-3 gap-6">
                          <Input
                            label="Device Name"
                            value={device.name}
                            onChange={(e) => updateDevice(device.id, 'name', e.target.value)}
                          />
                          <Input
                            label="Power Rating (Watts)"
                            type="number"
                            value={device.power}
                            onChange={(e) => updateDevice(device.id, 'power', parseInt(e.target.value))}
                          />
                          <Input
                            label="Daily Usage (Hours)"
                            type="number"
                            value={device.hours}
                            onChange={(e) => updateDevice(device.id, 'hours', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="flex justify-end space-x-3">
                          <Button variant="outline" size="sm" onClick={() => setEditingDevice(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => setEditingDevice(null)}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Expanded Details */}
                    {expandedDevice === device.id && (
                      <div className="space-y-8 p-6 rounded-2xl bg-gradient-to-br from-background-card/30 to-background-secondary/30 border border-border/30">
                        {/* Controls */}
                        <div className="grid md:grid-cols-3 gap-8">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-semibold text-foreground">Daily Runtime</label>
                              <span className="text-lg font-bold text-primary">{device.hours}h</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="24"
                              value={device.hours}
                              onChange={(e) => updateDevice(device.id, 'hours', parseInt(e.target.value))}
                              className="w-full h-2 bg-background-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-xs text-foreground-tertiary">
                              <span>1h</span>
                              <span>12h</span>
                              <span>24h</span>
                            </div>
                          </div>

                          {device.temperature && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-foreground">Temperature</label>
                                <span className="text-lg font-bold text-accent-blue">{device.temperature}°C</span>
                              </div>
                              <input
                                type="range"
                                min="16"
                                max="30"
                                value={device.temperature}
                                onChange={(e) => updateDevice(device.id, 'temperature', parseInt(e.target.value))}
                                className="w-full h-2 bg-background-secondary rounded-lg appearance-none cursor-pointer accent-accent-blue"
                              />
                              <div className="flex justify-between text-xs text-foreground-tertiary">
                                <span>16°C</span>
                                <span>23°C</span>
                                <span>30°C</span>
                              </div>
                            </div>
                          )}

                          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="h-5 w-5 text-primary" />
                                <span className="text-sm font-semibold text-primary">Optimization Potential</span>
                              </div>
                              <div className="space-y-2">
                                <p className="text-2xl font-bold text-foreground">
                                  Rs {calculateSavings(device, Math.max(1, device.hours - 2)).toFixed(0)}
                                </p>
                                <p className="text-sm text-foreground-secondary">Monthly savings potential</p>
                                <p className="text-xs text-foreground-tertiary">
                                  By reducing usage by 2 hours daily
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* AI Tips */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground flex items-center space-x-2">
                            <Brain className="h-5 w-5 text-accent-purple" />
                            <span>AI Optimization Recommendations</span>
                          </h4>
                          <div className="grid md:grid-cols-3 gap-4">
                            {device.tips.map((tip, index) => (
                              <div key={index} className="p-4 rounded-2xl bg-background-card/50 border border-border/50 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Sparkles className="h-4 w-4 text-accent-amber" />
                                  <span className="text-xs font-medium text-accent-amber">Smart Tip</span>
                                </div>
                                <p className="text-sm text-foreground-secondary leading-relaxed">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Usage Timeline */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-accent-blue" />
                            <span>Optimized Daily Schedule</span>
                          </h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-24 gap-1">
                              {Array.from({ length: 24 }, (_, i) => {
                                const isOptimal = 
                                  (device.type === 'air-conditioner' && (i >= 22 || i <= 6)) ||
                                  (device.type === 'lighting' && (i >= 18 && i <= 23)) ||
                                  (device.type === 'heater' && (i >= 6 && i <= 8)) ||
                                  device.type === 'refrigerator'
                                
                                return (
                                  <div key={i} className="text-center">
                                    <div className={`h-8 rounded-lg transition-all duration-300 ${
                                      isOptimal ? 'bg-primary shadow-glow' : 'bg-border hover:bg-border-light'
                                    }`} />
                                    <span className="text-xs text-foreground-tertiary mt-1 block">{i}</span>
                                  </div>
                                )
                              })}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-primary rounded" />
                                <span className="text-foreground-secondary">Optimal usage hours</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-border rounded" />
                                <span className="text-foreground-secondary">Avoid peak rates</span>
                              </div>
                            </div>
                            <p className="text-xs text-foreground-secondary leading-relaxed">
                              Green bars indicate optimal usage hours based on your usage pattern, energy rates, and device efficiency curves.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                 
                </Card>
              ))}
            </div>

            {/* Overall Recommendations */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-emerald to-primary p-3 rounded-2xl">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Monthly Optimization Report</h2>
                    <p className="text-foreground-secondary">AI-powered insights and recommendations</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-6 w-6 text-primary" />
                        <h3 className="font-semibold text-primary text-lg">Potential Savings</h3>
                      </div>
                      <p className="text-3xl font-bold text-foreground">Rs 2,340</p>
                      <p className="text-sm text-foreground-secondary">Monthly optimization potential</p>
                      <div className="pt-2 border-t border-border/30">
                        <p className="text-xs text-foreground-tertiary">
                          Implement all AI recommendations to achieve maximum savings
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border border-accent-blue/20">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-6 w-6 text-accent-blue" />
                        <h3 className="font-semibold text-accent-blue text-lg">Peak Reduction</h3>
                      </div>
                      <p className="text-3xl font-bold text-foreground">22%</p>
                      <p className="text-sm text-foreground-secondary">During 6-10 PM hours</p>
                      <div className="pt-2 border-t border-border/30">
                        <p className="text-xs text-foreground-tertiary">
                          Smart scheduling reduces peak hour consumption
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-amber/10 to-accent-pink/10 border border-accent-amber/20">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Target className="h-6 w-6 text-accent-amber" />
                        <h3 className="font-semibold text-accent-amber text-lg">Efficiency Score</h3>
                      </div>
                      <p className="text-3xl font-bold text-foreground">87%</p>
                      <p className="text-sm text-foreground-secondary">Above neighborhood average</p>
                      <div className="pt-2 border-t border-border/30">
                        <p className="text-xs text-foreground-tertiary">
                          Your devices are performing well overall
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

export default DevicesPage