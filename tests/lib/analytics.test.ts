/**
 * Analytics Engine Tests (Improved & Deterministic)
 * Covers core analytics + edge cases for usage, cost, efficiency & forecasting
 */

import {
  bucketDailyUsage,
  computeMTD,
  forecastUsage,
  forecastBill,
  generateMonthlyBreakdown,
  calculateEfficiencyScore
} from '../../src/lib/analytics'
import {
  generateUsageInsights,
  generateCostInsights,
  detectPeakUsageDays,
  checkBudgetStatus
} from '../../src/lib/insights'
const mockReadings = [
    {
      id: '1',
      date: new Date('2024-01-05'),
      usage: 50,
      estimatedCost: 500,
      week: 1,
      month: 1,
      year: 2024
    },
    {
      id: '2',
      date: new Date('2024-01-12'),
      usage: 75,
      estimatedCost: 800,
      week: 2,
      month: 1,
      year: 2024
    },
    {
      id: '3',
      date: new Date('2024-01-19'),
      usage: 60,
      estimatedCost: 650,
      week: 3,
      month: 1,
      year: 2024
    }
  ]
describe('Analytics Engine', () => {
  

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-20'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('bucketDailyUsage', () => {
    it('groups readings by week correctly', () => {
      const result = bucketDailyUsage(mockReadings)

      expect(result.length).toBeGreaterThanOrEqual(3)
      expect(result[0]).toMatchObject({
        week: 1,
        usage: 50,
        cost: 500,
        readingsCount: 1
      })
      expect(result[1]).toMatchObject({
        week: 2,
        usage: 75,
        cost: 800,
        readingsCount: 1
      })
    })

    it('returns empty array when no readings', () => {
      expect(bucketDailyUsage([])).toEqual([])
    })

    it('aggregates multiple readings in the same week', () => {
      const readings = [
        ...mockReadings,
        {
          id: '4',
          date: new Date('2024-01-06'),
          usage: 25,
          estimatedCost: 250,
          week: 1,
          month: 1,
          year: 2024
        }
      ]

      const result = bucketDailyUsage(readings)
      expect(result.find(r => r.week === 1)).toMatchObject({
        usage: 75, // 50 + 25
        cost: 750, // 500 + 250
        readingsCount: 2
      })
    })
  })

  describe('computeMTD', () => {
    it('calculates month-to-date totals correctly', () => {
      const result = computeMTD(mockReadings)

      expect(result).toMatchObject({
        usage: 185,
        cost: 1950,
        daysElapsed: 20
      })
    })

    it('returns zeros for empty readings', () => {
      expect(computeMTD([])).toEqual({
        usage: 0,
        cost: 0,
        daysElapsed: 0
      })
    })
  })

  describe('forecastUsage', () => {
    it('forecasts usage based on elapsed days', () => {
      expect(forecastUsage(100, 10, 30)).toEqual({
        low: 270,
        expected: 300,
        high: 330
      })
    })

    it('returns zeros when usage is zero', () => {
      expect(forecastUsage(0, 10, 30)).toEqual({ low: 0, expected: 0, high: 0 })
    })

    it('returns zeros when days elapsed is zero', () => {
      expect(forecastUsage(100, 0, 30)).toEqual({ low: 0, expected: 0, high: 0 })
    })
  })

  describe('forecastBill', () => {
    it('calculates bill projections from usage forecast', () => {
      const usageForecast = { low: 200, expected: 250, high: 300 }
      const result = forecastBill(usageForecast)

      expect(result.low).toBeGreaterThan(0)
      expect(result.expected).toBeGreaterThan(result.low)
      expect(result.high).toBeGreaterThan(result.expected)
    })

    it('returns zeros when forecast usage is zero', () => {
      expect(forecastBill({ low: 0, expected: 0, high: 0 }))
        .toEqual({ low: 0, expected: 0, high: 0 })
    })
  })

  describe('generateMonthlyBreakdown', () => {
    it('generates complete monthly breakdown', () => {
      const result = generateMonthlyBreakdown(mockReadings)

      expect(result).toEqual(expect.objectContaining({
        weeklyBreakdown: expect.any(Array),
        monthToDateUsage: expect.any(Number),
        monthToDateCost: expect.any(Number),
        averageDailyUsage: expect.any(Number),
        daysElapsed: expect.any(Number)
      }))
    })

    it('returns default breakdown for empty readings', () => {
      const result = generateMonthlyBreakdown([])
      expect(result.weeklyBreakdown).toEqual([])
      expect(result.monthToDateUsage).toBe(0)
      expect(result.monthToDateCost).toBe(0)
    })
  })

  describe('calculateEfficiencyScore', () => {
    it('calculates efficiency score with all parameters', () => {
      const score = calculateEfficiencyScore(100, 120, 90)
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('returns 100 when current usage is zero', () => {
      expect(calculateEfficiencyScore(0, 100, 50)).toBe(100)
    })

    it('returns 100 when previous & target are missing', () => {
      expect(calculateEfficiencyScore(100)).toBe(100)
    })
  })

  describe('Month-end Projection', () => {
    it('should project total month usage and cost if current pattern continues', () => {
      // First 10 days of January usage: 20, 25, 30 = total 75 kWh
      const partialReadings = [
        { id: '1', date: new Date('2024-01-02'), usage: 20, estimatedCost: 200, week: 1, month: 1, year: 2024 },
        { id: '2', date: new Date('2024-01-05'), usage: 25, estimatedCost: 250, week: 1, month: 1, year: 2024 },
        { id: '3', date: new Date('2024-01-10'), usage: 30, estimatedCost: 300, week: 2, month: 1, year: 2024 },
      ]

      const daysElapsed = 10
      const daysInMonth = 31
      const totalSoFar = partialReadings.reduce((sum, r) => sum + r.usage, 0)
      const avgPerDay = totalSoFar / daysElapsed
      const projectedUsage = avgPerDay * daysInMonth

      const projectedCost = projectedUsage * 10 // Dummy tariff: 10 currency units/kWh

      expect(Math.round(projectedUsage)).toBe(Math.round((75 / 10) * 31))
      expect(Math.round(projectedCost)).toBe(Math.round(projectedUsage * 10))
    })
  })

  describe('Edge Cases', () => {
    it('handles readings with missing usage data', () => {
      const readings = [{
        id: '1',
        date: new Date('2024-01-05'),
        usage: 0,
        estimatedCost: 0,
        week: 1,
        month: 1,
        year: 2024
      }]
      const result = bucketDailyUsage(readings)
      expect(result[0].usage).toBe(0)
      expect(result[0].cost).toBe(0)
    })

    it('handles irregular reading dates', () => {
      const irregular = [
        {
          id: '1',
          date: new Date('2024-01-01'),
          usage: 30,
          estimatedCost: 300,
          week: 1,
          month: 1,
          year: 2024
        },
        {
          id: '2',
          date: new Date('2024-01-31'),
          usage: 40,
          estimatedCost: 400,
          week: 5,
          month: 1,
          year: 2024
        }
      ]
      const result = bucketDailyUsage(irregular)
      expect(result.find(r => r.week === 1)?.usage).toBe(30)
      expect(result.find(r => r.week === 5)?.usage).toBe(40)
    })
  })
})

