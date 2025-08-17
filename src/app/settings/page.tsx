'use client'
import React, { useState, useEffect } from 'react'
import { Settings, Target, Save, Zap, DollarSign, Bell, User, Shield, Palette } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { getBudgetFromStorage, setBudgetInStorage } from '../../lib/budgetManager'

const SettingsPage: React.FC = () => {
  const [budget, setBudget] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    notifications: {
      budgetAlerts: true,
      slabWarnings: true,
      weeklyReports: true,
      costSpikes: true
    },
    display: {
      theme: 'dark',
      currency: 'PKR',
      dateFormat: 'DD/MM/YYYY'
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      marketing: false
    }
  })

  // Load budget from localStorage on mount
  useEffect(() => {
    const storedBudget = getBudgetFromStorage()
    if (storedBudget) {
      setBudget(storedBudget.toString())
    }
  }, [])

  // Save budget to localStorage
  const saveBudget = async () => {
    if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
      setStatus('Please enter a valid budget amount.')
      setTimeout(() => setStatus(''), 3000)
      return
    }

    const budgetValue = parseFloat(budget)
    
    if (budgetValue < 1000) {
      setStatus('Budget should be at least Rs 1,000.')
      setTimeout(() => setStatus(''), 3000)
      return
    }

    if (budgetValue > 100000) {
      setStatus('Budget should not exceed Rs 100,000.')
      setTimeout(() => setStatus(''), 3000)
      return
    }

    try {
      setLoading(true)
      setBudgetInStorage(budgetValue)
      setStatus('Budget saved successfully!')
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus('Failed to save budget.')
      setTimeout(() => setStatus(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = (category: string, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-20" />
      
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-3 rounded-2xl">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground font-sora">Settings</h1>
                  <p className="text-xl text-foreground-secondary">Manage your preferences and budget settings</p>
                </div>
              </div>
            </div>

            {/* Budget Settings */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Budget Management</h2>
                    <p className="text-foreground-secondary">Set your monthly electricity bill target</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        label="Monthly Budget (PKR)"
                        type="number"
                        placeholder="e.g., 25000"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        min="1000"
                        max="100000"
                      />
                      <DollarSign className="absolute right-4 top-12 h-5 w-5 text-foreground-tertiary pointer-events-none" />
                    </div>

                    <Button 
                      onClick={saveBudget}
                      disabled={loading}
                      className="w-full"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {loading ? 'Saving...' : 'Save Budget'}
                    </Button>

                    {status && (
                      <div className={`p-3 rounded-lg ${
                        status.includes('successfully') 
                          ? 'bg-primary/10 border border-primary/20 text-primary' 
                          : 'bg-red-500/10 border border-red-500/20 text-red-400'
                      }`}>
                        <p className="text-sm">{status}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Budget Guidelines</h3>
                      </div>
                      <div className="space-y-3 text-sm text-foreground-secondary">
                        <p>• Set a realistic target based on your usage history</p>
                        <p>• Consider seasonal variations (summer AC usage)</p>
                        <p>• Include buffer for unexpected usage spikes</p>
                        <p>• Review and adjust monthly based on patterns</p>
                      </div>
                      {budget && !isNaN(parseFloat(budget)) && parseFloat(budget) > 0 && (
                        <div className="pt-3 border-t border-border/30">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Daily Budget:</span>
                              <span className="font-semibold">Rs {Math.round(parseFloat(budget) / 30)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Weekly Budget:</span>
                              <span className="font-semibold">Rs {Math.round(parseFloat(budget) / 4.3)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notification Preferences */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-2 rounded-xl">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Notifications</h2>
                    <p className="text-foreground-secondary">Manage your alert preferences</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(preferences.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-background-card/30 border border-border/30">
                      <div>
                        <p className="font-medium text-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {key === 'budgetAlerts' && 'Get notified when approaching budget limits'}
                          {key === 'slabWarnings' && 'Alerts when approaching higher tariff slabs'}
                          {key === 'weeklyReports' && 'Weekly usage and cost summaries'}
                          {key === 'costSpikes' && 'Notifications for unusual cost increases'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updatePreference('notifications', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-background-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Display Preferences */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
                    <Palette className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Display Preferences</h2>
                    <p className="text-foreground-secondary">Customize your app experience</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary">Theme</label>
                    <select
                      value={preferences.display.theme}
                      onChange={(e) => updatePreference('display', 'theme', e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="dark">Dark Mode</option>
                      <option value="light">Light Mode</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary">Currency</label>
                    <select
                      value={preferences.display.currency}
                      onChange={(e) => updatePreference('display', 'currency', e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="PKR">Pakistani Rupee (PKR)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary">Date Format</label>
                    <select
                      value={preferences.display.dateFormat}
                      onChange={(e) => updatePreference('display', 'dateFormat', e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Privacy Settings */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-accent-emerald to-primary p-2 rounded-xl">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Privacy & Data</h2>
                    <p className="text-foreground-secondary">Control how your data is used</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(preferences.privacy).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-background-card/30 border border-border/30">
                      <div>
                        <p className="font-medium text-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {key === 'dataSharing' && 'Share anonymized usage data for research'}
                          {key === 'analytics' && 'Allow usage analytics for personalized insights'}
                          {key === 'marketing' && 'Receive promotional emails and offers'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updatePreference('privacy', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-background-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Save All Settings */}
            <div className="flex justify-end">
              <Button className="premium-button">
                <Save className="h-5 w-5 mr-2" />
                Save All Settings
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SettingsPage