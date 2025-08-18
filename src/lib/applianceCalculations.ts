/**
 * Appliance Calculations Utility
 * Handles kWh estimation and contribution calculations for appliances
 */

import { tariffEngine } from './tariffEngine'

export interface ApplianceData {
  id: string
  name: string
  category: string
  type: string
  wattage: number
  hoursPerDay: number
  daysPerMonth: number
  estimatedKwh?: number
  contribution?: number
  createdAt: Date
}

export interface ApplianceWithCost extends ApplianceData {
  estimatedCost: number
  costPerKwh: number
}

export interface ApplianceCalculationResult {
  estimatedKwh: number
  contribution: number
}

/**
 * Calculate estimated kWh consumption for an appliance
 */
export function calculateEstimatedKwh(
  wattage: number,
  hoursPerDay: number,
  daysPerMonth: number,
  type: string
): number {
  if (wattage <= 0 || hoursPerDay <= 0 || daysPerMonth <= 0) {
    return 0
  }

  // Base calculation: (wattage * hoursPerDay * daysPerMonth) / 1000
  let estimatedKwh = (wattage * hoursPerDay * daysPerMonth) / 1000

  // Apply efficiency factor for inverter appliances
  if (type.toLowerCase() === 'inverter') {
    estimatedKwh *= 0.7 // 30% more efficient
  }

  return Math.round(estimatedKwh * 100) / 100
}

/**
 * Calculate contribution percentage for all appliances
 */
export function calculateContributions(appliances: ApplianceData[]): ApplianceCalculationResult[] {
  if (!appliances || appliances.length === 0) {
    return []
  }

  // Calculate estimated kWh for each appliance
  const appliancesWithKwh = appliances.map(appliance => ({
    ...appliance,
    estimatedKwh: calculateEstimatedKwh(
      appliance.wattage,
      appliance.hoursPerDay,
      appliance.daysPerMonth,
      appliance.type
    )
  }))

  // Calculate total kWh across all appliances
  const totalKwh = appliancesWithKwh.reduce((sum, appliance) => sum + appliance.estimatedKwh, 0)

  // Calculate contribution percentage for each appliance
  return appliancesWithKwh.map(appliance => ({
    estimatedKwh: appliance.estimatedKwh,
    contribution: totalKwh > 0 ? Math.round((appliance.estimatedKwh / totalKwh) * 100 * 100) / 100 : 0
  }))
}

/**
 * Calculate estimated cost for an appliance using tariff engine
 */
export function calculateApplianceCost(estimatedKwh: number): number {
  if (estimatedKwh <= 0) return 0
  
  const costBreakdown = tariffEngine(estimatedKwh)
  return Math.round(costBreakdown.totalCost * 100) / 100
}

/**
 * Get appliance efficiency rating based on type and usage
 */
export function getEfficiencyRating(
  wattage: number,
  hoursPerDay: number,
  type: string,
  category: string
): 'excellent' | 'good' | 'fair' | 'poor' {
  const dailyKwh = (wattage * hoursPerDay) / 1000
  
  // Category-specific efficiency thresholds
  const thresholds = {
    'air-conditioner': { excellent: 8, good: 12, fair: 18 },
    'refrigerator': { excellent: 3, good: 5, fair: 8 },
    'lighting': { excellent: 1, good: 2, fair: 4 },
    'fan': { excellent: 0.5, good: 1, fair: 2 },
    'heater': { excellent: 15, good: 25, fair: 40 },
    'default': { excellent: 5, good: 10, fair: 20 }
  }

  const categoryKey = category.toLowerCase().replace(/\s+/g, '-')
  const threshold = thresholds[categoryKey as keyof typeof thresholds] || thresholds.default

  // Apply inverter bonus
  const adjustedDailyKwh = type.toLowerCase() === 'inverter' ? dailyKwh * 0.8 : dailyKwh

  if (adjustedDailyKwh <= threshold.excellent) return 'excellent'
  if (adjustedDailyKwh <= threshold.good) return 'good'
  if (adjustedDailyKwh <= threshold.fair) return 'fair'
  return 'poor'
}

/**
 * Generate optimization suggestions for an appliance
 */
export function generateOptimizationSuggestions(appliance: ApplianceData): string[] {
  const suggestions: string[] = []
  const dailyKwh = (appliance.wattage * appliance.hoursPerDay) / 1000

  // Category-specific suggestions
  switch (appliance.category.toLowerCase()) {
    case 'air-conditioner':
      if (appliance.hoursPerDay > 10) {
        suggestions.push('Consider reducing AC usage by 2 hours daily to save ~20% energy')
      }
      if (appliance.type !== 'Inverter') {
        suggestions.push('Upgrade to inverter AC to save 30% energy consumption')
      }
      suggestions.push('Set temperature to 26°C instead of 22°C to reduce consumption')
      break

    case 'refrigerator':
      if (dailyKwh > 4) {
        suggestions.push('Check door seals and defrost regularly for optimal efficiency')
      }
      suggestions.push('Keep refrigerator 80% full for better energy efficiency')
      break

    case 'lighting':
      if (appliance.wattage > 15) {
        suggestions.push('Switch to LED bulbs to reduce power consumption by 80%')
      }
      suggestions.push('Use daylight sensors and timers to optimize lighting usage')
      break

    case 'fan':
      if (appliance.hoursPerDay > 12) {
        suggestions.push('Use ceiling fans with AC to reduce overall cooling costs')
      }
      break

    case 'heater':
      suggestions.push('Use timer function to heat water only when needed')
      suggestions.push('Insulate water pipes to reduce heat loss')
      break

    default:
      suggestions.push('Consider using timer functions to optimize usage hours')
      suggestions.push('Unplug device when not in use to eliminate phantom loads')
  }

  // General efficiency suggestions
  if (appliance.hoursPerDay > 16) {
    suggestions.push('Consider reducing daily usage hours for better efficiency')
  }

  return suggestions.slice(0, 3) // Return top 3 suggestions
}

/**
 * Validate appliance data
 */
export function validateApplianceData(data: Partial<ApplianceData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Appliance name is required')
  }

  if (!data.category || data.category.trim().length === 0) {
    errors.push('Category is required')
  }

  if (!data.type || data.type.trim().length === 0) {
    errors.push('Type is required')
  }

  if (!data.wattage || data.wattage <= 0) {
    errors.push('Wattage must be greater than 0')
  }

  if (data.wattage && data.wattage > 10000) {
    errors.push('Wattage seems unusually high (>10kW)')
  }

  if (!data.hoursPerDay || data.hoursPerDay <= 0) {
    errors.push('Hours per day must be greater than 0')
  }

  if (data.hoursPerDay && data.hoursPerDay > 24) {
    errors.push('Hours per day cannot exceed 24')
  }

  if (!data.daysPerMonth || data.daysPerMonth <= 0) {
    errors.push('Days per month must be greater than 0')
  }

  if (data.daysPerMonth && data.daysPerMonth > 31) {
    errors.push('Days per month cannot exceed 31')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get predefined appliance categories
 */
export function getApplianceCategories(): string[] {
  return [
    'Air Conditioner',
    'Refrigerator',
    'Lighting',
    'Fan',
    'Water Heater',
    'Washing Machine',
    'Microwave',
    'Television',
    'Computer',
    'Iron',
    'Other'
  ]
}

/**
 * Get appliance types
 */
export function getApplianceTypes(): string[] {
  return ['Inverter', 'Non-Inverter']
}