'use client'
import React, { useState } from 'react'
import { Calendar, Home, Save, History, Plus, Zap, TrendingUp, Clock, CheckCircle, AlertCircle, Camera, Upload } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const ReadingEntryPage: React.FC = () => {
  const [selectedMeter, setSelectedMeter] = useState('main-house')
  const [reading, setReading] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [photoMode, setPhotoMode] = useState(false)

  const meters = [
    { 
      id: 'main-house', 
      name: 'Main House', 
      type: 'Single Phase', 
      lastReading: 15420,
      lastDate: '2024-01-10',
      status: 'active',
      location: 'Ground Floor'
    },
    { 
      id: 'guest-house', 
      name: 'Guest House', 
      type: 'Single Phase', 
      lastReading: 8750,
      lastDate: '2024-01-08',
      status: 'active',
      location: 'Separate Building'
    }
  ]

  const recentReadings = [
    { 
      date: '2024-01-15', 
      meter: 'Main House', 
      reading: 15420, 
      usage: 180, 
      cost: 3200, 
      status: 'verified',
      efficiency: 'good'
    },
    { 
      date: '2024-01-10', 
      meter: 'Main House', 
      reading: 15240, 
      usage: 165, 
      cost: 2950, 
      status: 'verified',
      efficiency: 'excellent'
    },
    { 
      date: '2024-01-05', 
      meter: 'Guest House', 
      reading: 8750, 
      usage: 95, 
      cost: 1700, 
      status: 'pending',
      efficiency: 'good'
    },
    { 
      date: '2024-01-01', 
      meter: 'Main House', 
      reading: 15075, 
      usage: 155, 
      cost: 2780, 
      status: 'verified',
      efficiency: 'fair'
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({ selectedMeter, reading, date, notes })
  }

  const selectedMeterData = meters.find(m => m.id === selectedMeter)
  const calculatedUsage = selectedMeterData && reading ? 
    Math.max(0, parseInt(reading) - selectedMeterData.lastReading) : 0
  const estimatedCost = calculatedUsage * 19.3 // Rs 19.3 per kWh average

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-primary" />
      case 'pending': return <Clock className="h-4 w-4 text-accent-amber" />
      default: return <AlertCircle className="h-4 w-4 text-foreground-tertiary" />
    }
  }

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'text-primary bg-primary/10'
      case 'good': return 'text-accent-blue bg-accent-blue/10'
      case 'fair': return 'text-accent-amber bg-accent-amber/10'
      default: return 'text-foreground-secondary bg-background-secondary'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-20" />
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
                    <Home className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground font-sora">Reading Entry</h1>
                    <p className="text-xl text-foreground-secondary">Record and track your electricity meter readings</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => setPhotoMode(!photoMode)}>
                  <Camera className="h-5 w-5 mr-2" />
                  {photoMode ? 'Manual Entry' : 'Photo Capture'}
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { 
                  title: 'Total Meters', 
                  value: meters.length.toString(), 
                  icon: Home, 
                  gradient: 'from-primary to-accent-cyan',
                  description: 'Active connections'
                },
                { 
                  title: 'This Month', 
                  value: '890', 
                  unit: 'kWh',
                  icon: Zap, 
                  gradient: 'from-accent-blue to-accent-purple',
                  description: 'Current usage'
                },
                { 
                  title: 'Last Reading', 
                  value: '3', 
                  unit: 'days ago',
                  icon: Clock, 
                  gradient: 'from-accent-amber to-accent-pink',
                  description: 'Main house meter'
                },
                { 
                  title: 'Avg. Daily', 
                  value: '28.7', 
                  unit: 'kWh',
                  icon: TrendingUp, 
                  gradient: 'from-accent-emerald to-primary',
                  description: 'This month'
                }
              ].map((stat, index) => (
                <Card key={index} className="card-premium animate-fade-in" >
                  <div style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-xl opacity-20`} />
                        <div className={`relative bg-gradient-to-r ${stat.gradient} p-3 rounded-2xl`}>
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-foreground-secondary text-sm font-medium">{stat.title}</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-foreground font-mono">{stat.value}</span>
                        {stat.unit && <span className="text-foreground-tertiary text-sm">{stat.unit}</span>}
                      </div>
                      <p className="text-xs text-foreground-muted">{stat.description}</p>
                    </div>
                  </div>
                    </div>
                
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Reading Entry Form */}
              <div className="lg:col-span-2">
                <Card className="card-premium">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-3 rounded-2xl">
                        <Plus className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground font-sora">New Reading Entry</h2>
                        <p className="text-foreground-secondary">Add your latest meter reading</p>
                      </div>
                    </div>

                    {/* Meter Selection */}
                    <div className="space-y-4">
                      <label className="text-lg font-semibold text-foreground">Select Meter</label>
                      <div className="grid md:grid-cols-2 gap-4">
                        {meters.map((meter) => (
                          <button
                            key={meter.id}
                            type="button"
                            onClick={() => setSelectedMeter(meter.id)}
                            className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
                              selectedMeter === meter.id
                                ? 'border-primary bg-primary/10 shadow-glow'
                                : 'border-border hover:border-border-light hover:bg-background-card/50'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground text-lg">{meter.name}</h3>
                                <div className={`w-3 h-3 rounded-full ${
                                  meter.status === 'active' ? 'bg-primary' : 'bg-foreground-tertiary'
                                }`} />
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm text-foreground-secondary">{meter.type} • {meter.location}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-foreground-tertiary">Last Reading:</span>
                                  <span className="font-mono font-semibold text-foreground">{meter.lastReading.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-foreground-tertiary">Date:</span>
                                  <span className="text-sm text-foreground">{meter.lastDate}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Date Selection */}
                      <div className="relative">
                        <Input
                          type="date"
                          label="Reading Date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          required
                        />
                        <Calendar className="absolute right-4 top-12 h-5 w-5 text-foreground-tertiary pointer-events-none" />
                      </div>

                      {/* Reading Input */}
                      <div className="relative">
                        <Input
                          type="number"
                          label="Meter Reading (kWh)"
                          placeholder="Enter current reading"
                          value={reading}
                          onChange={(e) => setReading(e.target.value)}
                          required
                        />
                        {photoMode && (
                          <button
                            type="button"
                            className="absolute right-4 top-12 p-1 rounded-lg hover:bg-background-card transition-colors"
                          >
                            <Upload className="h-5 w-5 text-foreground-tertiary" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Usage Calculation */}
                    {reading && selectedMeterData && (
                      <Card className="bg-gradient-to-r from-primary/5 via-accent-blue/5 to-accent-purple/5 border border-primary/20">
                        <div className="space-y-4">
                          <h3 className="font-semibold text-foreground flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <span>Usage Calculation</span>
                          </h3>
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div className="space-y-2">
                              <p className="text-foreground-tertiary text-sm">Previous</p>
                              <p className="font-bold text-foreground text-xl font-mono">
                                {selectedMeterData.lastReading.toLocaleString()}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-foreground-tertiary text-sm">Current</p>
                              <p className="font-bold text-foreground text-xl font-mono">{parseInt(reading).toLocaleString()}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-foreground-tertiary text-sm">Usage</p>
                              <p className="font-bold text-primary text-xl font-mono">{calculatedUsage} kWh</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-foreground-tertiary text-sm">Est. Cost</p>
                              <p className="font-bold text-accent-amber text-xl font-mono">Rs {Math.round(estimatedCost).toLocaleString()}</p>
                            </div>
                          </div>
                          {calculatedUsage > 0 && (
                            <div className="pt-4 border-t border-border/30">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-foreground-secondary">Daily Average:</span>
                                <span className="font-semibold text-foreground">{(calculatedUsage / 30).toFixed(1)} kWh/day</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Notes */}
                    <div className="space-y-3">
                      <label className="text-lg font-semibold text-foreground">Notes (Optional)</label>
                      <textarea
                        placeholder="Add any observations about this reading, meter condition, or unusual circumstances..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="input-field w-full resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" className="w-full premium-button text-lg py-6">
                      <Save className="h-6 w-6 mr-3" />
                      Save Reading Entry
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Recent Readings Sidebar */}
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-2 rounded-xl">
                      <History className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground font-sora">Recent Readings</h2>
                      <p className="text-foreground-secondary text-sm">Latest entries</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {recentReadings.map((entry, index) => (
                      <div key={index} className="p-5 rounded-2xl bg-background-card/30 border border-border/30 space-y-3 hover:bg-background-card/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-foreground">{entry.meter}</span>
                            {getStatusIcon(entry.status)}
                          </div>
                          <span className="text-sm text-foreground-tertiary">{entry.date}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-foreground-tertiary">Reading</p>
                            <p className="font-semibold text-foreground font-mono">{entry.reading.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-foreground-tertiary">Usage</p>
                            <p className="font-semibold text-foreground">{entry.usage} kWh</p>
                          </div>
                          <div>
                            <p className="text-foreground-tertiary">Cost</p>
                            <p className="font-semibold text-primary">Rs {entry.cost.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEfficiencyColor(entry.efficiency)}`}>
                            {entry.efficiency} efficiency
                          </span>
                          <span className="text-xs text-foreground-tertiary capitalize">{entry.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full">
                    <History className="h-4 w-4 mr-2" />
                    View All Readings
                  </Button>
                </div>
              </Card>
            </div>

            {/* Reading Tips */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-emerald to-primary p-2 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground font-sora">Reading Best Practices</h2>
                    <p className="text-foreground-secondary">Tips for accurate meter readings</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      title: 'Consistent Timing',
                      description: 'Take readings at the same time each month for accurate usage tracking',
                      icon: Clock
                    },
                    {
                      title: 'Photo Documentation',
                      description: 'Capture photos of your meter display for verification and record keeping',
                      icon: Camera
                    },
                    {
                      title: 'Note Anomalies',
                      description: 'Record any unusual readings or meter conditions in the notes section',
                      icon: AlertCircle
                    }
                  ].map((tip, index) => (
                    <div key={index} className="p-5 rounded-2xl bg-background-card/30 border border-border/30 space-y-3">
                      <tip.icon className="h-8 w-8 text-primary" />
                      <h3 className="font-semibold text-foreground">{tip.title}</h3>
                      <p className="text-sm text-foreground-secondary leading-relaxed">{tip.description}</p>
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

export default ReadingEntryPage