

import { tariffEngine } from './tariffEngine'
import { computeMTD, forecastUsage, forecastBill } from './analytics'

export interface BudgetConfig {
  monthlyBudgetRs?: number
  alertThresholds: {
    warning: number // percentage (e.g., 80)
    critical: number // percentage (e.g., 95)
  }
  createdAt: Date
  updatedAt: Date
}

export interface BudgetStatus {
  hasTarget: boolean
  budgetRs?: number
  currentCost: number
  projectedCost: number
  costProgress: number // percentage
  daysElapsed: number
  daysRemaining: number
  onTrack: boolean
  alertLevel: 'none' | 'warning' | 'critical'
  projectedOverage?: number
  dailyBudget: number
  averageDailyCost: number
  remainingBudget: number
  recommendations: string[]
}

export interface BudgetInsight {
  id: string
  type: 'success' | 'warning' | 'critical' | 'info'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  impact?: string
  actionable: boolean
}

/**
 * Get budget from localStorage (client-side) or return null
 */
export function getBudgetFromStorage(): number | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('monthlyBudgetRs')
  return stored ? parseFloat(stored) : null
}

/**
 * Set budget in localStorage (client-side)
 */
export function setBudgetInStorage(budgetRs: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('monthlyBudgetRs', budgetRs.toString())
}

/**
 * Calculate comprehensive budget status
 */
export function calculateBudgetStatus(
  currentCost: number,
  projectedCost: number,
  daysElapsed: number,
  daysInMonth: number,
  budgetRs?: number
): BudgetStatus {
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 0)
  const averageDailyCost = daysElapsed > 0 ? currentCost / daysElapsed : 0
  
  // Default status when no budget is set
  if (!budgetRs) {
    return {
      hasTarget: false,
      currentCost,
      projectedCost: Math.round(projectedCost),
      costProgress: 0,
      daysElapsed,
      daysRemaining,
      onTrack: true,
      alertLevel: 'none',
      dailyBudget: 0,
      averageDailyCost: Math.round(averageDailyCost),
      remainingBudget: 0,
      recommendations: [
        'Set a monthly budget to track your progress',
        'Monitor your usage patterns for optimization opportunities',
        'Consider setting a realistic cost target based on your usage history'
      ]
    }
  }

  // Calculate progress and status
  const costProgress = (currentCost / budgetRs) * 100
  const onTrack = projectedCost <= budgetRs
  const projectedOverage = onTrack ? undefined : projectedCost - budgetRs
  const dailyBudget = budgetRs / daysInMonth
  const remainingBudget = Math.max(0, budgetRs - currentCost)

  // Determine alert level
  let alertLevel: BudgetStatus['alertLevel'] = 'none'
  if (costProgress >= 95) {
    alertLevel = 'critical'
  } else if (costProgress >= 80) {
    alertLevel = 'warning'
  }

  // Generate recommendations
  const recommendations = generateBudgetRecommendations(
    currentCost,
    projectedCost,
    budgetRs,
    daysRemaining,
    averageDailyCost,
    dailyBudget
  )

  return {
    hasTarget: true,
    budgetRs,
    currentCost,
    projectedCost: Math.round(projectedCost),
    costProgress: Math.round(costProgress * 100) / 100,
    daysElapsed,
    daysRemaining,
    onTrack,
    alertLevel,
    projectedOverage: projectedOverage ? Math.round(projectedOverage) : undefined,
    dailyBudget: Math.round(dailyBudget),
    averageDailyCost: Math.round(averageDailyCost),
    remainingBudget: Math.round(remainingBudget),
    recommendations
  }
}

/**
 * Generate budget-specific recommendations
 */
