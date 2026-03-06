import type { TariffConfig, TariffSlab } from './tariffEngine'

export type DistributionOperator =
  | 'IESCO'
  | 'LESCO'
  | 'GEPCO'
  | 'FESCO'
  | 'MEPCO'
  | 'SEPCO'

type DiscoRateRange = {
  minRate: number
  maxRate: number
}

const DISCO_RATE_RANGES: Record<DistributionOperator, DiscoRateRange> = {
  IESCO: { minRate: 16, maxRate: 37 },
  LESCO: { minRate: 10, maxRate: 41 },
  GEPCO: { minRate: 22, maxRate: 65 },
  FESCO: { minRate: 22, maxRate: 42 },
  MEPCO: { minRate: 14, maxRate: 24 },
  SEPCO: { minRate: 14, maxRate: 23 }
}

export const DEFAULT_OPERATOR: DistributionOperator = 'LESCO'

export const DISCO_OPTIONS: Array<{
  value: DistributionOperator
  label: string
  approxRange: string
}> = [
  { value: 'IESCO', label: 'IESCO (Islamabad)', approxRange: 'Rs 16-37 /kWh' },
  { value: 'LESCO', label: 'LESCO (Lahore)', approxRange: 'Rs 10-41 /kWh' },
  { value: 'GEPCO', label: 'GEPCO (Gujranwala)', approxRange: 'Rs 22-65 /kWh' },
  { value: 'FESCO', label: 'FESCO (Faisalabad)', approxRange: 'Rs 22-42 /kWh' },
  { value: 'MEPCO', label: 'MEPCO (Multan)', approxRange: 'Rs 14-24 /kWh' },
  { value: 'SEPCO', label: 'SEPCO (Sukkur)', approxRange: 'Rs 14-23 /kWh' }
]

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function buildProgressiveSlabs(minRate: number, maxRate: number): TariffSlab[] {
  const spread = Math.max(0, maxRate - minRate)
  const slabWeights = [0, 0.25, 0.48, 0.72, 1]
  const slabRates = slabWeights.map(weight => round2(minRate + spread * weight))

  return [
    { min: 0, max: 100, upTo: 100, rate: slabRates[0] },
    { min: 101, max: 200, upTo: 200, rate: slabRates[1] },
    { min: 201, max: 300, upTo: 300, rate: slabRates[2] },
    { min: 301, max: 700, upTo: 700, rate: slabRates[3] },
    { min: 701, max: Infinity, upTo: null, rate: slabRates[4] }
  ]
}

export function isSupportedDisco(value: string | null | undefined): value is DistributionOperator {
  if (!value) return false
  const normalized = value.trim().toUpperCase()
  return normalized in DISCO_RATE_RANGES
}

export function normalizeDisco(value: string | null | undefined): DistributionOperator {
  if (!value) return DEFAULT_OPERATOR
  const normalized = value.trim().toUpperCase()
  if (normalized in DISCO_RATE_RANGES) {
    return normalized as DistributionOperator
  }

  for (const operator of Object.keys(DISCO_RATE_RANGES) as DistributionOperator[]) {
    if (normalized.startsWith(`${operator} `) || normalized.startsWith(`${operator}(`)) {
      return operator
    }
  }

  return DEFAULT_OPERATOR
}

export function getTariffConfigForDisco(disco: string | null | undefined): TariffConfig {
  const normalized = normalizeDisco(disco)
  const range = DISCO_RATE_RANGES[normalized]

  return {
    slabs: buildProgressiveSlabs(range.minRate, range.maxRate),
    fuelAdjPerUnit: 4.77,
    fixedCharges: 200,
    taxPercent: 17,
    tvFee: 35
  }
}
