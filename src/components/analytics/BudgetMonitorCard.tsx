import React, { useState, useEffect } from 'react'
import { Target, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Calendar, Settings } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'

interface BudgetMonitorCardProps {
  meterId?: string
  budget?: number
  onBudgetChange?: (newBudget: number) => void
  className?: string
}

const BudgetMonitorCard: React.FC<BudgetMonitorCardProps> = ({
  meterId,
  budget = 25000,
  onBudgetChange,
  className = ''
}) => {
  const [monitorData, setMonitorData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAdjustments, setShowAdjustments] = useState(false)

  useEffect(() => {
    const fetchMonitorData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          budget: budget.toString(),
          ...(meterId && { meterId })
        })
        
        const response = await fetch(`/api/budget/monitor?${params}`)
        
        if (response.ok) {
          const data = await response.json()
          setMonitorData(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch budget monitor data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMonitorData()
  }, [meterId, budget])

  if (loading) {
    return (
      <Card className={`card-premium ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-background-card rounded w-1/2"></div>
          <div className="h-32 bg-background-card rounded"></div>
        </div>
      </Card>
    )
  }

  if (!monitorData) return null

  const progressPercentage = (monitorData.budget.spent / monitorData.budget.target) * 100
  const isOverBudget = monitorData.budget.spent > monitorData.budget.target
  const hasAlerts = monitorData.alerts && monitorData.alerts.length > 0

  const getProgressColor = () => {
    if (isOverBudget) return 'from-red-500 to-red-600'
    if (progressPercentage > 90) return 'from-accent-amber to-red-500'
    if (progressPercentage > 75) return 'from-accent-amber to-accent-pink'
    return 'from-primary to-accent-cyan'
  }

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-500/5'
      case 'high': return 'border-l-red-400 bg-red-400/5'
      case 'medium': return 'border-l-accent-amber bg-accent-amber/5'
      case 'low': return 'border-l-accent-blue bg-accent-blue/5'
      default: return 'border-l-border bg-background-secondary'
    }
  }

  return (
    <Card className={`card-premium ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground font-sora">Budget Monitor</h3>
              <p className="text-foreground-secondary">Real-time budget tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              monitorData.budget.efficiency >= 80 ? 'bg-primary/10 text-primary' :
              monitorData.budget.efficiency >= 60 ? 'bg-accent-amber/10 text-accent-amber' :
              'bg-red-500/10 text-red-400'
            }`}>
              {monitorData.budget.grade}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowAdjustments(!showAdjustments)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-foreground-secondary">Monthly Progress</span>
            <span className="font-medium text-foreground">
              Rs {monitorData.budget.spent.toLocaleString()} / Rs {monitorData.budget.target.toLocaleString()}
            </span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-background-secondary rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${getProgressColor()}`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            
            {/* Progress indicator */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-lg"
              style={{ left: `${Math.min(progressPercentage, 95)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-foreground-tertiary">
            <span>Rs 0</span>
            <span>{progressPercentage.toFixed(1)}% used</span>
            <span>Rs {monitorData.budget.target.toLocaleString()}</span>
          </div>
        </div>

        {/* Budget Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Remaining</p>
            <p className="text-lg font-bold text-primary">Rs {monitorData.budget.remaining.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Projected</p>
            <p className={`text-lg font-bold ${isOverBudget ? 'text-red-400' : 'text-foreground'}`}>
              Rs {monitorData.budget.projected.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Daily Avg</p>
            <p className="text-lg font-bold text-foreground">Rs {monitorData.daily.average}</p>
          </div>
        </div>

        {/* Daily Budget Tracking */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-background-card/50 to-background-secondary/50 border border-border/50">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-accent-blue" />
              <span className="font-medium text-foreground">Daily Budget Status</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Daily Target:</span>
                <span className="font-semibold text-foreground">Rs {monitorData.daily.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Remaining Daily:</span>
                <span className={`font-semibold ${
                  monitorData.daily.remaining > 0 ? 'text-primary' : 'text-red-400'
                }`}>
                  Rs {monitorData.daily.remaining}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {hasAlerts && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Active Alerts</h4>
            <div className="space-y-2">
              {monitorData.alerts.slice(0, 2).map((alert: any, index: number) => (
                <div key={index} className={`p-4 rounded-xl border-l-4 ${getAlertSeverityColor(alert.severity)}`}>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-red-500' :
                      alert.severity === 'high' ? 'text-red-400' :
                      alert.severity === 'medium' ? 'text-accent-amber' :
                      'text-accent-blue'
                    }`} />
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground text-sm">{alert.title}</p>
                      <p className="text-xs text-foreground-secondary">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Adjustments */}
        {showAdjustments && monitorData.adjustments && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 border border-accent-blue/20">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-accent-blue" />
                <span className="font-medium text-foreground">Budget Adjustment Suggestions</span>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-background-card/50">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground-secondary">Recommended Budget:</span>
                    <span className="font-bold text-primary">Rs {monitorData.adjustments.recommendedBudget.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-foreground-tertiary mt-1">{monitorData.adjustments.adjustmentReason}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Alternatives:</p>
                  {monitorData.adjustments.alternatives.slice(0, 2).map((alt: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-background-card/30">
                      <span className="text-sm text-foreground-secondary">{alt.description}</span>
                      <span className="font-medium text-foreground">Rs {alt.budget.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {monitorData.recommendations && monitorData.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Recommendations</h4>
            <div className="space-y-2">
              {monitorData.recommendations.slice(0, 3).map((rec: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 p-3 rounded-lg bg-background-card/30">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-foreground-secondary">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-border/30">
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground-tertiary">
              {monitorData.daily.daysLeft} days remaining
            </span>
            <span className="text-foreground-tertiary">
              Updated {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default BudgetMonitorCard