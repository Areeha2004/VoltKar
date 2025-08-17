import React, { useState, useEffect } from 'react'
import { TrendingUp, Target, AlertTriangle, CheckCircle, Calendar, Zap } from 'lucide-react'
import Card from '../ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ForecastCardProps {
  meterId?: string
  className?: string
}

const ForecastCard: React.FC<ForecastCardProps> = ({ meterId, className = '' }) => {
  const [forecastData, setForecastData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true)
        const params = meterId ? `?meterId=${meterId}` : ''
        const response = await fetch(`/api/forecast/bill${params}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch forecast')
        }
        
        const data = await response.json()
        setForecastData(data.data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load forecast')
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()
  }, [meterId])

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

  if (error || !forecastData) {
    return (
      <Card className={`card-premium ${className}`}>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <p className="text-red-400 mb-4">{error || 'No forecast data available'}</p>
        </div>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = [
    { 
      scenario: 'Low', 
      usage: forecastData.forecast.usage.low, 
      cost: forecastData.forecast.bill.low,
      probability: 20
    },
    { 
      scenario: 'Expected', 
      usage: forecastData.forecast.usage.expected, 
      cost: forecastData.forecast.bill.expected,
      probability: 60
    },
    { 
      scenario: 'High', 
      usage: forecastData.forecast.usage.high, 
      cost: forecastData.forecast.bill.high,
      probability: 20
    }
  ]

  const isOverBudget = forecastData.comparison.vsLastMonth > 0
  const confidenceLevel = forecastData.confidence?.level || 75

  return (
    <Card className={`card-premium ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground font-sora">Monthly Forecast</h3>
              <p className="text-foreground-secondary">AI-powered bill prediction</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              confidenceLevel >= 80 ? 'bg-primary/10 text-primary' :
              confidenceLevel >= 60 ? 'bg-accent-amber/10 text-accent-amber' :
              'bg-red-500/10 text-red-400'
            }`}>
              {confidenceLevel}% Confidence
            </div>
          </div>
        </div>

        {/* Forecast Scenarios */}
        <div className="grid grid-cols-3 gap-4">
          {chartData.map((scenario, index) => (
            <div key={scenario.scenario} className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
              scenario.scenario === 'Expected' 
                ? 'border-primary bg-primary/10' 
                : 'border-border bg-background-card/30'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{scenario.scenario}</span>
                  <span className="text-xs text-foreground-secondary">{scenario.probability}%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Usage:</span>
                    <span className="font-semibold text-foreground">{scenario.usage} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Cost:</span>
                    <span className="font-bold text-primary">Rs {scenario.cost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Forecast Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
              />
              <Line 
                type="monotone" 
                dataKey="cost" 
                stroke="#00d4aa" 
                strokeWidth={3}
                dot={{ fill: '#00d4aa', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#00d4aa', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Current vs Projected */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-background-card/30">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-accent-blue" />
                <span className="text-sm font-medium text-foreground-secondary">Month to Date</span>
              </div>
              <p className="text-2xl font-bold text-foreground">Rs {Math.round(forecastData.current.mtdCost).toLocaleString()}</p>
              <p className="text-sm text-foreground-secondary">{forecastData.current.mtdUsage} kWh used</p>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-background-card/30">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground-secondary">Projected Total</span>
              </div>
              <p className="text-2xl font-bold text-primary">Rs {forecastData.forecast.bill.expected.toLocaleString()}</p>
              <p className="text-sm text-foreground-secondary">{forecastData.forecast.usage.expected} kWh projected</p>
            </div>
          </div>
        </div>

        {/* Comparison with Last Month */}
        {forecastData.comparison.vsLastMonth !== null && (
          <div className={`p-4 rounded-2xl border-l-4 ${
            isOverBudget 
              ? 'border-l-red-500 bg-red-500/5' 
              : 'border-l-primary bg-primary/5'
          }`}>
            <div className="flex items-center space-x-3">
              {isOverBudget ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-primary" />
              )}
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {isOverBudget ? 'Cost Increase Alert' : 'Cost Savings'}
                </p>
                <p className="text-sm text-foreground-secondary">
                  {isOverBudget ? 'Projected to be' : 'Projected to save'} {' '}
                  <span className={`font-medium ${isOverBudget ? 'text-red-400' : 'text-primary'}`}>
                    {Math.abs(forecastData.comparison.vsLastMonth)}% 
                  </span>
                  {' '}vs last month (Rs {Math.abs(forecastData.comparison.difference).toLocaleString()})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Savings Opportunities */}
        {forecastData.savings && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Potential Savings</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-background-card/50 text-center">
                <p className="text-sm text-foreground-secondary">10% Reduction</p>
                <p className="text-lg font-bold text-primary">Rs {forecastData.savings.potential.reduce10Percent}</p>
              </div>
              <div className="p-3 rounded-xl bg-background-card/50 text-center">
                <p className="text-sm text-foreground-secondary">20% Reduction</p>
                <p className="text-lg font-bold text-primary">Rs {forecastData.savings.potential.reduce20Percent}</p>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Factors */}
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-accent-blue" />
              <span className="text-foreground-secondary">
                Based on {forecastData.current.daysElapsed} days of data
              </span>
            </div>
            <span className="text-foreground-tertiary">
              Updated {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ForecastCard