// Tariff Engine - Central cost calculation function
export interface TariffSlab {
  min: number
  max: number
  rate: number
}

export interface TariffConfig {
  slabs: TariffSlab[]
  fuelAdj: number
  fixedCharges: number
  taxPercent: number
  tvFee: number
}

export interface CostBreakdown {
  baseCost: number
  fpaAmount: number
  fixedCharges: number
  subtotal: number
  gstAmount: number
  tvFee: number
  totalCost: number
  slabBreakdown: Array<{
    slab: string
    units: number
    rate: number
    cost: number
  }>
}

// Default LESCO tariff structure (dummy data)
export const DEFAULT_TARIFF: TariffConfig = {
  slabs: [
    { min: 0, max: 50, rate: 3.95 },
    { min: 51, max: 100, rate: 7.74 },
    { min: 101, max: 200, rate: 10.06 },
    { min: 201, max: 300, rate: 18.15 },
    { min: 301, max: 700, rate: 22.71 },
    { min: 701, max: Infinity, rate: 28.30 }
  ],
  fuelAdj: 4.77,
  fixedCharges: 200,
  taxPercent: 17,
  tvFee: 35
}

/**
 * Central tariff engine for cost calculations
 * @param units - kWh consumed
 * @param tariff - Tariff configuration (optional, uses default if not provided)
 * @returns Detailed cost breakdown
 */
export function tariffEngine(units: number, tariff: TariffConfig = DEFAULT_TARIFF): CostBreakdown {
  if (units <= 0) {
    return {
      baseCost: 0,
      fpaAmount: 0,
      fixedCharges: 0,
      subtotal: 0,
      gstAmount: 0,
      tvFee: 0,
      totalCost: 0,
      slabBreakdown: []
    }
  }

  const slabBreakdown: CostBreakdown['slabBreakdown'] = []
  let baseCost = 0
  let remainingUnits = units

  // Calculate cost for each slab
  for (const slab of tariff.slabs) {
    if (remainingUnits <= 0) break

    const slabUnits = Math.min(remainingUnits, slab.max - slab.min + 1)
    const slabCost = slabUnits * slab.rate

    baseCost += slabCost
    slabBreakdown.push({
      slab: slab.max === Infinity ? `${slab.min}+` : `${slab.min}-${slab.max}`,
      units: slabUnits,
      rate: slab.rate,
      cost: slabCost
    })

    remainingUnits -= slabUnits
  }

  // Calculate additional charges
  const fpaAmount = units * tariff.fuelAdj
  const subtotal = baseCost + fpaAmount + tariff.fixedCharges
  const gstAmount = subtotal * (tariff.taxPercent / 100)
  const totalCost = subtotal + gstAmount + tariff.tvFee

  return {
    baseCost: Math.round(baseCost * 100) / 100,
    fpaAmount: Math.round(fpaAmount * 100) / 100,
    fixedCharges: tariff.fixedCharges,
    subtotal: Math.round(subtotal * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    tvFee: tariff.tvFee,
    totalCost: Math.round(totalCost * 100) / 100,
    slabBreakdown
  }
}

/**
 * Get current slab information for given units
 */
export function getCurrentSlab(units: number, tariff: TariffConfig = DEFAULT_TARIFF): { slab: TariffSlab; index: number } | null {
  for (let i = 0; i < tariff.slabs.length; i++) {
    const slab = tariff.slabs[i]
    if (units >= slab.min && units <= slab.max) {
      return { slab, index: i }
    }
  }
  return null
}

/**
 * Calculate usage difference between two readings
 */
export function calculateUsage(currentReading: number, previousReading: number): number {
  return Math.max(0, currentReading - previousReading)
}

/**
 * Get slab warning message
 */
export function getSlabWarningMessage(units: number, tariff: TariffConfig = DEFAULT_TARIFF): string | null {
  const currentSlabInfo = getCurrentSlab(units, tariff)
  if (!currentSlabInfo) return null

  const { slab: currentSlab, index: currentSlabIndex } = currentSlabInfo
  const nextSlab = tariff.slabs[currentSlabIndex + 1]
  
  if (!nextSlab) return null

  const unitsToNextSlab = nextSlab.min - units
  if (unitsToNextSlab <= 20 && unitsToNextSlab > 0) {
    return `Warning: You're ${unitsToNextSlab} units away from the next slab (Rs ${nextSlab.rate}/kWh). Consider reducing usage to save costs.`
  }

  return null
}