/**
 * Advanced Forecasting Engine
 * Provides sophisticated forecasting using multiple algorithms and confidence intervals
 */

import { Reading } from './analytics'
import { tariffEngine } from './tariffEngine'

export interface ForecastResult {
  usage: {
    low: number
    expected: number
    high: number
    confidence: number
  }
  cost: {
    low: number
    expected: number
    high: number
    confidence: number
  }
  methodology: string
  factors: string[]
  lastUpdated: Date
}

export interface SeasonalPattern {
  month: number
  averageUsage: number
  variance: number
  peakDays: number[]
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable'
  strength: number // 0-100
  confidence: number // 0-100
  weeklyGrowthRate: number
  monthlyGrowthRate: number
}

/**
 * Advanced forecasting with multiple methodologies
 */
export function advancedForecast(
  readings: Reading[],
  targetDate?: Date,
  historicalData?: Reading[]
): ForecastResult {
  if (!readings || readings.length === 0) {
    return {
      usage: { low: 0, expected: 0, high: 0, confidence: 0 },
      cost: { low: 0, expected: 0, high: 0, confidence: 0 },
      methodology: 'insufficient_data',
      factors: ['No readings available'],
      lastUpdated: new Date()
    }
  }

  const currentDate = new Date()
  const forecastDate = targetDate || new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // Multiple forecasting methods
  const linearForecast = linearTrendForecast(readings, forecastDate)
  const seasonalForecast = seasonalAdjustedForecast(readings, historicalData, forecastDate)
  const movingAverageForecast = movingAverageTrendForecast(readings, forecastDate)
  
  // Weighted ensemble forecast
  const weights = {
    linear: 0.3,
    seasonal: historicalData && historicalData.length > 12 ? 0.5 : 0.2,
    movingAverage: 0.4
  }
  
  // Normalize weights
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)
  Object.keys(weights).forEach(key => {
    weights[key as keyof typeof weights] /= totalWeight
  })

  const expectedUsage = Math.round(
    linearForecast.expected * weights.linear +
    seasonalForecast.expected * weights.seasonal +
    movingAverageForecast.expected * weights.movingAverage
  )

  // Calculate confidence based on data quality and consistency
  const confidence = calculateForecastConfidence(readings, historicalData)
  
  // Apply confidence-based variance
  const varianceMultiplier = Math.max(0.1, (100 - confidence) / 100)
  const lowUsage = Math.round(expectedUsage * (1 - 0.15 * varianceMultiplier))
  const highUsage = Math.round(expectedUsage * (1 + 0.15 * varianceMultiplier))

  // Calculate costs
  const lowCost = tariffEngine(lowUsage).totalCost
  const expectedCost = tariffEngine(expectedUsage).totalCost
  const highCost = tariffEngine(highUsage).totalCost

  // Determine methodology used
  const methodology = historicalData && historicalData.length > 12 ? 
    'seasonal_adjusted' : 
    readings.length > 7 ? 'trend_analysis' : 'simple_projection'

  // Identify factors affecting forecast
  const factors = identifyForecastFactors(readings, historicalData)

  return {
    usage: {
      low: lowUsage,
      expected: expectedUsage,
      high: highUsage,
      confidence
    },
    cost: {
      low: Math.round(lowCost),
      expected: Math.round(expectedCost),
      high: Math.round(highCost),
      confidence
    },
    methodology,
    factors,
    lastUpdated: new Date()
  }
}

/**
 * Linear trend forecasting
 */