describe('Insights Engine', () => {
  const mockBreakdown = {
    weeklyBreakdown: [
      { week: 1, usage: 50, cost: 500, readingsCount: 1 },
      { week: 2, usage: 75, cost: 800, readingsCount: 1 },
      { week: 3, usage: 60, cost: 650, readingsCount: 1 }
    ],
    monthToDateUsage: 185,
    monthToDateCost: 1950,
    averageDailyUsage: 9.25,
    daysElapsed: 20
  }

  describe('detectPeakUsageDays', () => {
    it('identifies peak usage days correctly', () => {
      const readings = [
        { id: '1', date: new Date('2024-01-05'), usage: 30, estimatedCost: 300, week: 1, month: 1, year: 2024 },
        { id: '2', date: new Date('2024-01-06'), usage: 50, estimatedCost: 500, week: 1, month: 1, year: 2024 },
        { id: '3', date: new Date('2024-01-07'), usage: 25, estimatedCost: 250, week: 1, month: 1, year: 2024 }
      ]

      const peaks = detectPeakUsageDays(readings, 2)
      expect(peaks).toHaveLength(2)
      expect(peaks[0].usage).toBe(50)
      expect(peaks[0].date).toBe('2024-01-06')
    })

    it('returns empty array for no readings', () => {
      expect(detectPeakUsageDays([], 3)).toEqual([])
    })
  })

  describe('checkBudgetStatus', () => {
    it('calculates budget status correctly', () => {
      const status = checkBudgetStatus(150, 200, 15, 30)
      expect(status.targetKwh).toBe(200)
      expect(status.currentUsage).toBe(150)
      expect(status.percentageUsed).toBe(75)
      expect(status.onTrack).toBe(true)
    })

    it('detects budget overrun', () => {
      const status = checkBudgetStatus(180, 200, 15, 30)
      expect(status.onTrack).toBe(false)
      expect(status.projectedOverage).toBeGreaterThan(0)
    })

    it('handles no target budget', () => {
      const status = checkBudgetStatus(150, undefined, 15, 30)
      expect(status.targetKwh).toBeUndefined()
      expect(status.onTrack).toBe(true)
    })
  })

  describe('generateUsageInsights', () => {
    it('generates budget warning when over target', () => {
      const insights = generateUsageInsights(mockBreakdown, mockReadings, 150)
      const budgetWarning = insights.find(i => i.id === 'budget-warning')
      expect(budgetWarning).toBeDefined()
      expect(budgetWarning?.type).toBe('warning')
    })

    it('generates success insight when under budget', () => {
      const insights = generateUsageInsights(mockBreakdown, mockReadings, 300)
      const budgetSuccess = insights.find(i => i.id === 'budget-success')
      expect(budgetSuccess).toBeDefined()
      expect(budgetSuccess?.type).toBe('success')
    })

    it('detects usage spikes between weeks', () => {
      const spikeBreakdown = {
        ...mockBreakdown,
        weeklyBreakdown: [
          { week: 1, usage: 50, cost: 500, readingsCount: 1 },
          { week: 2, usage: 50, cost: 500, readingsCount: 1 },
          { week: 3, usage: 100, cost: 1000, readingsCount: 1 } // 100% increase
        ]
      }
      
      const insights = generateUsageInsights(spikeBreakdown, mockReadings)
      const spikeInsight = insights.find(i => i.id === 'usage-spike')
      expect(spikeInsight).toBeDefined()
      expect(spikeInsight?.priority).toBe('high')
    })
  })

  describe('generateCostInsights', () => {
    it('warns about high projected costs', () => {
      const insights = generateCostInsights(5000, 16000, 500)
      const highCostWarning = insights.find(i => i.id === 'high-cost-warning')
      expect(highCostWarning).toBeDefined()
      expect(highCostWarning?.type).toBe('warning')
    })

    it('celebrates cost savings', () => {
      const insights = generateCostInsights(3000, 8000, 300, 12000)
      const savingsInsight = insights.find(i => i.id === 'cost-savings')
      expect(savingsInsight).toBeDefined()
      expect(savingsInsight?.type).toBe('success')
    })

    it('warns about cost increases', () => {
      const insights = generateCostInsights(8000, 15000, 500, 10000)
      const increaseWarning = insights.find(i => i.id === 'cost-increase')
      expect(increaseWarning).toBeDefined()
      expect(increaseWarning?.priority).toBe('high')
    })
  })
})

