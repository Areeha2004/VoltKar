/**
 * API Integration Tests for Analytics Endpoints
 */

import { NextRequest } from 'next/server'
import { GET as getCosts } from '../../src/app/api/analytics/costs/route'
import { GET as getComparisons } from '../../src/app/api/analytics/comparisons/route'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock Prisma
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    meterReading: {
      findMany: jest.fn()
    }
  }
}))

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com'
  }
}

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
  }
]

describe('/api/analytics/costs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    require('next-auth').getServerSession.mockResolvedValue(mockSession)
    require('../../src/lib/prisma').default.meterReading.findMany.mockResolvedValue(mockReadings)
  })

  it('should return cost analytics successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/costs')
    const response = await getCosts(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('costs')
    expect(data.data.costs).toHaveProperty('actualToDateCost')
    expect(data.data.costs).toHaveProperty('projectedCost')
    expect(data.data.costs).toHaveProperty('averageDailyCost')
  })

  it('should return 401 for unauthorized requests', async () => {
    require('next-auth').getServerSession.mockResolvedValue(null)
    
    const request = new NextRequest('http://localhost:3000/api/analytics/costs')
    const response = await getCosts(request)

    expect(response.status).toBe(401)
  })

  it('should handle date range parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/costs?from=2024-01-01&to=2024-01-31')
    const response = await getCosts(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.period.from).toBe('2024-01-01')
    expect(data.data.period.to).toBe('2024-01-31')
  })

  it('should include cost insights', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/costs')
    const response = await getCosts(request)
    const data = await response.json()

    expect(data.data).toHaveProperty('insights')
    expect(Array.isArray(data.data.insights)).toBe(true)
  })
})

describe('/api/analytics/comparisons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    require('next-auth').getServerSession.mockResolvedValue(mockSession)
    require('../../src/lib/prisma').default.meterReading.findMany.mockResolvedValue(mockReadings)
  })

  it('should return MoM comparison by default', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/comparisons')
    const response = await getComparisons(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.comparisons.comparisonType).toBe('MoM')
  })

  it('should return all comparisons when type=all', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/comparisons?type=all')
    const response = await getComparisons(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.data.comparisons)).toBe(true)
    expect(data.data.comparisons.length).toBeGreaterThan(0)
  })

  it('should include percentage and absolute changes', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/comparisons')
    const response = await getComparisons(request)
    const data = await response.json()

    expect(data.data.comparisons).toHaveProperty('percentageChange')
    expect(data.data.comparisons).toHaveProperty('absoluteChange')
    expect(data.data.comparisons.percentageChange).toHaveProperty('usage')
    expect(data.data.comparisons.percentageChange).toHaveProperty('cost')
  })

  it('should determine trend correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/comparisons')
    const response = await getComparisons(request)
    const data = await response.json()

    expect(data.data.comparisons).toHaveProperty('trend')
    expect(['increasing', 'decreasing', 'stable']).toContain(data.data.comparisons.trend)
  })

  it('should handle YoY comparison', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/comparisons?type=YoY')
    const response = await getComparisons(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    // YoY might not have data, so we just check it doesn't error
  })

  it('should handle Rolling28 comparison', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/comparisons?type=Rolling28')
    const response = await getComparisons(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.comparisons.comparisonType).toBe('Rolling28')
  })

  it('should return 401 for unauthorized requests', async () => {
    require('next-auth').getServerSession.mockResolvedValue(null)
    
    const request = new NextRequest('http://localhost:3000/api/analytics/comparisons')
    const response = await getComparisons(request)

    expect(response.status).toBe(401)
  })

  it('should include comparison insights', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/comparisons')
    const response = await getComparisons(request)
    const data = await response.json()

    expect(data.data).toHaveProperty('insights')
    expect(Array.isArray(data.data.insights)).toBe(true)
  })
})