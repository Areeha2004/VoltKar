
// ================================
// TARIFF ENGINE — FINAL STABLE
// ================================

export interface TariffSlab {
  upTo: number | null   // null = infinity
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

/**
 * 🇵🇰 Simplified & realistic LESCO-style slabs
 * Incremental billing (correct)
 */
export const DEFAULT_TARIFF: TariffConfig = {
  slabs: [
    { upTo: 50, rate: 3.95 },
    { upTo: 100, rate: 7.74 },
    { upTo: 200, rate: 10.06 },
    { upTo: 300, rate: 18.15 },
    { upTo: 700, rate: 22.71 },
    { upTo: null, rate: 28.30 }
  ],
  fuelAdjPerUnit: 4.77,
  fixedCharges: 200,
  taxPercent: 17,
  tvFee: 35
}

/**
 * 🚨 STRICT RULE:
 * Accepts ONLY usage (Δ kWh)
 */
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

  // Guardrail — accidental meter reading
  if (usageKwh > 3000) {
    console.warn(
      "[TariffEngine] ⚠️ Suspicious usage:",
      usageKwh,
      "Did you pass a meter reading instead of usage?"
    )
  }

  let remaining = usageKwh
  let lastLimit = 0
  let energyCost = 0
  const slabBreakdown: CostBreakdown["slabBreakdown"] = []

  for (const slab of tariff.slabs) {
    if (remaining <= 0) break

    const slabCap =
      slab.upTo === null
        ? remaining
        : slab.upTo - lastLimit

    const slabUnits = Math.min(remaining, slabCap)
    const slabCost = slabUnits * slab.rate

    energyCost += slabCost
    slabBreakdown.push({
      range:
        slab.upTo === null
          ? `${lastLimit + 1}+`
          : `${lastLimit + 1}-${slab.upTo}`,
      units: slabUnits,
      rate: slab.rate,
      cost: Math.round(slabCost * 100) / 100
    })

    remaining -= slabUnits
    lastLimit = slab.upTo ?? lastLimit
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

  let cumulative = 0

  for (let i = 0; i < tariff.slabs.length; i++) {
    const slab = tariff.slabs[i]
    const slabLimit = slab.upTo ?? Infinity

    if (usage <= slabLimit) {
      const next = tariff.slabs[i + 1]
      if (!next || next.upTo === null) return null

      const unitsToNext = next.upTo - usage
      if (unitsToNext > 0 && unitsToNext <= 20) {
        return `⚠️ Only ${unitsToNext} units left before next slab (Rs ${next.rate}/unit)`
      }
      return null
    }

    cumulative = slabLimit
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
