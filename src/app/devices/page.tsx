'use client'
import React, { useState, useEffect } from 'react'
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
  Timer,
  X,
  Calculator,
  PieChart,
  BarChart3
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAppliances } from '../../hooks/useAppliances'
import { useApplianceCategories } from '../../hooks/useApplianceCategories'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const DevicesPage: React.FC = () => {
  const { appliances, summary, loading, error, createAppliance, updateAppliance, deleteAppliance, refetch } = useAppliances(true)
  const { metadata, getWattageGuide, getUsageGuide, getTypicalValues } = useApplianceCategories()
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDevice, setEditingDevice] = useState<string | null>(null)
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type: 'Non-Inverter',
    wattage: '',
    hoursPerDay: '',
    daysPerMonth: '30'
  })

  // Live preview calculation
  const calculatePreview = () => {
    const wattage = parseFloat(formData.wattage) || 0
    const hours = parseFloat(formData.hoursPerDay) || 0
    const days = parseInt(formData.daysPerMonth) || 30
    
    if (wattage <= 0 || hours <= 0 || days <= 0) return { kWh: 0, cost: 0 }
    
    let estimatedKwh = (wattage * hours * days) / 1000
    
    // Apply inverter efficiency
    if (formData.type === 'Inverter') {
      estimatedKwh *= 0.7
    }
    
    // Rough cost estimate (Rs 20/kWh average)
    const estimatedCost = estimatedKwh * 20
    
    return {
      kWh: Math.round(estimatedKwh * 100) / 100,
      cost: Math.round(estimatedCost)
    }
  }

  const preview = calculatePreview()

  useEffect(() => {
  if (formData.category && metadata) {
    const typical = getTypicalValues(formData.category)

    // Only update if different (prevents infinite loop)
    if (
      formData.wattage !== typical.wattage.toString() ||
      formData.hoursPerDay !== typical.hoursPerDay.toString()
    ) {
      setFormData(prev => ({
        ...prev,
        wattage: typical.wattage.toString(),
        hoursPerDay: typical.hoursPerDay.toString(),
      }))
    }
  }
}, [formData.category, metadata, getTypicalValues])
useEffect(() => {
  if (formData.category && metadata) {
    const typical = getTypicalValues(formData.category)

    // Only update if different (prevents infinite loop)
    if (
      formData.wattage !== typical.wattage.toString() ||
      formData.hoursPerDay !== typical.hoursPerDay.toString()
    ) {
      setFormData(prev => ({
        ...prev,
        wattage: typical.wattage.toString(),
        hoursPerDay: typical.hoursPerDay.toString(),
      }))
    }
  }
}, [formData.category, metadata, getTypicalValues])
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      type: 'Non-Inverter',
      wattage: '',
      hoursPerDay: '',
      daysPerMonth: '30'
    })
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.category || !formData.wattage || !formData.hoursPerDay) {
      setFormError('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      setFormError(null)
      
      if (editingDevice) {
        await updateAppliance(editingDevice, {
          name: formData.name.trim(),
          category: formData.category,
          type: formData.type,
          wattage: parseFloat(formData.wattage),
          hoursPerDay: parseFloat(formData.hoursPerDay),
          daysPerMonth: parseInt(formData.daysPerMonth)
        })
        setEditingDevice(null)
      } else {
        await createAppliance({
          name: formData.name.trim(),
          category: formData.category,
          type: formData.type,
          wattage: parseFloat(formData.wattage),
          hoursPerDay: parseFloat(formData.hoursPerDay),
          daysPerMonth: parseInt(formData.daysPerMonth)
        })
      }
      
      resetForm()
      setShowAddForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save appliance')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (appliance: any) => {
    setFormData({
      name: appliance.name,
      category: appliance.category,
      type: appliance.type,
      wattage: appliance.wattage.toString(),
      hoursPerDay: appliance.hoursPerDay.toString(),
      daysPerMonth: appliance.daysPerMonth.toString()
    })
    setEditingDevice(appliance.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteAppliance(id)
      } catch (err) {
        alert('Failed to delete appliance')
      }
    }
  }

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'text-primary bg-primary/10'
      case 'good': return 'text-accent-blue bg-accent-blue/10'
      case 'fair': return 'text-accent-amber bg-accent-amber/10'
      case 'poor': return 'text-red-500 bg-red-500/10'
      default: return 'text-foreground-secondary bg-background-secondary'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'air conditioner': return '❄️'
      case 'refrigerator': return '🧊'
      case 'lighting': return '💡'
      case 'fan': return '🌀'
      case 'water heater': return '🚿'
      case 'washing machine': return '🧺'
      case 'microwave': return '📱'
      case 'television': return '📺'
      case 'computer': return '💻'
      case 'iron': return '🔥'
      default: return '⚡'
    }
  }

  // Prepare chart data
  const chartData = appliances.map(appliance => ({
    name: appliance.name,
    value: appliance.contribution || 0,
    cost: appliance.estimatedCost || 0,
    kWh: appliance.estimatedKwh || 0,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`
  })).filter(item => item.value > 0)

  const COLORS = ['#00d4aa', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#06b6d4']

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
                <Button 
                  className="premium-button"
                  onClick={() => {
                    resetForm()
                    setShowAddForm(true)
                  }}
                >
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
                  value: (summary?.totalAppliances || 0).toString(),
                  icon: Zap,
                  gradient: 'from-primary to-accent-cyan',
                  description: 'Connected appliances'
                },
                {
                  title: 'Monthly Cost',
                  value: `Rs ${(summary?.totalCost || 0).toLocaleString()}`,
                  icon: DollarSign,
                  gradient: 'from-accent-blue to-accent-purple',
                  description: 'Current projection'
                },
                {
                  title: 'Energy Usage',
                  value: `${(summary?.totalKwh || 0).toFixed(0)} kWh`,
                  icon: Activity,
                  gradient: 'from-accent-amber to-accent-pink',
                  description: 'This month'
                },
                {
                  title: 'Efficiency Score',
                  value: `${summary?.averageEfficiency || 0}%`,
                  icon: Target,
                  gradient: 'from-accent-emerald to-primary',
                  description: 'Above average'
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

            {/* Add/Edit Appliance Form */}
            {showAddForm && (
              <Card className="card-premium">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground font-sora">
                          {editingDevice ? 'Edit Appliance' : 'Add New Appliance'}
                        </h2>
                        <p className="text-foreground-secondary">Configure your appliance details</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingDevice(null)
                        resetForm()
                      }}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <Input
                        label="Appliance Name *"
                        placeholder="e.g., Living Room AC"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-secondary">Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="input-field w-full"
                          required
                        >
                          <option value="">Select Category</option>
                          {metadata?.categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-secondary">Type *</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="input-field w-full"
                          required
                        >
                          {metadata?.types.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        {formData.type === 'Inverter' && (
                          <p className="text-xs text-primary">✨ 30% more efficient than non-inverter</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Power Rating (Watts) *"
                          type="number"
                          placeholder="1500"
                          value={formData.wattage}
                          onChange={(e) => setFormData({ ...formData, wattage: e.target.value })}
                          min="1"
                          max="10000"
                          required
                        />
                        <Input
                          label="Hours per Day *"
                          type="number"
                          placeholder="8"
                          value={formData.hoursPerDay}
                          onChange={(e) => setFormData({ ...formData, hoursPerDay: e.target.value })}
                          min="0.1"
                          max="24"
                          step="0.1"
                          required
                        />
                      </div>

                      <Input
                        label="Days per Month"
                        type="number"
                        placeholder="30"
                        value={formData.daysPerMonth}
                        onChange={(e) => setFormData({ ...formData, daysPerMonth: e.target.value })}
                        min="1"
                        max="31"
                      />
                    </div>

                    <div className="space-y-6">
                      {/* Live Preview */}
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Calculator className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-primary">Live Preview</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 rounded-xl bg-background-card/50">
                              <p className="text-sm text-foreground-secondary">Estimated kWh</p>
                              <p className="text-2xl font-bold text-foreground">{preview.kWh}</p>
                              <p className="text-xs text-foreground-tertiary">per month</p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-background-card/50">
                              <p className="text-sm text-foreground-secondary">Estimated Cost</p>
                              <p className="text-2xl font-bold text-primary">Rs {preview.cost.toLocaleString()}</p>
                              <p className="text-xs text-foreground-tertiary">per month</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category Guidelines */}
                      {formData.category && metadata && (
                        <div className="p-4 rounded-2xl bg-background-card/30 border border-border/30">
                          <h4 className="font-medium text-foreground mb-3">Typical Values for {formData.category}</h4>
                          <div className="space-y-2 text-sm">
                            {(() => {
                              const wattageGuide = getWattageGuide(formData.category)
                              const usageGuide = getUsageGuide(formData.category)
                              return (
                                <>
                                  {wattageGuide && (
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Power Range:</span>
                                      <span className="text-foreground">{wattageGuide.min}-{wattageGuide.max}W</span>
                                    </div>
                                  )}
                                  {usageGuide && (
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Usage Range:</span>
                                      <span className="text-foreground">{usageGuide.min}-{usageGuide.max}h/day</span>
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      )}

                      {formError && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                          <p className="text-red-400 text-sm">{formError}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t border-border/30">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingDevice(null)
                        resetForm()
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      <Save className="h-5 w-5 mr-2" />
                      {submitting ? 'Saving...' : editingDevice ? 'Update Appliance' : 'Add Appliance'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Contribution Charts */}
            {appliances.length > 0 && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Pie Chart - Contribution Breakdown */}
                <Card className="card-premium">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-2 rounded-xl">
                        <PieChart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground font-sora">Usage Contribution</h2>
                        <p className="text-foreground-secondary">Percentage breakdown by appliance</p>
                      </div>
                    </div>
                    
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#141417', 
                              border: '1px solid #2a2a30',
                              borderRadius: '12px',
                              color: '#ffffff'
                            }}
                            formatter={(value: any, name: string) => [`${value}%`, 'Contribution']}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-2">
                      {chartData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-background-card/30">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                            />
                            <span className="text-foreground">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{item.value}%</p>
                            <p className="text-sm text-foreground-secondary">{item.kWh} kWh</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Bar Chart - Cost Breakdown */}
                <Card className="card-premium">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-2 rounded-xl">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground font-sora">Cost Breakdown</h2>
                        <p className="text-foreground-secondary">Monthly cost by appliance</p>
                      </div>
                    </div>
                    
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#6b6b7d" 
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="#6b6b7d" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#141417', 
                              border: '1px solid #2a2a30',
                              borderRadius: '12px',
                              color: '#ffffff'
                            }}
                            formatter={(value: any) => [`Rs ${value}`, 'Monthly Cost']}
                          />
                          <Bar 
                            dataKey="cost" 
                            fill="#00d4aa" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Appliances List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground font-sora">Your Appliances</h2>
                <div className="flex items-center space-x-2 text-sm text-foreground-secondary">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Excellent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-accent-blue rounded-full" />
                    <span>Good</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-accent-amber rounded-full" />
                    <span>Fair</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>Poor</span>
                  </div>
                </div>
              </div>

              {appliances.length > 0 ? (
                <div className="space-y-4">
                  {appliances.map((appliance, index) => (
                    <Card key={appliance.id} className="card-premium transition-all duration-500 animate-fade-in" > <div style={{ animationDelay: `${index * 0.1}s` }}>
 <div className="space-y-6">
                        {/* Appliance Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="text-4xl p-2">{getCategoryIcon(appliance.category)}</div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                                appliance.efficiency === 'excellent' ? 'bg-primary' : 
                                appliance.efficiency === 'good' ? 'bg-accent-blue' :
                                appliance.efficiency === 'fair' ? 'bg-accent-amber' : 'bg-red-500'
                              }`} />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <h3 className="text-2xl font-semibold text-foreground font-sora">{appliance.name}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEfficiencyColor(appliance.efficiency)}`}>
                                  {appliance.efficiency}
                                </span>
                              </div>
                              <div className="flex items-center space-x-6 text-sm text-foreground-secondary">
                                <div className="flex items-center space-x-1">
                                  <span className="font-medium">{appliance.category}</span>
                                  <span>•</span>
                                  <span>{appliance.type}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Power className="h-4 w-4" />
                                  <span>{appliance.wattage}W</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Timer className="h-4 w-4" />
                                  <span>{appliance.hoursPerDay}h/day</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-right space-y-1">
                              <p className="text-2xl font-bold text-foreground font-mono">Rs {appliance.estimatedCost.toLocaleString()}</p>
                              <p className="text-sm text-foreground-secondary">{appliance.estimatedKwh} kWh/month</p>
                              <p className="text-xs text-primary font-medium">{appliance.contribution}% of total</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEdit(appliance)}
                                className="hover:bg-background-card"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(appliance.id, appliance.name)}
                                className="hover:bg-red-500/10 text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setExpandedDevice(expandedDevice === appliance.id ? null : appliance.id)}
                                className="hover:bg-background-card"
                              >
                                {expandedDevice === appliance.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedDevice === appliance.id && (
                          <div className="space-y-6 p-6 rounded-2xl bg-gradient-to-br from-background-card/30 to-background-secondary/30 border border-border/30">
                            {/* Usage Breakdown */}
                            <div className="grid md:grid-cols-3 gap-6">
                              <div className="p-4 rounded-2xl bg-background-card/50">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Zap className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-foreground">Power Details</span>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Wattage:</span>
                                      <span className="font-semibold text-foreground">{appliance.wattage}W</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Daily Hours:</span>
                                      <span className="font-semibold text-foreground">{appliance.hoursPerDay}h</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Monthly Days:</span>
                                      <span className="font-semibold text-foreground">{appliance.daysPerMonth}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 rounded-2xl bg-background-card/50">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Activity className="h-4 w-4 text-accent-blue" />
                                    <span className="font-medium text-foreground">Consumption</span>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Monthly kWh:</span>
                                      <span className="font-semibold text-foreground">{appliance.estimatedKwh}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Daily kWh:</span>
                                      <span className="font-semibold text-foreground">{(appliance.estimatedKwh / 30).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Contribution:</span>
                                      <span className="font-semibold text-primary">{appliance.contribution}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 rounded-2xl bg-background-card/50">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-accent-amber" />
                                    <span className="font-medium text-foreground">Cost Analysis</span>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Monthly Cost:</span>
                                      <span className="font-semibold text-primary">Rs {appliance.estimatedCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Daily Cost:</span>
                                      <span className="font-semibold text-foreground">Rs {Math.round(appliance.estimatedCost / 30)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-foreground-secondary">Cost/kWh:</span>
                                      <span className="font-semibold text-foreground">Rs {appliance.costPerKwh}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Optimization Suggestions */}
                            {appliance.optimizationSuggestions && appliance.optimizationSuggestions.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="font-semibold text-foreground flex items-center space-x-2">
                                  <Brain className="h-5 w-5 text-accent-purple" />
                                  <span>AI Optimization Recommendations</span>
                                </h4>
                                <div className="grid md:grid-cols-1 gap-3">
                                  {appliance.optimizationSuggestions.map((suggestion, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-background-card/50 border border-border/50 space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Sparkles className="h-4 w-4 text-accent-amber" />
                                        <span className="text-xs font-medium text-accent-amber">Smart Tip</span>
                                      </div>
                                      <p className="text-sm text-foreground-secondary leading-relaxed">{suggestion}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      </div>
                     
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-16">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-primary/20 to-accent-cyan/20 p-6 rounded-3xl w-fit mx-auto">
                      <Lightbulb className="h-16 w-16 text-primary mx-auto" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold text-foreground">No Appliances Added</h3>
                      <p className="text-foreground-secondary max-w-md mx-auto">
                        Start tracking your appliances to get detailed usage insights and optimization recommendations.
                      </p>
                    </div>
                    <Button 
                      className="premium-button"
                      onClick={() => {
                        resetForm()
                        setShowAddForm(true)
                      }}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Your First Appliance
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Overall Recommendations */}
            {appliances.length > 0 && (
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
                          <h3 className="font-semibold text-primary text-lg">Total Monthly Cost</h3>
                        </div>
                        <p className="text-3xl font-bold text-foreground">Rs {(summary?.totalCost || 0).toLocaleString()}</p>
                        <p className="text-sm text-foreground-secondary">Based on current usage patterns</p>
                        <div className="pt-2 border-t border-border/30">
                          <p className="text-xs text-foreground-tertiary">
                            {summary?.totalKwh || 0} kWh total consumption
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border border-accent-blue/20">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-6 w-6 text-accent-blue" />
                          <h3 className="font-semibold text-accent-blue text-lg">Efficiency Score</h3>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{summary?.averageEfficiency || 0}%</p>
                        <p className="text-sm text-foreground-secondary">Overall appliance efficiency</p>
                        <div className="pt-2 border-t border-border/30">
                          <p className="text-xs text-foreground-tertiary">
                            {appliances.filter(a => a.efficiency === 'excellent' || a.efficiency === 'good').length} of {appliances.length} appliances efficient
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-amber/10 to-accent-pink/10 border border-accent-amber/20">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Target className="h-6 w-6 text-accent-amber" />
                          <h3 className="font-semibold text-accent-amber text-lg">Categories</h3>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{summary?.categories.length || 0}</p>
                        <p className="text-sm text-foreground-secondary">Different appliance types</p>
                        <div className="pt-2 border-t border-border/30">
                          <p className="text-xs text-foreground-tertiary">
                            {summary?.categories.join(', ') || 'No categories'}
                          </p>
                        </div>
                      </div>
                    </div>
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

export default DevicesPage