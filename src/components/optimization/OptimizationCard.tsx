import React from 'react'
import { Brain, Target, Lightbulb, TrendingUp, CheckCircle, Clock, DollarSign } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'

interface OptimizationSuggestion {
  recommendation: {
    meter_strategy: string
    slab_advice: string
    appliance_tips: string[]
    expected_savings: string
  }
  insights: {
    budget_status: string
    efficiency_score: number
    peak_optimization_potential: number
    slab_optimization_score: number
  }
  priority_actions: Array<{
    action: string
    impact: string
    difficulty: string
    timeframe: string
  }>
}

interface OptimizationCardProps {
  suggestion: OptimizationSuggestion
  onApplyAction?: (action: string) => void
  className?: string
}

const OptimizationCard: React.FC<OptimizationCardProps> = ({
  suggestion,
  onApplyAction,
  className = ''
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-primary bg-primary/10'
      case 'Medium': return 'text-accent-amber bg-accent-amber/10'
      case 'Hard': return 'text-red-500 bg-red-500/10'
      default: return 'text-foreground-secondary bg-background-secondary'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'text-primary bg-primary/10'
      case 'over_budget': return 'text-red-500 bg-red-500/10'
      case 'under_budget': return 'text-accent-blue bg-accent-blue/10'
      default: return 'text-foreground-secondary bg-background-secondary'
    }
  }

  return (
    <Card className={`card-premium ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-3 rounded-2xl">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground font-sora">AI Optimization Plan</h3>
            <p className="text-foreground-secondary">Personalized recommendations for maximum savings</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Budget Status</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(suggestion.insights.budget_status)}`}>
              {suggestion.insights.budget_status.replace('_', ' ')}
            </span>
          </div>
          <div className="text-center p-3 rounded-xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Efficiency</p>
            <p className="text-lg font-bold text-foreground">{Math.round(suggestion.insights.efficiency_score)}%</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Peak Optimization</p>
            <p className="text-lg font-bold text-foreground">{suggestion.insights.peak_optimization_potential}%</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Slab Score</p>
            <p className="text-lg font-bold text-foreground">{suggestion.insights.slab_optimization_score}%</p>
          </div>
        </div>

        {/* Main Recommendations */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Meter Strategy */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">Meter Strategy</h4>
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
              <p className="text-foreground-secondary leading-relaxed">
                {suggestion.recommendation.meter_strategy}
              </p>
            </div>
          </div>

          {/* Slab Advice */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-accent-blue" />
              <h4 className="font-semibold text-foreground">Slab Optimization</h4>
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border border-accent-blue/20">
              <p className="text-foreground-secondary leading-relaxed">
                {suggestion.recommendation.slab_advice}
              </p>
            </div>
          </div>
        </div>

        {/* Appliance Tips */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-accent-amber" />
            <h4 className="font-semibold text-foreground">Smart Appliance Tips</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {suggestion.recommendation.appliance_tips.map((tip, index) => (
              <div key={index} className="p-4 rounded-2xl bg-background-card/30 border border-border/30 space-y-2">
                <div className="flex items-start space-x-3">
                  <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-2 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm text-foreground-secondary leading-relaxed">{tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expected Savings */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-accent-emerald/10 to-primary/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-accent-emerald to-primary p-3 rounded-2xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-foreground">Expected Savings</h4>
                <p className="text-foreground-secondary">Following all recommendations</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">
                {suggestion.recommendation.expected_savings}
              </p>
              <p className="text-sm text-foreground-secondary">Potential monthly savings</p>
            </div>
          </div>
        </div>

        {/* Priority Actions */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Priority Actions</h4>
          <div className="space-y-3">
            {suggestion.priority_actions.map((action, index) => (
              <div key={index} className="p-5 rounded-2xl bg-background-card/30 border border-border/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h5 className="font-semibold text-foreground">{action.action}</h5>
                    <p className="text-sm text-foreground-secondary">Impact: {action.impact}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(action.difficulty)}`}>
                      {action.difficulty}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent-blue/10 text-accent-blue">
                      {action.timeframe}
                    </span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => onApplyAction?.(action.action)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply This Action
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default OptimizationCard