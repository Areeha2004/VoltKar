/**
 * Anomaly Detection Engine
 * Detects unusual patterns in electricity usage and cost calculations
 */

import { Reading } from './analytics'
import { tariffEngine } from './tariffEngine'

export interface Anomaly {
  id: string
  type: 'usage_spike' | 'usage_drop' | 'cost_anomaly' | 'reading_error' | 'pattern_break'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  detectedAt: Date
  readingId?: string
  meterId?: string
  impact?: string
  confidence: number // 0-100
  resolved: boolean
  suggestedAction?: string
}

export interface AnomalyDetectionConfig {
  usageSpikeThreshold: number // percentage increase to trigger alert
  usageDropThreshold: number // percentage decrease to trigger alert
  costVarianceThreshold: number // percentage variance in cost calculation
  patternBreakThreshold: number // days of unusual pattern to trigger
  confidenceThreshold: number // minimum confidence to report anomaly
}

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  usageSpikeThreshold: 50, // 50% increase
  usageDropThreshold: 40, // 40% decrease
  costVarianceThreshold: 10, // 10% variance
  patternBreakThreshold: 3, // 3 days
  confidenceThreshold: 70 // 70% confidence
}

/**
 * Detect anomalies in a set of readings
 */
export function detectAnomalies(
  readings: Reading[], 
  config: AnomalyDetectionConfig = DEFAULT_CONFIG
): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  if (!readings || readings.length < 2) return anomalies

  // Sort readings by date
  const sortedReadings = readings.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Detect usage spikes and drops
  anomalies.push(...detectUsageAnomalies(sortedReadings, config))
  
  // Detect cost calculation anomalies
  anomalies.push(...detectCostAnomalies(sortedReadings, config))
  
  // Detect pattern breaks
  anomalies.push(...detectPatternBreaks(sortedReadings, config))
  
  // Filter by confidence threshold
  return anomalies.filter(anomaly => anomaly.confidence >= config.confidenceThreshold)
}

/**
 * Detect unusual usage spikes or drops
 */
function detectUsageAnomalies(readings: Reading[], config: AnomalyDetectionConfig): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  for (let i = 1; i < readings.length; i++) {
    const current = readings[i]
    const previous = readings[i - 1]
    
    if (previous.usage === 0) continue
    
    const changePercent = ((current.usage - previous.usage) / previous.usage) * 100
    
    // Usage spike detection
    if (changePercent > config.usageSpikeThreshold) {
      anomalies.push({
        id: `spike_${current.id}`,
        type: 'usage_spike',
        severity: changePercent > 100 ? 'high' : 'medium',
        title: 'Unusual Usage Spike',
        description: `Usage increased by ${Math.round(changePercent)}% from ${previous.usage} to ${current.usage} kWh`,
        detectedAt: new Date(),
        readingId: current.id,
        impact: `Extra cost: Rs ${Math.round(current.estimatedCost - previous.estimatedCost)}`,
        confidence: Math.min(95, 60 + Math.abs(changePercent) / 2),
        resolved: false,
        suggestedAction: 'Check for new appliances or unusual usage patterns'
      })
    }
    
    // Usage drop detection
    if (changePercent < -config.usageDropThreshold) {
      anomalies.push({
        id: `drop_${current.id}`,
        type: 'usage_drop',
        severity: Math.abs(changePercent) > 70 ? 'medium' : 'low',
        title: 'Significant Usage Drop',
        description: `Usage decreased by ${Math.round(Math.abs(changePercent))}% from ${previous.usage} to ${current.usage} kWh`,
        detectedAt: new Date(),
        readingId: current.id,
        impact: `Savings: Rs ${Math.round(previous.estimatedCost - current.estimatedCost)}`,
        confidence: Math.min(90, 50 + Math.abs(changePercent) / 2),
        resolved: false,
        suggestedAction: 'Verify reading accuracy or check for equipment issues'
      })
    }
  }
  
  return anomalies
}

/**
 * Detect cost calculation anomalies
 */
