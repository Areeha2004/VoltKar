/**
 * Budget Monitoring System
 * Continuous monitoring and alerting for budget management
 */

import { BudgetStatus, BudgetInsight } from './budgetManager'
import { Reading } from './analytics'
import { tariffEngine } from './tariffEngine'

export interface BudgetAlert {
  id: string
  type: 'approaching_limit' | 'exceeded_budget' | 'daily_overspend' | 'projection_warning'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  triggeredAt: Date
  threshold: number
  currentValue: number
  actionRequired: boolean
  suggestions: string[]
}

export interface BudgetMonitorConfig {
  warningThreshold: number // percentage (e.g., 80)
  criticalThreshold: number // percentage (e.g., 95)
  dailyOverspendThreshold: number // percentage above daily budget
  projectionAccuracy: number // days ahead to project
}

const DEFAULT_MONITOR_CONFIG: BudgetMonitorConfig = {
  warningThreshold: 80,
  criticalThreshold: 95,
  dailyOverspendThreshold: 150, // 50% above daily budget
  projectionAccuracy: 7 // 7 days ahead
}

/**
 * Continuous budget monitoring
 */
export function monitorBudget(
  currentCost: number,
  projectedCost: number,
  budgetRs: number,
  daysElapsed: number,
  daysInMonth: number,
  config: BudgetMonitorConfig = DEFAULT_MONITOR_CONFIG
): BudgetAlert[] {
  const alerts: BudgetAlert[] = []
  
  const costProgress = (currentCost / budgetRs) * 100
  const dailyBudget = budgetRs / daysInMonth
  const averageDailyCost = daysElapsed > 0 ? currentCost / daysElapsed : 0
  const projectedOverage = Math.max(0, projectedCost - budgetRs)

  // Budget exceeded alert
  if (currentCost > budgetRs) {
    alerts.push({
      id: 'budget_exceeded',
      type: 'exceeded_budget',
      severity: 'critical',
      title: 'Budget Exceeded',
      message: `You have exceeded your monthly budget of Rs ${budgetRs.toLocaleString()} by Rs ${Math.round(currentCost - budgetRs).toLocaleString()}`,
      triggeredAt: new Date(),
      threshold: budgetRs,
      currentValue: currentCost,
      actionRequired: true,
      suggestions: [
        'Immediately reduce high-power appliance usage',
        'Avoid peak hour consumption',
        'Consider emergency conservation measures'
      ]
    })
  }
  // Approaching budget limit
  else if (costProgress >= config.criticalThreshold) {
    alerts.push({
      id: 'approaching_critical',
      type: 'approaching_limit',
      severity: 'high',
      title: 'Critical Budget Alert',
      message: `You've used ${Math.round(costProgress)}% of your budget with ${daysInMonth - daysElapsed} days remaining`,
      triggeredAt: new Date(),
      threshold: config.criticalThreshold,
      currentValue: costProgress,
      actionRequired: true,
      suggestions: [
        'Reduce daily spending to Rs ' + Math.round((budgetRs - currentCost) / Math.max(1, daysInMonth - daysElapsed)),
        'Focus on essential appliances only',
        'Monitor usage hourly'
      ]
    })
  }
  // Warning threshold
  else if (costProgress >= config.warningThreshold) {
    alerts.push({
      id: 'approaching_warning',
      type: 'approaching_limit',
      severity: 'medium',
      title: 'Budget Warning',
      message: `You've used ${Math.round(costProgress)}% of your monthly budget`,
      triggeredAt: new Date(),
      threshold: config.warningThreshold,
      currentValue: costProgress,
      actionRequired: false,
      suggestions: [
        'Monitor usage more closely',
        'Consider reducing AC usage during peak hours',
        'Review daily consumption patterns'
      ]
    })
  }

  // Daily overspend alert
  if (averageDailyCost > dailyBudget * (config.dailyOverspendThreshold / 100)) {
    alerts.push({
      id: 'daily_overspend',
      type: 'daily_overspend',
      severity: 'medium',
      title: 'Daily Overspending',
      message: `Your daily average (Rs ${Math.round(averageDailyCost)}) is ${Math.round(((averageDailyCost / dailyBudget) - 1) * 100)}% above your daily budget`,
      triggeredAt: new Date(),
      threshold: dailyBudget,
      currentValue: averageDailyCost,
      actionRequired: true,
      suggestions: [
        'Reduce today\'s usage to get back on track',
        'Identify and eliminate energy waste',
        'Use energy-efficient settings on appliances'
      ]
    })
  }

  // Projection warning
  if (projectedOverage > 0) {
    const severity = projectedOverage > budgetRs * 0.2 ? 'high' : 
                    projectedOverage > budgetRs * 0.1 ? 'medium' : 'low'
    
    alerts.push({
      id: 'projection_warning',
      type: 'projection_warning',
      severity,
      title: 'Budget Projection Alert',
      message: `Current usage pattern will exceed budget by Rs ${Math.round(projectedOverage).toLocaleString()}`,
      triggeredAt: new Date(),
      threshold: budgetRs,
      currentValue: projectedCost,
      actionRequired: severity !== 'low',
      suggestions: [
        'Adjust usage pattern to stay within budget',
        'Implement energy-saving measures immediately',
        'Consider revising budget if consistently over'
      ]
    })
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
}

/**
 * Generate budget adjustment recommendations
 */
export function generateBudgetAdjustments(
  currentCost: number,
  projectedCost: number,
  budgetRs: number,
  readings: Reading[]
): {
  recommendedBudget: number
  adjustmentReason: string
  confidence: number
  alternatives: Array<{ budget: number; description: string }>
} {
  // Analyze historical patterns
  const avgDailyCost = readings.length > 0 ? 
    readings.reduce((sum, r) => sum + r.estimatedCost, 0) / readings.length : 0

  // Calculate recommended budget based on patterns
  let recommendedBudget = budgetRs
  let adjustmentReason = 'Current budget is appropriate'
  let confidence = 70

  if (projectedCost > budgetRs * 1.1) {
    // Consistently over budget
    recommendedBudget = Math.round(projectedCost * 1.1) // 10% buffer
    adjustmentReason = 'Usage patterns consistently exceed current budget'
    confidence = 85
  } else if (projectedCost < budgetRs * 0.8) {
    // Consistently under budget
    recommendedBudget = Math.round(projectedCost * 1.05) // 5% buffer
    adjustmentReason = 'Current budget is higher than needed based on usage'
    confidence = 80
  }

  // Generate alternatives
  const alternatives = [
    {
      budget: Math.round(projectedCost * 0.95),
      description: 'Aggressive savings target (5% below projection)'
    },
    {
      budget: Math.round(projectedCost * 1.05),
      description: 'Conservative target (5% above projection)'
    },
    {
      budget: Math.round(projectedCost * 1.15),
      description: 'Comfortable target (15% buffer)'
    }
  ].filter(alt => alt.budget !== recommendedBudget)

  return {
    recommendedBudget,
    adjustmentReason,
    confidence,
    alternatives
  }
}

/**
 * Calculate budget efficiency score
 */
export function calculateBudgetEfficiency(
  actualCost: number,
  budgetRs: number,
  targetEfficiency: number = 90
): {
  score: number
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  description: string
} {
  const utilizationRate = (actualCost / budgetRs) * 100
  
  // Calculate efficiency score
  let score = 100
  
  if (utilizationRate > 100) {
    // Over budget penalty
    score = Math.max(0, 100 - (utilizationRate - 100) * 2)
  } else if (utilizationRate < 50) {
    // Under-utilization penalty (budget too high)
    score = Math.max(60, 100 - (50 - utilizationRate))
  } else {
    // Optimal range (50-100% utilization)
    score = 100 - Math.abs(targetEfficiency - utilizationRate) * 0.5
  }

  // Determine grade
  let grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  if (score >= 95) grade = 'A+'
  else if (score >= 90) grade = 'A'
  else if (score >= 85) grade = 'B+'
  else if (score >= 80) grade = 'B'
  else if (score >= 75) grade = 'C+'
  else if (score >= 70) grade = 'C'
  else if (score >= 60) grade = 'D'
  else grade = 'F'

  // Generate description
  let description = ''
  if (score >= 90) {
    description = 'Excellent budget management with optimal utilization'
  } else if (score >= 80) {
    description = 'Good budget control with room for minor improvements'
  } else if (score >= 70) {
    description = 'Fair budget management, consider adjustments'
  } else {
    description = 'Budget management needs significant improvement'
  }

  return {
    score: Math.round(score),
    grade,
    description
  }
}