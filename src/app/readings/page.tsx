'use client'
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Home, Save, History, Plus, Zap, TrendingUp, Clock, CheckCircle, AlertCircle, Camera, Upload, RefreshCw, Hash } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { tariffEngine, calculateUsage, getSlabWarningMessage } from '../../lib/tariffEngine'

const ReadingEntryPage: React.FC = () => {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Form state
  const [selectedMeter, setSelectedMeter] = useState('main-house')
  const [week, setWeek] = useState(Math.ceil(new Date().getDate() / 7))
  const [reading, setReading] = useState('')
  const [isOfficialEndOfMonth, setIsOfficialEndOfMonth] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [photoMode, setPhotoMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  // Data state
  const [meters, setMeters] = useState<any[]>([])
  const [recentReadings, setRecentReadings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch meters and readings
  useEffect(() => {
  const fetchData = async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      setError(null);

      const metersResponse = await fetch('/api/meters');
      if (!metersResponse.ok) throw new Error('Failed to fetch meters');
      const metersData = await metersResponse.json();

      const readingsResponse = await fetch('/api/readings?limit=10');
      if (!readingsResponse.ok) throw new Error('Failed to fetch readings');
      const readingsData = await readingsResponse.json();

      setMeters(metersData.meters || []);
      setRecentReadings(readingsData.readings || []);

      if (metersData.meters && metersData.meters.length > 0) {
        setSelectedMeter(metersData.meters[0].id);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [session?.user?.id]);

  // Refresh readings data
  const refreshReadings = async () => {
    try {
      setRefreshing(true);
      const readingsResponse = await fetch('/api/readings?limit=10');
      if (!readingsResponse.ok) throw new Error('Failed to fetch readings');
      const readingsData = await readingsResponse.json();
      setRecentReadings(readingsData.readings || []);
    } catch (err) {
      console.error('Failed to refresh readings:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitReading()
  }

 const submitReading = async () => {
  if (!selectedMeter || !reading || !date) {
    setSubmitError('Please fill in all required fields')
    return
  }

  try {
    setSubmitting(true)
    setSubmitError(null)

    const readingDate = new Date(date)
    const month = readingDate.getMonth() + 1
    const year = readingDate.getFullYear()
    const calculatedWeek = week || Math.ceil(readingDate.getDate() / 7)

    const response = await fetch('/api/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meterId: selectedMeter,
        reading: parseFloat(reading),
        week: calculatedWeek,
        month,
        year,
        isOfficialEndOfMonth,
        notes: notes.trim() || undefined,
        date: readingDate.toISOString(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to submit reading')
    }

    const data = await response.json()
    
    // Add the new reading to the top of the list
    setRecentReadings(prev => [data.reading, ...prev.slice(0, 9)]);
    
    // Update the meter's last reading

    setMeters(ms => ms.map(m => m.id === selectedMeter ? { ...m, lastReading: parseFloat(reading) } : m))

    setReading('')
    setNotes('')
    setIsOfficialEndOfMonth(false)
    setDate(new Date().toISOString().split('T')[0])
    setWeek(Math.ceil(new Date().getDate() / 7))

    // Show success message
    const successMsg = `Reading submitted successfully! Usage: ${data.reading.usage || 0} kWh, Cost: Rs ${(data.reading.estimatedCost || 0).toLocaleString()}`;
    alert(successMsg);
    
  } catch (err) {
    setSubmitError(err instanceof Error ? err.message : 'Failed to submit reading')
  } finally {
    setSubmitting(false)
  }
}

  const selectedMeterData = meters.find(m => m.id === selectedMeter)
  
  // Calculate usage and cost for preview
  const calculatedUsage = selectedMeterData && reading ? calculateUsage(parseFloat(reading), selectedMeterData.lastReading || 0) : 0;
  const calculatedCost = calculatedUsage > 0 ? tariffEngine(calculatedUsage) : null;
  
  // Calculate projected monthly usage for warnings
  const currentDate = new Date()
  const daysElapsed = currentDate.getDate()
  const projectedMonthlyUsage = calculatedUsage > 0 ? (calculatedUsage / daysElapsed) * 30 : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': 
      case 'active': return <CheckCircle className="h-4 w-4 text-primary" />
      case 'pending': 
      case 'inactive': return <Clock className="h-4 w-4 text-accent-amber" />
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
                <Button variant="outline" onClick={() => router.push('/meters')}>
                  <Home className="h-5 w-5 mr-2" />
                  Manage Meters
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
                  value: recentReadings.length > 0 ? Math.round(recentReadings.reduce((sum, r) => sum + (r.usage || 0), 0)).toString() : '0',
                  unit: 'kWh',
                  icon: Zap, 
                  gradient: 'from-accent-blue to-accent-purple',
                  description: 'Current usage'
                },
                { 
                  title: 'Last Reading', 
                  value: recentReadings.length > 0 ? 
                    Math.ceil((Date.now() - new Date(recentReadings[0].date).getTime()) / (1000 * 60 * 60 * 24)).toString() : 
                    'No',
                  unit: recentReadings.length > 0 ? 'days ago' : 'readings',
                  icon: Clock, 
                  gradient: 'from-accent-amber to-accent-pink',
                  description: recentReadings.length > 0 ? recentReadings[0].meter.label : 'Add first reading'
                },
                { 
                  title: 'Avg. Daily', 
                  value: recentReadings.length > 0 ? (recentReadings.reduce((sum, r) => sum + (r.usage || 0), 0) / 30).toFixed(1) : '0',
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
                      {meters.length > 0 ? (
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
                                  <h3 className="font-semibold text-foreground text-lg">{meter.label}</h3>
                                  <div className={`w-3 h-3 rounded-full ${
                                    meter.status === 'active' ? 'bg-primary' : 'bg-foreground-tertiary'
                                  }`} />
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-foreground-secondary">{meter.type}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-foreground-tertiary">Last Reading:</span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {meter.lastReading ? meter.lastReading.toLocaleString() : 'No readings'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-foreground-tertiary">Date:</span>
                                    <span className="text-sm text-foreground">
                                      {meter.lastReadingDate ? 
                                        new Date(meter.lastReadingDate).toLocaleDateString() : 
                                        'Never'
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl">
                          <Home className="h-12 w-12 mx-auto text-foreground-tertiary mb-4" />
                          <p className="text-foreground-secondary mb-4">No meters found</p>
                          <button
                            onClick={() => router.push('/meters')}
                            className="text-primary hover:text-primary-light font-semibold"
                          >
                            Add your first meter to get started
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Date Selection */}
                      <div className="relative">
                        <Input
                          type="date"
                          label="Reading Date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          required
                        />
                        
                      </div>

                      {/* Week Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-secondary">Week of Month</label>
                        <select
                          value={week}
                          onChange={(e) => setWeek(parseInt(e.target.value))}
                          className="input-field w-full"
                        >
                          {[1, 2, 3, 4, 5].map(w => (
                            <option key={w} value={w}>Week {w}</option>
                          ))}
                        </select>
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

                    {/* Official End of Month Checkbox */}
                    <div className="flex items-center space-x-3 p-4 rounded-2xl bg-background-card/30 border border-border/30">
                      <input
                        type="checkbox"
                        id="isOfficialEndOfMonth"
                        checked={isOfficialEndOfMonth}
                        onChange={(e) => setIsOfficialEndOfMonth(e.target.checked)}
                        className="w-5 h-5 rounded border-border bg-background-card text-primary focus:ring-primary/20"
                      />
                      <div>
                        <label htmlFor="isOfficialEndOfMonth" className="font-medium text-foreground cursor-pointer">
                          Official End-of-Month Reading
                        </label>
                        <p className="text-sm text-foreground-secondary">
                          Check this if this is your official monthly reading for bill calculation
                        </p>
                      </div>
                    </div>

                    {/* Cost Preview */}
                    {reading && selectedMeterData && calculatedUsage > 0 && calculatedCost && (
                      <Card className="bg-gradient-to-r from-primary/10 to-accent-cyan/10 border border-primary/20">
                        <div className="space-y-4">
                          <h3 className="font-semibold text-foreground flex items-center space-x-2">
                            <Zap className="h-5 w-5 text-primary" />
                            <span>Cost Preview</span>
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 rounded-xl bg-background-card/50">
                              <p className="text-sm text-foreground-secondary">Usage</p>
                              <p className="text-2xl font-bold text-foreground">{calculatedUsage} kWh</p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-background-card/50">
                              <p className="text-sm text-foreground-secondary">Estimated Cost</p>
                              <p className="text-2xl font-bold text-primary">Rs {Math.round(calculatedCost.totalCost).toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Slab Warning */}
                          {(() => {
                            const warningMessage = getSlabWarningMessage(calculatedUsage)
                            if (warningMessage) {
                              return (
                                <div className="p-3 rounded-xl bg-accent-amber/10 border border-accent-amber/20">
                                  <div className="flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4 text-accent-amber" />
                                    <p className="text-sm text-accent-amber font-medium">Slab Warning</p>
                                  </div>
                                  <p className="text-sm text-foreground-secondary mt-1">{warningMessage}</p>
                                </div>
                              )
                            }
                            return null
                          })()}
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

                    {/* Error Display */}
                    {submitError && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                          <p className="text-red-400">{submitError}</p>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full premium-button text-lg py-6"
                      disabled={submitting || !selectedMeter || !reading || meters.length === 0}
                    >
                      <Save className="h-6 w-6 mr-3" />
                      {submitting ? 'Saving...' : `Save ${isOfficialEndOfMonth ? 'Official' : 'Weekly'} Reading`}
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
                  
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={refreshReadings} disabled={refreshing}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {recentReadings.length > 0 ? recentReadings.map((entry, index) => (
                      <div key={index} className="p-5 rounded-2xl bg-background-card/30 border border-border/30 space-y-3 hover:bg-background-card/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-foreground">{entry.meter.label}</span>
                            {entry.isOfficialEndOfMonth && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                Official
                              </span>
                            )}
                            {getStatusIcon('verified')}
                          </div>
                          <span className="text-sm text-foreground-tertiary">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-foreground-tertiary">Week</p>
                            <p className="font-semibold text-foreground">Week {entry.week || 1}</p>
                          </div>
                          <div>
                            <p className="text-foreground-tertiary">Reading</p>
                            <p className="font-semibold text-foreground font-mono">{entry.reading?.toLocaleString() || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-foreground-tertiary">Usage</p>
                            <p className="font-semibold text-foreground">{entry.usage?.toFixed(1) || '0'} kWh</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/30">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-foreground-secondary">Estimated Cost:</span>
                            <span className="font-bold text-primary">Rs {Math.round(entry.estimatedCost || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEfficiencyColor('good')}`}>
                            good efficiency
                          </span>
                          <span className="text-xs text-foreground-tertiary capitalize">verified</span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 mx-auto text-foreground-tertiary mb-4" />
                        <p className="text-foreground-secondary">No readings recorded yet</p>
                        <p className="text-sm text-foreground-tertiary">Submit your first reading to get started</p>
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/analytics')}
                  >
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
                      description: 'Take readings at consistent intervals (weekly) for accurate usage tracking',
                      icon: Clock
                    },
                    {
                      title: 'Photo Documentation',
                      description: 'Capture photos of your meter display for verification and record keeping',
                      icon: Camera
                    },
                    {
                      title: 'Note Anomalies',
                      description: 'Record any unusual readings, meter conditions, or special circumstances',
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