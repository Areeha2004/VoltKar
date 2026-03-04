export interface TariffSlab {
  min: number
  max: number
  upTo?: number | null
  rate: number
}

export interface TariffConfig {
  slabs: TariffSlab[]
  fuelAdjPerUnit: number
  fixedCharges: number
  taxPercent: number
  tvFee: number
}

export interface CostBreakdown {
  units: number
  energyCost: number
  fuelAdj: number
  fixedCharges: number
  subtotal: number
  tax: number
  tvFee: number
  totalCost: number
  slabBreakdown: {
    range: string
    units: number
    rate: number
    cost: number
  }[]
}

export const DEFAULT_TARIFF: TariffConfig = {
  slabs: [
    { min: 0, max: 50, upTo: 50, rate: 3.95 },
    { min: 51, max: 100, upTo: 100, rate: 7.74 },
    { min: 101, max: 200, upTo: 200, rate: 10.06 },
    { min: 201, max: 300, upTo: 300, rate: 18.15 },
    { min: 301, max: 700, upTo: 700, rate: 22.71 },
    { min: 701, max: Infinity, upTo: null, rate: 28.3 }
  ],
  fuelAdjPerUnit: 4.77,
  fixedCharges: 200,
  taxPercent: 17,
  tvFee: 35
}

function slabUpperBound(slab: TariffSlab): number {
  if (slab.upTo !== undefined) return slab.upTo ?? Infinity
  return slab.max
}

export function tariffEngine(
  usageKwh: number,
  tariff: TariffConfig = DEFAULT_TARIFF
): CostBreakdown {
  if (!Number.isFinite(usageKwh) || usageKwh <= 0) {
    return {
      units: 0,
      energyCost: 0,
      fuelAdj: 0,
      fixedCharges: 0,
      subtotal: 0,
      tax: 0,
      tvFee: 0,
      totalCost: 0,
      slabBreakdown: []
    }
  }

  if (usageKwh > 3000) {
    console.warn(
      '[TariffEngine] Suspicious usage:',
      usageKwh,
      'Did you pass a meter reading instead of usage?'
    )
  }

  let remaining = usageKwh
  let lastLimit = 0
  let energyCost = 0
  const slabBreakdown: CostBreakdown['slabBreakdown'] = []

  for (const slab of tariff.slabs) {
    if (remaining <= 0) break

    const upper = slabUpperBound(slab)
    const slabCap = upper === Infinity ? remaining : upper - lastLimit
    const slabUnits = Math.min(remaining, slabCap)
    const slabCost = slabUnits * slab.rate

    energyCost += slabCost
    slabBreakdown.push({
      range: upper === Infinity ? `${lastLimit + 1}+` : `${lastLimit + 1}-${upper}`,
      units: slabUnits,
      rate: slab.rate,
      cost: Math.round(slabCost * 100) / 100
    })

    remaining -= slabUnits
    if (upper !== Infinity) {
      lastLimit = upper
    }
  }

  const fuelAdj = usageKwh * tariff.fuelAdjPerUnit
  const subtotal = energyCost + fuelAdj + tariff.fixedCharges
  const tax = subtotal * (tariff.taxPercent / 100)
  const totalCost = subtotal + tax + tariff.tvFee

  return {
    units: Math.round(usageKwh * 100) / 100,
    energyCost: Math.round(energyCost * 100) / 100,
    fuelAdj: Math.round(fuelAdj * 100) / 100,
    fixedCharges: tariff.fixedCharges,
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    tvFee: tariff.tvFee,
    totalCost: Math.round(totalCost * 100) / 100,
    slabBreakdown
  }
}

export function getSlabWarningMessage(
  usage: number,
  tariff: TariffConfig = DEFAULT_TARIFF
): string | null {
  for (let i = 0; i < tariff.slabs.length; i++) {
    const slab = tariff.slabs[i]
    const slabLimit = slabUpperBound(slab)

    if (usage <= slabLimit) {
      const next = tariff.slabs[i + 1]
      if (!next) return null

      const nextLimit = slabUpperBound(next)
      if (nextLimit === Infinity) return null

      const unitsToNext = nextLimit - usage
      if (unitsToNext > 0 && unitsToNext <= 20) {
        return `Only ${unitsToNext} units left before next slab (Rs ${next.rate}/unit)`
      }
      return null
    }
  }

  return null
}

export function getCurrentSlab(
  usage: number,
  tariff: TariffConfig = DEFAULT_TARIFF
): { slab: { min: number; max: number; rate: number }; index: number } | null {
  if (!Number.isFinite(usage) || usage < 0) return null

  for (let i = 0; i < tariff.slabs.length; i++) {
    const slab = tariff.slabs[i]
    const min = slab.min
    const max = slabUpperBound(slab)

    if (usage <= max) {
      return {
        slab: {
          min,
          max,
          rate: slab.rate
        },
        index: i
      }
    }
  }

  return null
}

export function calculateUsage(
  currentReading: number,
  previousReading: number
): number {
  if (!Number.isFinite(currentReading) || !Number.isFinite(previousReading)) {
    return 0
  }
  return Math.max(0, currentReading - previousReading)
}