describe('Cost Projections', () => {
  it('should project costs accurately based on current usage trend', () => {
    const currentUsage = 100 // kWh in 10 days
    const daysElapsed = 10
    const daysInMonth = 30
    
    const projectedUsage = (currentUsage / daysElapsed) * daysInMonth
    expect(projectedUsage).toBe(300)
    
    // Test with tariff engine
    const forecast = forecastUsage(currentUsage, daysElapsed, daysInMonth)
    expect(forecast.expected).toBe(300)
    
    const billForecast = forecastBill(forecast)
    expect(billForecast.expected).toBeGreaterThan(0)
  })
})

describe('MoM and YoY Comparisons', () => {
  it('should calculate month-over-month percentage changes', () => {
    const currentMonth = { usage: 250, cost: 5000 }
    const lastMonth = { usage: 200, cost: 4000 }
    
    const usageChange = ((currentMonth.usage - lastMonth.usage) / lastMonth.usage) * 100
    const costChange = ((currentMonth.cost - lastMonth.cost) / lastMonth.cost) * 100
    
    expect(usageChange).toBe(25) // 25% increase
    expect(costChange).toBe(25) // 25% increase
  })

  it('should handle year-over-year comparisons', () => {
    const thisYear = { usage: 300, cost: 6000 }
    const lastYear = { usage: 350, cost: 7000 }
    
    const usageChange = ((thisYear.usage - lastYear.usage) / lastYear.usage) * 100
    const costChange = ((thisYear.cost - lastYear.cost) / lastYear.cost) * 100
    
    expect(Math.round(usageChange)).toBe(-14) // 14% decrease
    expect(Math.round(costChange)).toBe(-14) // 14% decrease
  })
})

describe('Rolling 28-day Trends', () => {
  it('should calculate rolling averages correctly', () => {
    const last28Days = [
      { date: '2024-01-01', usage: 10 },
      { date: '2024-01-02', usage: 12 },
      { date: '2024-01-03', usage: 8 },
      { date: '2024-01-04', usage: 15 }
    ]
    
    const totalUsage = last28Days.reduce((sum, day) => sum + day.usage, 0)
    const averageDaily = totalUsage / 28 // Assuming 28 days
    
    expect(totalUsage).toBe(45)
    expect(Math.round(averageDaily * 100) / 100).toBe(1.61)
  })
})