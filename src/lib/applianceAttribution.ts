export interface ApplianceAttributionInput {
  id: string
  estimatedKwh: number
}

export interface ApplianceAttributionContext {
  mtdUsageKwh: number
  mtdCostPkr: number
  forecastUsageKwh: number
  forecastCostPkr: number
  daysElapsed: number
  daysInMonth: number
}

export interface ApplianceAttributionMetrics {
  usageSharePct: number
  billSharePct: number
  estimatedMonthlyKwh: number
  estimatedMtdKwh: number
  attributedMtdUsageKwh: number
  attributedMtdCostPkr: number
  attributedForecastUsageKwh: number
  attributedForecastCostPkr: number
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function computeApplianceAttribution(
  appliances: ApplianceAttributionInput[],
  context: ApplianceAttributionContext
): {
  byId: Record<string, ApplianceAttributionMetrics>
  consistency: {
    deviceEstimatedMonthlyKwh: number
    deviceExpectedMtdKwh: number
    meterMtdUsageKwh: number
    meterForecastUsageKwh: number
    forecastDeltaKwh: number
    forecastDeltaPct: number
    calibrationFactorMtd: number
  }
} {
  const normalized = appliances.map(item => ({
    id: item.id,
    estimatedKwh: Math.max(0, Number(item.estimatedKwh) || 0)
  }))
  const totalEstimatedMonthlyKwh = normalized.reduce((sum, item) => sum + item.estimatedKwh, 0)
  const periodRatio =
    context.daysInMonth > 0
      ? Math.max(0, Math.min(1, context.daysElapsed / context.daysInMonth))
      : 0
  const expectedMtdKwh = totalEstimatedMonthlyKwh * periodRatio
  const calibrationFactorMtd =
    expectedMtdKwh > 0 ? context.mtdUsageKwh / expectedMtdKwh : 0

  const byId: Record<string, ApplianceAttributionMetrics> = {}

  for (const appliance of normalized) {
    const share = totalEstimatedMonthlyKwh > 0 ? appliance.estimatedKwh / totalEstimatedMonthlyKwh : 0
    byId[appliance.id] = {
      usageSharePct: round2(share * 100),
      billSharePct: round2(share * 100),
      estimatedMonthlyKwh: round2(appliance.estimatedKwh),
      estimatedMtdKwh: round2(appliance.estimatedKwh * periodRatio),
      attributedMtdUsageKwh: round2(context.mtdUsageKwh * share),
      attributedMtdCostPkr: round2(context.mtdCostPkr * share),
      attributedForecastUsageKwh: round2(context.forecastUsageKwh * share),
      attributedForecastCostPkr: round2(context.forecastCostPkr * share)
    }
  }

  const forecastDeltaKwh = round2(context.forecastUsageKwh - totalEstimatedMonthlyKwh)
  const forecastDeltaPct =
    totalEstimatedMonthlyKwh > 0
      ? round2((forecastDeltaKwh / totalEstimatedMonthlyKwh) * 100)
      : 0

  return {
    byId,
    consistency: {
      deviceEstimatedMonthlyKwh: round2(totalEstimatedMonthlyKwh),
      deviceExpectedMtdKwh: round2(expectedMtdKwh),
      meterMtdUsageKwh: round2(context.mtdUsageKwh),
      meterForecastUsageKwh: round2(context.forecastUsageKwh),
      forecastDeltaKwh,
      forecastDeltaPct,
      calibrationFactorMtd: round2(calibrationFactorMtd)
    }
  }
}