function linearTrendForecast(readings: Reading[], targetDate: Date): { expected: number } {
  if (readings.length < 2) return { expected: 0 }

  const sortedReadings = readings.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate linear regression
  const n = sortedReadings.length
  const sumX = sortedReadings.reduce((sum, _, i) => sum + i, 0)
  const sumY = sortedReadings.reduce((sum, r) => sum + r.usage, 0)
  const sumXY = sortedReadings.reduce((sum, r, i) => sum + i * r.usage, 0)
  const sumXX = sortedReadings.reduce((sum, _, i) => sum + i * i, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Project to target date
  const daysFromStart = Math.ceil(
    (targetDate.getTime() - new Date(sortedReadings[0].date).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const projected = Math.max(0, intercept + slope * daysFromStart)
  
  return { expected: projected }
}

/**
 * Seasonal adjusted forecasting
 */
function seasonalAdjustedForecast(
  readings: Reading[], 
  historicalData?: Reading[], 
  targetDate?: Date
): { expected: number } {
  if (!historicalData || historicalData.length < 12) {
    return linearTrendForecast(readings, targetDate || new Date())
  }

  const targetMonth = (targetDate || new Date()).getMonth() + 1
  
  // Calculate seasonal factors
  const monthlyAverages = new Map<number, number>()
  const monthlyReadings = new Map<number, Reading[]>()
  
  historicalData.forEach(reading => {
    const month = new Date(reading.date).getMonth() + 1
    if (!monthlyReadings.has(month)) {
      monthlyReadings.set(month, [])
    }
    monthlyReadings.get(month)!.push(reading)
  })

  monthlyReadings.forEach((monthReadings, month) => {
    const average = monthReadings.reduce((sum, r) => sum + r.usage, 0) / monthReadings.length
    monthlyAverages.set(month, average)
  })

  const overallAverage = Array.from(monthlyAverages.values()).reduce((sum, avg) => sum + avg, 0) / monthlyAverages.size
  const seasonalFactor = (monthlyAverages.get(targetMonth) || overallAverage) / overallAverage

  // Apply seasonal adjustment to linear forecast
  const baseForecast = linearTrendForecast(readings, targetDate || new Date())
  
  return { expected: baseForecast.expected * seasonalFactor }
}

/**
 * Moving average trend forecasting
 */
function movingAverageTrendForecast(readings: Reading[], targetDate: Date): { expected: number } {
  if (readings.length < 3) return { expected: 0 }

  const windowSize = Math.min(7, readings.length)
  const recentReadings = readings.slice(-windowSize)
  const average = recentReadings.reduce((sum, r) => sum + r.usage, 0) / recentReadings.length

  // Calculate trend from recent readings
  const firstHalf = recentReadings.slice(0, Math.floor(windowSize / 2))
  const secondHalf = recentReadings.slice(Math.floor(windowSize / 2))
  
  const firstAvg = firstHalf.reduce((sum, r) => sum + r.usage, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, r) => sum + r.usage, 0) / secondHalf.length
  
  const trendMultiplier = firstAvg > 0 ? secondAvg / firstAvg : 1
  
  return { expected: average * trendMultiplier }
}

/**
 * Calculate forecast confidence based on data quality
 */
function calculateForecastConfidence(readings: Reading[], historicalData?: Reading[]): number {
  let confidence = 50 // Base confidence
  
  // Data quantity factor
  if (readings.length >= 10) confidence += 20
  else if (readings.length >= 5) confidence += 10
  
  // Historical data factor
  if (historicalData && historicalData.length >= 12) confidence += 15
  else if (historicalData && historicalData.length >= 6) confidence += 8
  
  // Data consistency factor
  if (readings.length >= 3) {
    const usageValues = readings.map(r => r.usage)
    const mean = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length
    const variance = usageValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / usageValues.length
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1
    
    if (coefficientOfVariation < 0.3) confidence += 10 // Low variance = high confidence
    else if (coefficientOfVariation > 0.7) confidence -= 10 // High variance = low confidence
  }
  
  // Recency factor
  const latestReading = readings[readings.length - 1]
  const daysSinceLatest = (Date.now() - new Date(latestReading.date).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceLatest <= 2) confidence += 5
  else if (daysSinceLatest > 7) confidence -= 10
  
  return Math.max(30, Math.min(95, confidence))
}

/**
 * Identify factors affecting forecast accuracy
 */
function identifyForecastFactors(readings: Reading[], historicalData?: Reading[]): string[] {
  const factors: string[] = []
  
  if (readings.length < 5) {
    factors.push('Limited recent data')
  }
  
  if (!historicalData || historicalData.length < 6) {
    factors.push('No seasonal adjustment')
  }
  
  // Check for recent usage changes
  if (readings.length >= 4) {
    const recent = readings.slice(-2)
    const older = readings.slice(-4, -2)
    
    const recentAvg = recent.reduce((sum, r) => sum + r.usage, 0) / recent.length
    const olderAvg = older.reduce((sum, r) => sum + r.usage, 0) / older.length
    
    if (olderAvg > 0) {
      const change = Math.abs((recentAvg - olderAvg) / olderAvg) * 100
      if (change > 25) {
        factors.push('Recent usage pattern change')
      }
    }
  }
  
  // Check data consistency
  const usageValues = readings.map(r => r.usage)
  const mean = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length
  const variance = usageValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / usageValues.length
  const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0
  
  if (coefficientOfVariation > 0.5) {
    factors.push('High usage variability')
  }
  
  if (factors.length === 0) {
    factors.push('Stable usage pattern', 'Sufficient data quality')
  }
  
  return factors
}

/**
 * Analyze usage trends
 */
export function analyzeTrend(readings: Reading[]): TrendAnalysis {
  if (readings.length < 3) {
    return {
      direction: 'stable',
      strength: 0,
      confidence: 0,
      weeklyGrowthRate: 0,
      monthlyGrowthRate: 0
    }
  }

  const sortedReadings = readings.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate linear regression slope
  const n = sortedReadings.length
  const sumX = sortedReadings.reduce((sum, _, i) => sum + i, 0)
  const sumY = sortedReadings.reduce((sum, r) => sum + r.usage, 0)
  const sumXY = sortedReadings.reduce((sum, r, i) => sum + i * r.usage, 0)
  const sumXX = sortedReadings.reduce((sum, _, i) => sum + i * i, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate R-squared for confidence
  const yMean = sumY / n
  const ssTotal = sortedReadings.reduce((sum, r) => sum + Math.pow(r.usage - yMean, 2), 0)
  const ssResidual = sortedReadings.reduce((sum, r, i) => {
    const predicted = intercept + slope * i
    return sum + Math.pow(r.usage - predicted, 2)
  }, 0)
  
  const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0
  const confidence = Math.max(0, Math.min(100, rSquared * 100))

  // Determine trend direction and strength
  const avgUsage = sumY / n
  const relativeSlope = avgUsage > 0 ? (slope / avgUsage) * 100 : 0
  
  let direction: TrendAnalysis['direction'] = 'stable'
  let strength = Math.abs(relativeSlope)
  
  if (relativeSlope > 2) direction = 'increasing'
  else if (relativeSlope < -2) direction = 'decreasing'
  
  // Calculate growth rates
  const weeklyGrowthRate = slope * 7 // slope per day * 7
  const monthlyGrowthRate = slope * 30 // slope per day * 30

  return {
    direction,
    strength: Math.min(100, strength),
    confidence,
    weeklyGrowthRate: Math.round(weeklyGrowthRate * 100) / 100,
    monthlyGrowthRate: Math.round(monthlyGrowthRate * 100) / 100
  }
}

/**
 * Generate forecast scenarios for different conditions
 */
export function generateForecastScenarios(
  baseUsage: number,
  currentTrend: TrendAnalysis
): {
  conservative: number
  optimistic: number
  pessimistic: number
  realistic: number
} {
  const trendMultiplier = currentTrend.direction === 'increasing' ? 1.1 : 
                         currentTrend.direction === 'decreasing' ? 0.9 : 1.0

  return {
    conservative: Math.round(baseUsage * 0.85), // 15% reduction
    optimistic: Math.round(baseUsage * 0.75), // 25% reduction
    pessimistic: Math.round(baseUsage * trendMultiplier * 1.2), // 20% increase with trend
    realistic: Math.round(baseUsage * trendMultiplier) // Current trend
  }
}

/**
 * Validate forecast accuracy against actual readings
 */
export function validateForecastAccuracy(
  forecastedUsage: number,
  actualUsage: number,
  confidenceInterval: { low: number; high: number }
): {
  accuracy: number
  withinInterval: boolean
  error: number
  errorPercentage: number
} {
  const error = Math.abs(forecastedUsage - actualUsage)
  const errorPercentage = actualUsage > 0 ? (error / actualUsage) * 100 : 0
  const accuracy = Math.max(0, 100 - errorPercentage)
  const withinInterval = actualUsage >= confidenceInterval.low && actualUsage <= confidenceInterval.high

  return {
    accuracy: Math.round(accuracy * 100) / 100,
    withinInterval,
    error: Math.round(error * 100) / 100,
    errorPercentage: Math.round(errorPercentage * 100) / 100
  }
}