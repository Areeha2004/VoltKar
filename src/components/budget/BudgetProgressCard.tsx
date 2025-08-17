import React from 'react'
import { Target, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Calendar } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { BudgetStatus } from '../../lib/budgetManager'

interface BudgetProgressCardProps {
  budgetStatus: BudgetStatus
  onSetBudget: () => void
  className?: string
}

const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  budgetStatus,
  onSetBudget,
  className = ''
}) => {
  if (!budgetStatus.hasTarget) {
    return (
      <Card className={`card-premium ${className}`}>
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-primary/20 to-accent-cyan/20 p-6 rounded-3xl w-fit mx-auto">
              <Target className="h-12 w-12 text-primary mx-auto" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-foreground">Set Your Monthly Budget</h3>
              <p className="text-foreground-secondary max-w-md mx-auto leading-relaxed">
                Track your electricity spending and get alerts when approaching your limit. 
                Set a realistic monthly budget to avoid bill surprises.
              </p>
            </div>
            <Button 
              className="premium-button"
              onClick={onSetBudget}
            >
              <Target className="h-5 w-5 mr-2" />
              Set Monthly Budget
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const getProgressColor = () => {
    if (budgetStatus.alertLevel === 'critical') return 'from-red-500 to-red-600'
    if (budgetStatus.alertLevel === 'warning') return 'from-accent-amber to-red-500'
    return 'from-primary to-accent-cyan'
  }

  const getAlertIcon = () => {
    switch (budgetStatus.alertLevel) {
      case 'critical':
        return <AlertTriangle className="h-6 w-6 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-accent-amber" />
      default:
        return <CheckCircle className="h-6 w-6 text-primary" />
    }
  }

  return (
    <Card className={`card-premium ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Monthly Budget</h3>
              <p className="text-sm text-foreground-secondary">Rs {budgetStatus.budgetRs?.toLocaleString()} target</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getAlertIcon()}
            <Button variant="ghost" size="sm" onClick={onSetBudget}>
              Edit
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-secondary">Progress</span>
            <span className="text-foreground font-medium">
              Rs {budgetStatus.currentCost.toLocaleString()} / Rs {budgetStatus.budgetRs?.toLocaleString()}
            </span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-background-secondary rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${getProgressColor()}`}
                style={{ width: `${Math.min(budgetStatus.costProgress, 100)}%` }}
              />
            </div>
            
            {/* Progress indicator */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-lg"
              style={{ left: `${Math.min(budgetStatus.costProgress, 95)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-foreground-tertiary">
            <span>Rs 0</span>
            <span>{budgetStatus.costProgress.toFixed(1)}% used</span>
            <span>Rs {budgetStatus.budgetRs?.toLocaleString()}</span>
          </div>
        </div>

        {/* Budget Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Spent</p>
            <p className="text-lg font-bold text-foreground">Rs {budgetStatus.currentCost.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Remaining</p>
            <p className="text-lg font-bold text-primary">Rs {budgetStatus.remainingBudget.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Projected</p>
            <p className={`text-lg font-bold ${budgetStatus.onTrack ? 'text-primary' : 'text-red-400'}`}>
              Rs {budgetStatus.projectedCost.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Daily Budget Tracking */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-background-card/50 to-background-secondary/50 border border-border/50">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-accent-blue" />
              <span className="font-medium text-foreground">Daily Budget Tracking</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Daily Target:</span>
                <span className="font-semibold text-foreground">Rs {budgetStatus.dailyBudget}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Daily Average:</span>
                <span className={`font-semibold ${
                  budgetStatus.averageDailyCost > budgetStatus.dailyBudget ? 'text-red-400' : 'text-primary'
                }`}>
                  Rs {budgetStatus.averageDailyCost}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Alert */}
        {budgetStatus.alertLevel !== 'none' && (
          <div className={`p-4 rounded-2xl border-l-4 ${
            budgetStatus.alertLevel === 'critical' 
              ? 'border-l-red-500 bg-red-500/10' 
              : 'border-l-accent-amber bg-accent-amber/10'
          }`}>
            <div className="flex items-start space-x-3">
              <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                budgetStatus.alertLevel === 'critical' ? 'text-red-500' : 'text-accent-amber'
              }`} />
              <div className="space-y-2">
                <p className={`font-semibold ${
                  budgetStatus.alertLevel === 'critical' ? 'text-red-500' : 'text-accent-amber'
                }`}>
                  {budgetStatus.alertLevel === 'critical' ? 'Budget Alert' : 'Budget Warning'}
                </p>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  {budgetStatus.projectedOverage 
                    ? `Projected to exceed budget by Rs ${budgetStatus.projectedOverage.toLocaleString()}`
                    : `You've used ${budgetStatus.costProgress.toFixed(1)}% of your budget`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {budgetStatus.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Recommendations</h4>
            <div className="space-y-2">
              {budgetStatus.recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 rounded-lg bg-background-card/30">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-foreground-secondary">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default BudgetProgressCard