function generateBudgetRecommendations(
  currentCost: number,
  projectedCost: number,
  budgetRs: number,
  daysRemaining: number,
  averageDailyCost: number,
  dailyBudget: number
): string[] {
  const recommendations: string[] = []

  if (projectedCost > budgetRs) {
    const overage = projectedCost - budgetRs
    const dailyReduction = overage / Math.max(daysRemaining, 1)
    
    recommendations.push(
      `Reduce daily spending by Rs ${Math.round(dailyReduction)} to stay within budget`
    )
    
    if (averageDailyCost > dailyBudget * 1.2) {
      recommendations.push('Your daily spending is 20% above target - consider reducing AC usage')
    }
    
    if (overage > 2000) {
      recommendations.push('Focus on reducing usage during peak rate hours (6-10 PM)')
    }
  } else {
    const savings = budgetRs - projectedCost
    if (savings > 1000) {
      recommendations.push(`Great! You're projected to save Rs ${Math.round(savings)} this month`)
    } else {
      recommendations.push('You\'re on track to meet your budget goals')
    }
  }

  // Add specific tips based on spending patterns
  if (averageDailyCost > 400) {
    recommendations.push('Consider optimizing AC temperature settings to reduce daily costs')
  }

  return recommendations
}

/**
 * Generate budget-specific insights
 */
export function generateBudgetInsights(budgetStatus: BudgetStatus): BudgetInsight[] {
  const insights: BudgetInsight[] = []

  if (!budgetStatus.hasTarget) {
    insights.push({
      id: 'no-budget-set',
      type: 'info',
      title: 'Set Your Monthly Budget',
      message: 'Track your progress and avoid bill surprises by setting a monthly cost target.',
      priority: 'medium',
      actionable: true
    })
    return insights
  }

  // Critical budget alerts
  if (budgetStatus.alertLevel === 'critical') {
    if (budgetStatus.projectedOverage) {
      insights.push({
        id: 'critical-budget-alert',
        type: 'critical',
        title: 'Critical: Budget Exceeded',
        message: `You're projected to exceed your Rs ${budgetStatus.budgetRs?.toLocaleString()} budget by Rs ${budgetStatus.projectedOverage.toLocaleString()}.`,
        priority: 'high',
        impact: `${Math.round((budgetStatus.projectedOverage / budgetStatus.budgetRs!) * 100)}% over budget`,
        actionable: true
      })
    }
  }

  // Warning level alerts
  if (budgetStatus.alertLevel === 'warning') {
    insights.push({
      id: 'budget-warning',
      type: 'warning',
      title: 'Approaching Budget Limit',
      message: `You've spent ${budgetStatus.costProgress.toFixed(1)}% of your budget with ${budgetStatus.daysRemaining} days remaining.`,
      priority: 'medium',
      actionable: true
    })
  }

  // Success insights
  if (budgetStatus.onTrack && budgetStatus.hasTarget) {
    const savings = budgetStatus.budgetRs! - budgetStatus.projectedCost
    insights.push({
      id: 'budget-on-track',
      type: 'success',
      title: 'Budget On Track',
      message: `You're projected to save Rs ${Math.round(savings).toLocaleString()} this month.`,
      priority: 'low',
      actionable: false
    })
  }

  // Daily spending insights
  if (budgetStatus.averageDailyCost > budgetStatus.dailyBudget * 1.1) {
    insights.push({
      id: 'high-daily-spending',
      type: 'warning',
      title: 'High Daily Spending',
      message: `Your daily average (Rs ${budgetStatus.averageDailyCost}) exceeds your daily budget (Rs ${budgetStatus.dailyBudget}).`,
      priority: 'medium',
      actionable: true
    })
  }

  return insights
}

/**
 * Calculate budget variance analysis
 */
export function calculateBudgetVariance(
  actualCost: number,
  targetCost: number
) {
  const variance = {
    absolute: actualCost - targetCost,
    percentage: ((actualCost - targetCost) / targetCost) * 100
  }

  return {
    absolute: Math.round(variance.absolute),
    percentage: Math.round(variance.percentage * 100) / 100,
    isOverBudget: variance.absolute > 0
  }
}