/**
 * Stats Service Tests - Comprehensive validation of unified metrics
 */

import { computeStatsBundle, validateInvariants, getAnalyticsTimeSeries } from '../../src/lib/statsService'

// Mock dependencies
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    meterReading: {
      findMany: jest.fn()
    },
    appliance: {
      findMany: jest.fn()
    }
  }
}))

jest.mock('../../src/lib/budgetManager', () => ({
  getBudgetFromStorage: jest.fn()
}))

const mockPrisma = require('../../src/lib/prisma').default
const mockBudgetManager = require('../../src/lib/budgetManager')

const mockReadings = [
  {
    id: '1',
    date: new Date('2024-01-05'),
    usage: 50,
    estimatedCost: 500,
    week: 1,
    month: 1,
    year: 2024,
    meter: { id: 'meter1', label: 'Main House', type: 'single-phase' }
  },
  {
    id: '2',
    date: new Date('2024-01-12'),
    usage: 75,
    estimatedCost: 800,
    week: 2,
    month: 1,
    year: 2024,
    meter: { id: 'meter1', label: 'Main House', type: 'single-phase' }
  },
  {
    id: '3',
    date: new Date('2024-01-19'),
    usage: 60,
    estimatedCost: 650,
    week: 3,
    month: 1,
    year: 2024,
    meter: { id: 'meter1', label: 'Main House', type: 'single-phase' }
  }
]

const mockAppliances = [
  {
    id: 'app1',
    name: 'Living Room AC',
    category: 'Air Conditioner',
    type: 'Inverter',
    estimatedKwh: 120,
    usage: 120,
    estimatedCost: 2400
  },
  {
    id: 'app2',
    name: 'Refrigerator',
    category: 'Refrigerator',
    type: 'Non-Inverter',
    estimatedKwh: 45,
    usage: 45,
    estimatedCost: 900
  }
]

