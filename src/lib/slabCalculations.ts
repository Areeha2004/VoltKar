// Utility functions for electricity slab calculations
// This implements the dummy cost calculation formula

export interface TariffSlab {
  min: number;
  max: number;
  rate: number;
}

export interface CostBreakdown {
  slabBreakdown: Array<{
    slab: string;
    units: number;
    rate: number;
    cost: number;
  }>;
  baseCost: number;
  fpaAmount: number;
  subtotal: number;
  gstAmount: number;
  tvFee: number;
  totalCost: number;
  nextSlabUnits?: number;
  slabWarning: boolean;
}

// Dummy tariff structure for Pakistan (LESCO rates example)
export const TARIFF_SLABS: TariffSlab[] = [
  { min: 0, max: 50, rate: 3.95 },
  { min: 51, max: 100, rate: 7.74 },
  { min: 101, max: 200, rate: 10.06 },
  { min: 201, max: 300, rate: 18.15 },
  { min: 301, max: 700, rate: 22.71 },
  { min: 701, max: Infinity, rate: 28.30 }
];

export const FPA_RATE = 4.77; // Rs per kWh
export const GST_RATE = 0.17; // 17%
export const TV_FEE = 35; // Rs per month
export const FIXED_CHARGES = 200; // Rs per month

/**
 * Calculate electricity bill based on slab structure
 */
export function calculateElectricityBill(units: number): CostBreakdown {
  const slabBreakdown: CostBreakdown['slabBreakdown'] = [];
  let baseCost = 0;
  let remainingUnits = units;
  let currentSlabIndex = 0;

  // Calculate cost for each slab
  for (const slab of TARIFF_SLABS) {
    if (remainingUnits <= 0) break;

    const slabUnits = Math.min(remainingUnits, slab.max - slab.min + 1);
    const slabCost = slabUnits * slab.rate;
    
    baseCost += slabCost;
    
    slabBreakdown.push({
      slab: slab.max === Infinity ? `${slab.min}+` : `${slab.min}-${slab.max}`,
      units: slabUnits,
      rate: slab.rate,
      cost: slabCost
    });

    remainingUnits -= slabUnits;
    currentSlabIndex++;
  }

  // Calculate additional charges
  const fpaAmount = units * FPA_RATE;
  const subtotal = baseCost + fpaAmount + FIXED_CHARGES;
  const gstAmount = subtotal * GST_RATE;
  const totalCost = subtotal + gstAmount + TV_FEE;

  // Check for slab warning (within 20 units of next slab)
  const currentSlab = TARIFF_SLABS[currentSlabIndex - 1];
  const nextSlab = TARIFF_SLABS[currentSlabIndex];
  const slabWarning = nextSlab && (nextSlab.min - units) <= 20;
  const nextSlabUnits = nextSlab ? nextSlab.min - units : undefined;

  return {
    slabBreakdown,
    baseCost: Math.round(baseCost * 100) / 100,
    fpaAmount: Math.round(fpaAmount * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    tvFee: TV_FEE,
    totalCost: Math.round(totalCost * 100) / 100,
    nextSlabUnits,
    slabWarning
  };
}

/**
 * Get current slab information for given units
 */
export function getCurrentSlab(units: number): { slab: TariffSlab; index: number } | null {
  for (let i = 0; i < TARIFF_SLABS.length; i++) {
    const slab = TARIFF_SLABS[i];
    if (units >= slab.min && units <= slab.max) {
      return { slab, index: i };
    }
  }
  return null;
}

/**
 * Calculate usage difference between two readings
 */
export function calculateUsage(currentReading: number, previousReading: number): number {
  return Math.max(0, currentReading - previousReading);
}

/**
 * Project monthly cost based on current usage
 */
export function projectMonthlyCost(currentUnits: number, daysElapsed: number): CostBreakdown {
  const daysInMonth = 30;
  const projectedUnits = (currentUnits / daysElapsed) * daysInMonth;
  return calculateElectricityBill(projectedUnits);
}

/**
 * Get slab warning message
 */
export function getSlabWarningMessage(units: number): string | null {
  const breakdown = calculateElectricityBill(units);
  if (!breakdown.slabWarning || !breakdown.nextSlabUnits) return null;
  
  const nextSlab = TARIFF_SLABS.find(s => s.min > units);
  if (!nextSlab) return null;
  
  return `Warning: You're ${breakdown.nextSlabUnits} units away from the next slab (Rs ${nextSlab.rate}/kWh). Consider reducing usage to save costs.`;
}