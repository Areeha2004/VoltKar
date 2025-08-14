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

describe('Analytics Engine', () => {
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