describe('StatsService', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-20T10:00:00.000Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.meterReading.findMany.mockResolvedValue(mockReadings)
    mockPrisma.appliance.findMany.mockResolvedValue(mockAppliances)
    mockBudgetManager.getBudgetFromStorage.mockReturnValue(25000)
  })

  describe('computeStatsBundle', () => {
    it('should compute complete stats bundle with all metrics', async () => {
      const result = await computeStatsBundle('test-user-id')

      expect(result).toMatchObject({
        timeframeLabels: {
          mtd: 'MTD',
          prevMonthFull: 'Last Month (Full)',
          forecast: 'Forecast (This Month)'
        },
        window: expect.objectContaining({
          daysElapsed: expect.any(Number),
          daysInMonth: expect.any(Number),
          tz: 'Asia/Karachi'
        }),
        mtd: expect.objectContaining({
          usage_kwh: expect.any(Number),
          cost_pkr: expect.any(Number),
          efficiency_score: expect.any(Number),
          vs_prev_same_period: expect.objectContaining({
            delta_kwh: expect.any(Number),
            delta_cost: expect.any(Number),
            pct_kwh: expect.any(Number),
            pct_cost: expect.any(Number)
          })
        }),
        forecast: expect.objectContaining({
          usage_kwh: expect.any(Number),
          cost_pkr: expect.any(Number),
          method: expect.stringMatching(/proportional|profile_scaled|last_month_blend/)
        }),
        budget: expect.objectContaining({
          monthly_pkr: 25000,
          status: expect.stringMatching(/On Track|At Risk|Over Budget/)
        }),
        calcId: expect.stringMatching(/^calc_/)
      })
    })

    it('should handle empty readings gracefully', async () => {
      mockPrisma.meterReading.findMany.mockResolvedValue([])
      
      const result = await computeStatsBundle('test-user-id')
      
      expect(result.mtd.usage_kwh).toBe(0)
      expect(result.mtd.cost_pkr).toBe(0)
      expect(result.forecast.usage_kwh).toBe(0)
      expect(result.forecast.cost_pkr).toBe(0)
    })

    it('should calculate MTD vs previous same period correctly', async () => {
      // Mock previous month readings for same period
      const prevMonthReadings = [
        {
          id: 'prev1',
          date: new Date('2023-12-05'),
          usage: 40,
          estimatedCost: 400,
          week: 1,
          month: 12,
          year: 2023
        },
        {
          id: 'prev2',
          date: new Date('2023-12-12'),
          usage: 60,
          estimatedCost: 600,
          week: 2,
          month: 12,
          year: 2023
        }
      ]

      mockPrisma.meterReading.findMany
        .mockResolvedValueOnce(mockReadings) // Current month
        .mockResolvedValueOnce(prevMonthReadings) // Previous month

      const result = await computeStatsBundle('test-user-id')
      
      // MTD usage: 50 + 75 + 60 = 185 kWh
      // Previous same period: 40 + 60 = 100 kWh (filtered by daysElapsed)
      expect(result.mtd.usage_kwh).toBe(185)
      expect(result.mtd.vs_prev_same_period.pct_kwh).toBeGreaterThan(0) // Should show increase
    })

    it('should determine budget status correctly', async () => {
      // Test Over Budget scenario
      mockBudgetManager.getBudgetFromStorage.mockReturnValue(1000) // Very low budget
      
      const result = await computeStatsBundle('test-user-id')
      
      expect(result.budget.status).toBe('Over Budget')
      expect(result.budget.projected_overrun_pkr).toBeGreaterThan(0)
    })

    it('should use appropriate forecast method based on data availability', async () => {
      // Test with minimal data (should use proportional)
      mockPrisma.meterReading.findMany
        .mockResolvedValueOnce([mockReadings[0]]) // Only one reading
        .mockResolvedValueOnce([]) // No previous month data

      const result = await computeStatsBundle('test-user-id')
      
      expect(result.forecast.method).toBe('proportional')
    })

    it('should include data quality warnings when appropriate', async () => {
      mockPrisma.meterReading.findMany.mockResolvedValue([])
      
      const result = await computeStatsBundle('test-user-id')
      
      expect(result.data_quality.warnings).toContain('No readings found for current month')
    })
  })

  describe('validateInvariants', () => {
    it('should validate device reconciliation within tolerance', async () => {
      const result = await validateInvariants('test-user-id')
      
      expect(result).toMatchObject({
        valid: expect.any(Boolean),
        violations: expect.any(Array),
        deviceReconciliation: expect.objectContaining({
          deviceSum: expect.any(Number),
          totalUsage: expect.any(Number),
          variance: expect.any(Number),
          withinTolerance: expect.any(Boolean)
        })
      })
    })

    it('should detect cost calculation discrepancies', async () => {
      // Mock readings with incorrect cost calculations
      const badReadings = [{
        ...mockReadings[0],
        usage: 100,
        estimatedCost: 1 // Severely underestimated cost
      }]
      
      mockPrisma.meterReading.findMany.mockResolvedValue(badReadings)
      
      const result = await validateInvariants('test-user-id')
      
      expect(result.valid).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.violations[0]).toContain('Cost variance')
    })
  })

  describe('getAnalyticsTimeSeries', () => {
    it('should generate time series data for charts', async () => {
      const result = await getAnalyticsTimeSeries('test-user-id')
      
      expect(result).toMatchObject({
        dailyUsage: expect.any(Array),
        weeklyBreakdown: expect.any(Array),
        budgetProgress: expect.any(Array)
      })
      
      expect(result.weeklyBreakdown).toHaveLength(5) // Weeks 1-5
      expect(result.weeklyBreakdown[0]).toMatchObject({
        week: 1,
        usage: expect.any(Number),
        cost: expect.any(Number)
      })
    })

    it('should handle budget progress calculation', async () => {
      mockBudgetManager.getBudgetFromStorage.mockReturnValue(25000)
      
      const result = await getAnalyticsTimeSeries('test-user-id')
      
      expect(result.budgetProgress.length).toBeGreaterThan(0)
      expect(result.budgetProgress[0]).toMatchObject({
        day: expect.any(Number),
        spent: expect.any(Number),
        budget: expect.any(Number)
      })
    })
  })

  describe('Timezone Handling', () => {
    it('should use Asia/Karachi timezone for all calculations', async () => {
      const result = await computeStatsBundle('test-user-id')
      
      expect(result.window.tz).toBe('Asia/Karachi')
      
      // Verify that month boundaries are calculated in local time
      expect(result.window.monthStart.getDate()).toBe(1)
      expect(result.window.daysElapsed).toBeGreaterThan(0)
      expect(result.window.daysInMonth).toBeGreaterThanOrEqual(28)
    })
  })

  describe('Forecast Methods', () => {
    it('should use proportional method by default', async () => {
      const result = await computeStatsBundle('test-user-id')
      
      expect(['proportional', 'profile_scaled', 'last_month_blend']).toContain(result.forecast.method)
    })

    it('should calculate forecast cost using tariff engine', async () => {
      const result = await computeStatsBundle('test-user-id')
      
      // Forecast cost should be calculated via tariff engine, not linear approximation
      expect(result.forecast.cost_pkr).toBeGreaterThan(0)
      expect(result.forecast.usage_kwh).toBeGreaterThan(0)
    })
  })

  describe('Budget Integration', () => {
    it('should handle no budget scenario', async () => {
      mockBudgetManager.getBudgetFromStorage.mockReturnValue(null)
      
      const result = await computeStatsBundle('test-user-id')
      
      expect(result.budget.monthly_pkr).toBeNull()
      expect(result.budget.status).toBe('On Track')
    })

    it('should calculate prorated budget correctly', async () => {
      mockBudgetManager.getBudgetFromStorage.mockReturnValue(30000)
      
      const result = await computeStatsBundle('test-user-id')
      
      const expectedProrated = (30000 * result.window.daysElapsed) / result.window.daysInMonth
      expect(result.budget.prorated_budget_pkr).toBeCloseTo(expectedProrated, 0)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.meterReading.findMany.mockRejectedValue(new Error('Database error'))
      
      await expect(computeStatsBundle('test-user-id')).rejects.toThrow('Database error')
    })

    it('should handle invalid readings data', async () => {
      mockPrisma.meterReading.findMany.mockResolvedValue([
        { id: '1', date: null, usage: null, estimatedCost: null }
      ])
      
      const result = await computeStatsBundle('test-user-id')
      
      expect(result.mtd.usage_kwh).toBe(0)
      expect(result.mtd.cost_pkr).toBe(0)
    })
  })
})