function detectCostAnomalies(readings: Reading[], config: AnomalyDetectionConfig): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  readings.forEach(reading => {
    if (reading.usage <= 0) return
    
    // Recalculate cost using tariff engine
    const expectedCost = tariffEngine(reading.usage).totalCost
    const actualCost = reading.estimatedCost
    
    if (actualCost === 0) return
    
    const variance = Math.abs((actualCost - expectedCost) / expectedCost) * 100
    
    if (variance > config.costVarianceThreshold) {
      anomalies.push({
        id: `cost_${reading.id}`,
        type: 'cost_anomaly',
        severity: variance > 20 ? 'high' : variance > 15 ? 'medium' : 'low',
        title: 'Cost Calculation Discrepancy',
        description: `Expected cost Rs ${Math.round(expectedCost)} but recorded Rs ${Math.round(actualCost)} (${Math.round(variance)}% variance)`,
        detectedAt: new Date(),
        readingId: reading.id,
        impact: `Rs ${Math.round(Math.abs(actualCost - expectedCost))} difference`,
        confidence: Math.min(95, 70 + variance),
        resolved: false,
        suggestedAction: 'Verify tariff rates and recalculate cost'
      })
    }
  })
  
  return anomalies
}

/**
 * Detect pattern breaks in usage behavior
 */
function detectPatternBreaks(readings: Reading[], config: AnomalyDetectionConfig): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  if (readings.length < 7) return anomalies // Need at least a week of data
  
  // Calculate rolling average
  const windowSize = 7
  const averages: number[] = []
  
  for (let i = windowSize - 1; i < readings.length; i++) {
    const window = readings.slice(i - windowSize + 1, i + 1)
    const average = window.reduce((sum, r) => sum + r.usage, 0) / windowSize
    averages.push(average)
  }
  
  // Detect breaks in pattern
  for (let i = 1; i < averages.length; i++) {
    const current = averages[i]
    const previous = averages[i - 1]
    
    if (previous === 0) continue
    
    const changePercent = Math.abs((current - previous) / previous) * 100
    
    if (changePercent > 30) { // 30% change in rolling average
      const readingIndex = i + windowSize - 1
      const reading = readings[readingIndex]
      
      anomalies.push({
        id: `pattern_${reading.id}`,
        type: 'pattern_break',
        severity: changePercent > 50 ? 'medium' : 'low',
        title: 'Usage Pattern Change',
        description: `Rolling average changed by ${Math.round(changePercent)}% indicating a shift in usage behavior`,
        detectedAt: new Date(),
        readingId: reading.id,
        confidence: Math.min(85, 50 + changePercent / 2),
        resolved: false,
        suggestedAction: 'Review recent changes in household routine or appliances'
      })
    }
  }
  
  return anomalies
}

/**
 * Validate reading accuracy
 */
export function validateReading(
  currentReading: number,
  previousReading: number,
  expectedRange?: { min: number; max: number }
): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Basic validation
  if (currentReading < 0) {
    issues.push('Reading cannot be negative')
  }
  
  if (currentReading < previousReading) {
    issues.push('Current reading is less than previous reading')
  }
  
  // Usage validation
  const usage = currentReading - previousReading
  if (usage > 1000) { // More than 1000 kWh in one period
    issues.push('Usage seems unusually high (>1000 kWh)')
  }
  
  // Expected range validation
  if (expectedRange) {
    if (currentReading < expectedRange.min || currentReading > expectedRange.max) {
      issues.push(`Reading outside expected range (${expectedRange.min}-${expectedRange.max})`)
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Generate anomaly summary for dashboard
 */
export function generateAnomalySummary(anomalies: Anomaly[]) {
  const activeAnomalies = anomalies.filter(a => !a.resolved)
  const criticalCount = activeAnomalies.filter(a => a.severity === 'critical').length
  const highCount = activeAnomalies.filter(a => a.severity === 'high').length
  const mediumCount = activeAnomalies.filter(a => a.severity === 'medium').length
  
  return {
    total: activeAnomalies.length,
    critical: criticalCount,
    high: highCount,
    medium: mediumCount,
    low: activeAnomalies.length - criticalCount - highCount - mediumCount,
    needsAttention: criticalCount + highCount > 0,
    summary: activeAnomalies.length === 0 ? 
      'No anomalies detected' : 
      `${activeAnomalies.length} anomalies detected (${criticalCount + highCount} need attention)`
  }
}

/**
 * Auto-resolve anomalies based on conditions
 */
export function autoResolveAnomalies(anomalies: Anomaly[]): Anomaly[] {
  return anomalies.map(anomaly => {
    // Auto-resolve low severity cost anomalies older than 7 days
    if (
      anomaly.type === 'cost_anomaly' && 
      anomaly.severity === 'low' &&
      (Date.now() - anomaly.detectedAt.getTime()) > 7 * 24 * 60 * 60 * 1000
    ) {
      return { ...anomaly, resolved: true }
    }
    
    return anomaly
  })
}