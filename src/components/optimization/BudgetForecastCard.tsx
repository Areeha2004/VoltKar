import React, { useState, useEffect } from 'react'
import { Target, TrendingUp, DollarSign, Calendar, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import Card from '../ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface BudgetForecastCardProps {
  budget?: number
  currentCost: number
  projectedCost: number
  daysElapsed: number
  daysRemaining: number
  meters?: any[]
  className?: string
}

const BudgetForecastCard: React.FC<BudgetForecastCardProps> = ({
  budget,
  currentCost,
  projectedCost,
  daysElapsed,
  daysRemaining,
  meters = [],
  className = ''
}) => {
  const [forecastData, setForecastData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchForecastData = async () => {
      try {
        const response = await fetch('/api/forecast/bill')
        if (response.ok) {
          const data = await response.json()
          setForecastData(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch forecast data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchForecastData()
  }, [])

  const dailyBudget = budget ? budget / 30 : 0
  const averageDailyCost = daysElapsed > 0 ? currentCost / daysElapsed : 0
  const remainingBudget = budget ? Math.max(0, budget - currentCost) : 0
  const budgetProgress = budget ? (currentCost / budget) * 100 : 0
  const isOverBudget = budget ? projectedCost > budget : false

  // Prepare chart data
  const chartData = forecastData ? [
    { scenario: 'Low', cost: forecastData.forecast.bill.low, usage: forecastData.forecast.usage.low },
    { scenario: 'Expected', cost: forecastData.forecast.bill.expected, usage: forecastData.forecast.usage.expected },
    { scenario: 'High', cost: forecastData.forecast.bill.high, usage: forecastData.forecast.usage.high }
  ] : []

  // Per-meter breakdown if available
  const meterBreakdown = meters.map(meter => ({
    name: meter.label || meter.id,
    projected: meter.projectedCost || 0,
    current: meter.currentUsage || 0
  }))

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

  return (
    <Card className={`card-premium ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-primary to-accent-cyan p-3 rounded-2xl">
              <Target className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-foreground font-sora">Budget & Forecast Summary</h3>
              <p className="text-foreground-secondary">Current status and projections</p>
            </div>
          </div>
          {budget && (
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">Rs {budget.toLocaleString()}</p>
              <p className="text-sm text-foreground-secondary">Monthly budget</p>
            </div>
          )}
        </div>

        {/* Budget Progress */}
        {budget && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Budget Progress</span>
              <span className="font-medium text-foreground">
                Rs {currentCost.toLocaleString()} / Rs {budget.toLocaleString()}
              </span>
            </div>
            
            <div className="relative">
              <div className="w-full bg-background-secondary rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    isOverBudget ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    budgetProgress > 80 ? 'bg-gradient-to-r from-accent-amber to-red-500' :
                    'bg-gradient-to-r from-primary to-accent-cyan'
                  }`}
                  style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                />
              </div>
              
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-lg"
                style={{ left: `${Math.min(budgetProgress, 95)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-foreground-tertiary">
              <span>Rs 0</span>
              <span>{budgetProgress.toFixed(1)}% used</span>
              <span>Rs {budget.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-2xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Current Spent</p>
            <p className="text-xl font-bold text-foreground">Rs {currentCost.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Projected Total</p>
            <p className={`text-xl font-bold ${isOverBudget ? 'text-red-400' : 'text-primary'}`}>
              Rs {projectedCost.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Daily Average</p>
            <p className="text-xl font-bold text-foreground">Rs {Math.round(averageDailyCost)}</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Days Remaining</p>
            <p className="text-xl font-bold text-foreground">{daysRemaining}</p>
          </div>
        </div>

        {/* Forecast Scenarios Chart */}
        {chartData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-accent-blue" />
              <h4 className="font-semibold text-foreground">Forecast Scenarios</h4>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                  <XAxis dataKey="scenario" stroke="#6b6b7d" />
                  <YAxis stroke="#6b6b7d" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#141417', 
                      border: '1px solid #2a2a30',
                      borderRadius: '12px',
                      color: '#ffffff'
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'cost' ? `Rs ${value.toLocaleString()}` : `${value} kWh`,
                      name === 'cost' ? 'Cost' : 'Usage'
                    ]}
                  />
                  <Bar dataKey="cost" fill="#00d4aa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Per-Meter Breakdown */}
        {meterBreakdown.length > 1 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-accent-purple" />
              <h4 className="font-semibold text-foreground">Per-Meter Projections</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {meterBreakdown.map((meter, index) => (
                <div key={index} className="p-4 rounded-2xl bg-background-card/30 border border-border/30">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-foreground">{meter.name}</h5>
                      <span className="text-sm text-foreground-secondary">{meter.current} kWh MTD</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground-secondary">Projected Cost:</span>
                      <span className="font-bold text-primary">Rs {meter.projected.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Alert */}
        {budget && isOverBudget && (
          <div className="p-5 rounded-2xl border-l-4 border-l-red-500 bg-red-500/10">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-red-500">Budget Overrun Alert</h4>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  Your projected cost (Rs {projectedCost.toLocaleString()}) exceeds your budget by Rs {(projectedCost - budget).toLocaleString()}.
                  Consider implementing optimization recommendations immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {budget && !isOverBudget && budgetProgress < 80 && (
          <div className="p-5 rounded-2xl border-l-4 border-l-primary bg-primary/10">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-primary">On Track</h4>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  You're on track to stay within your budget. Keep up the good work!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default BudgetForecastCard