describe('Metrics Consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.meterReading.findMany.mockResolvedValue(mockReadings)
    mockPrisma.appliance.findMany.mockResolvedValue(mockAppliances)
    mockBudgetManager.getBudgetFromStorage.mockReturnValue(25000)
  })

  it('should maintain consistency between MTD and forecast calculations', async () => {
    const result = await computeStatsBundle('test-user-id')
    
    // MTD should be based on actual readings
    expect(result.mtd.usage_kwh).toBe(185) // 50 + 75 + 60
    
    // Forecast should be proportional projection
    const expectedForecast = (185 / 20) * 31 // 20 days elapsed, 31 days in January
    expect(result.forecast.usage_kwh).toBeCloseTo(expectedForecast, 0)
  })

  it('should ensure cost calculations use tariff engine consistently', async () => {
    const result = await computeStatsBundle('test-user-id')
    
    // All costs should be calculated via tariff engine
    expect(result.mtd.cost_pkr).toBeGreaterThan(0)
    expect(result.forecast.cost_pkr).toBeGreaterThan(0)
    
    // Cost should not be linear with usage due to slab structure
    const costPerKwhMTD = result.mtd.cost_pkr / result.mtd.usage_kwh
    const costPerKwhForecast = result.forecast.cost_pkr / result.forecast.usage_kwh
    
    // Due to slab progression, forecast cost per kWh might be different
    expect(costPerKwhMTD).toBeGreaterThan(0)
    expect(costPerKwhForecast).toBeGreaterThan(0)
  })

  it('should maintain timeframe consistency across all metrics', async () => {
    const result = await computeStatsBundle('test-user-id')
    
    // All timeframe labels should be consistent
    expect(result.timeframeLabels.mtd).toBe('MTD')
    expect(result.timeframeLabels.prevMonthFull).toBe('Last Month (Full)')
    expect(result.timeframeLabels.forecast).toBe('Forecast (This Month)')
    
    // Window should reflect Asia/Karachi timezone
    expect(result.window.tz).toBe('Asia/Karachi')
  })
})

describe('Data Quality Validation', () => {
  it('should detect insufficient data for forecasting', async () => {
    // Mock scenario with very few readings
    mockPrisma.meterReading.findMany.mockResolvedValue([mockReadings[0]])
    
    const result = await computeStatsBundle('test-user-id')
    
    expect(result.data_quality.warnings).toContain('Insufficient readings for accurate forecasting')
  })

  it('should validate device reconciliation', async () => {
    const result = await validateInvariants('test-user-id')
    
    expect(result.deviceReconciliation).toBeDefined()
    expect(result.deviceReconciliation?.deviceSum).toBeGreaterThan(0)
    expect(result.deviceReconciliation?.totalUsage).toBeGreaterThan(0)
  })
})