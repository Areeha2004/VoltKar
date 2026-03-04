import { tariffEngine } from '../../src/lib/tariffEngine'

let computeStatsBundle: any
let getDashboardStats: any
let getAnalyticsCosts: any
let createReading: any
let updateReading: any
let getMeters: any
let createMeter: any
let updateMeter: any
let deleteMeter: any
let getForecastUsage: any
let getForecastBill: any
let getBudgetMonitor: any
let getComparisons: any

type MeterRecord = {
  id: string
  userId: string
  label: string
  type?: string | null
  createdAt: Date
}

type MeterReadingRecord = {
  id: string
  meterId: string
  userId: string
  reading: number
  week: number
  month: number
  year: number
  date: Date
  createdAt: Date
  isOfficialEndOfMonth: boolean
  usage: number | null
  estimatedCost: number | null
  notes: string | null
}

type UserPreferenceRecord = {
  id: string
  userId: string
  disco: string
  language: string
  unitType: string
  currency: string
  monthlyBudgetPkr?: number | null
}

const db: {
  meters: MeterRecord[]
  readings: MeterReadingRecord[]
  prefs: UserPreferenceRecord[]
} = {
  meters: [],
  readings: [],
  prefs: []
}

let readingSeq = 1
let prefSeq = 1

function dateOf(value: string): Date {
  return new Date(value)
}

function getRequest(url: string) {
  return { url } as any
}

function jsonRequest(url: string, body: Record<string, any>) {
  return {
    url,
    json: async () => body
  } as any
}

function pick<T extends Record<string, any>>(row: T, select?: Record<string, boolean>) {
  if (!select) return { ...row }
  const out: Record<string, any> = {}
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled) out[key] = row[key]
  }
  return out
}

function applyOrder<T extends Record<string, any>>(rows: T[], orderBy?: any): T[] {
  if (!orderBy) return [...rows]
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy]

  return [...rows].sort((a, b) => {
    for (const order of orders) {
      const [key, direction] = Object.entries(order)[0] as [string, 'asc' | 'desc']
      const av = a[key] instanceof Date ? a[key].getTime() : a[key]
      const bv = b[key] instanceof Date ? b[key].getTime() : b[key]
      if (av === bv) continue
      if (av < bv) return direction === 'asc' ? -1 : 1
      return direction === 'asc' ? 1 : -1
    }
    return 0
  })
}

function matchesDateFilter(value: Date, filter: any): boolean {
  if (!filter) return true
  if (filter.lt && !(value < filter.lt)) return false
  if (filter.lte && !(value <= filter.lte)) return false
  if (filter.gt && !(value > filter.gt)) return false
  if (filter.gte && !(value >= filter.gte)) return false
  return true
}

function matchesReadingWhere(row: MeterReadingRecord, where?: any): boolean {
  if (!where) return true
  if (where.NOT?.id && row.id === where.NOT.id) return false
  if (where.id && row.id !== where.id) return false
  if (where.userId && row.userId !== where.userId) return false
  if (where.meterId && row.meterId !== where.meterId) return false
  if (where.week !== undefined && row.week !== where.week) return false
  if (where.month !== undefined && row.month !== where.month) return false
  if (where.year !== undefined && row.year !== where.year) return false
  if (!matchesDateFilter(row.date, where.date)) return false
  return true
}

function addMeter(partial: Partial<MeterRecord> & Pick<MeterRecord, 'id' | 'userId' | 'label'>) {
  db.meters.push({
    id: partial.id,
    userId: partial.userId,
    label: partial.label,
    type: partial.type ?? null,
    createdAt: partial.createdAt ?? new Date()
  })
}

function addReading(partial: Partial<MeterReadingRecord> & {
  id: string
  meterId: string
  userId: string
  reading: number
  week: number
  month: number
  year: number
  date: Date
}) {
  db.readings.push({
    id: partial.id,
    meterId: partial.meterId,
    userId: partial.userId,
    reading: partial.reading,
    week: partial.week,
    month: partial.month,
    year: partial.year,
    date: partial.date,
    createdAt: partial.createdAt ?? partial.date,
    isOfficialEndOfMonth: partial.isOfficialEndOfMonth ?? false,
    usage: partial.usage ?? 0,
    estimatedCost: partial.estimatedCost ?? 0,
    notes: partial.notes ?? null
  })
}

var prismaMock: any = {
  meter: {
    findMany: jest.fn(async (args: any = {}) => {
      const where = args.where || {}
      let rows = db.meters.filter(m => {
        if (where.userId && m.userId !== where.userId) return false
        if (where.id && m.id !== where.id) return false
        return true
      })
      if (args.include?.readings) {
        return rows.map(meter => {
          const orderedReadings = applyOrder(
            db.readings.filter(r => r.meterId === meter.id),
            args.include.readings.orderBy
          )
          const take = args.include.readings.take
          return {
            ...meter,
            readings: take ? orderedReadings.slice(0, take) : orderedReadings
          }
        })
      }
      if (args.select) {
        return rows.map(r => pick(r as any, args.select))
      }
      return rows.map(r => ({ ...r }))
    }),
    findFirst: jest.fn(async (args: any = {}) => {
      const where = args.where || {}
      const rows = db.meters.filter(m => {
        if (where.userId && m.userId !== where.userId) return false
        if (where.id && m.id !== where.id) return false
        return true
      })
      const first = rows[0]
      if (!first) return null
      return args.select ? pick(first as any, args.select) : { ...first }
    }),
    create: jest.fn(async (args: any) => {
      const data = args.data
      const record: MeterRecord = {
        id: data.id || `meter-${db.meters.length + 1}`,
        userId: data.userId,
        label: data.label,
        type: data.type ?? null,
        createdAt: data.createdAt || new Date()
      }
      db.meters.push(record)
      return { ...record }
    }),
    update: jest.fn(async (args: any) => {
      const meter = db.meters.find(m => m.id === args.where.id)
      if (!meter) throw new Error('Meter not found')
      Object.assign(meter, args.data)
      return { ...meter }
    }),
    delete: jest.fn(async (args: any) => {
      const idx = db.meters.findIndex(m => m.id === args.where.id)
      if (idx < 0) throw new Error('Meter not found')
      const [deleted] = db.meters.splice(idx, 1)
      db.readings = db.readings.filter(r => r.meterId !== deleted.id)
      return { ...deleted }
    })
  },
  meterReading: {
    findMany: jest.fn(async (args: any = {}) => {
      const where = args.where || {}
      const rows = db.readings.filter(r => matchesReadingWhere(r, where))
      const sorted = applyOrder(rows, args.orderBy)
      const sliced = sorted.slice(args.skip || 0, args.take ? (args.skip || 0) + args.take : undefined)

      return sliced.map(row => {
        const base = args.select ? pick(row as any, args.select) : { ...row }
        if (args.include?.meter) {
          const meter = db.meters.find(m => m.id === row.meterId) || null
          return { ...base, meter }
        }
        return base
      })
    }),
    findFirst: jest.fn(async (args: any = {}) => {
      const where = args.where || {}
      const rows = db.readings.filter(r => matchesReadingWhere(r, where))
      const sorted = applyOrder(rows, args.orderBy)
      const first = sorted[0]
      if (!first) return null
      const base = args.select ? pick(first as any, args.select) : { ...first }
      if (args.include?.meter) {
        return { ...base, meter: db.meters.find(m => m.id === first.meterId) || null }
      }
      return base
    }),
    findUnique: jest.fn(async (args: any) => {
      const row = db.readings.find(r => r.id === args.where.id)
      if (!row) return null
      const base = args.select ? pick(row as any, args.select) : { ...row }
      if (args.include?.meter) {
        return { ...base, meter: db.meters.find(m => m.id === row.meterId) || null }
      }
      return base
    }),
    count: jest.fn(async (args: any = {}) => {
      return db.readings.filter(r => matchesReadingWhere(r, args.where)).length
    }),
    create: jest.fn(async (args: any) => {
      const data = args.data
      const record: MeterReadingRecord = {
        id: data.id || `reading-${readingSeq++}`,
        meterId: data.meterId,
        userId: data.userId,
        reading: data.reading,
        week: data.week,
        month: data.month,
        year: data.year,
        date: data.date || new Date(),
        createdAt: data.createdAt || new Date(),
        isOfficialEndOfMonth: data.isOfficialEndOfMonth || false,
        usage: data.usage ?? 0,
        estimatedCost: data.estimatedCost ?? 0,
        notes: data.notes ?? null
      }
      db.readings.push(record)
      return { ...record }
    }),
    update: jest.fn(async (args: any) => {
      const row = db.readings.find(r => r.id === args.where.id)
      if (!row) throw new Error('Record not found')
      Object.assign(row, args.data)
      const out = args.select ? pick(row as any, args.select) : { ...row }
      if (args.include?.meter) {
        return { ...out, meter: db.meters.find(m => m.id === row.meterId) || null }
      }
      return out
    }),
    delete: jest.fn(async (args: any) => {
      const idx = db.readings.findIndex(r => r.id === args.where.id)
      if (idx < 0) throw new Error('Record not found')
      const [deleted] = db.readings.splice(idx, 1)
      return { ...deleted }
    })
  },
  userPreference: {
    findUnique: jest.fn(async (args: any) => {
      const pref = db.prefs.find(p => p.userId === args.where.userId) || null
      if (!pref) return null
      return args.select ? pick(pref as any, args.select) : { ...pref }
    }),
    upsert: jest.fn(async (args: any) => {
      let pref = db.prefs.find(p => p.userId === args.where.userId)
      if (!pref) {
        pref = {
          id: `pref-${prefSeq++}`,
          userId: args.create.userId,
          disco: args.create.disco,
          language: args.create.language,
          unitType: args.create.unitType,
          currency: args.create.currency,
          monthlyBudgetPkr: args.create.monthlyBudgetPkr ?? null
        }
        db.prefs.push(pref)
      } else {
        Object.assign(pref, args.update)
      }
      return args.select ? pick(pref as any, args.select) : { ...pref }
    })
  }
}

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data
    })
  }
}))

jest.mock('@/lib/authOptions', () => ({
  authOptions: {}
}))

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: prismaMock
}))

describe('Phase 1 - Core Stats + Reading Chain', () => {
  beforeAll(() => {
    computeStatsBundle = require('../../src/lib/statService').computeStatsBundle
    getDashboardStats = require('../../src/app/api/dashboard/stats/route').GET
    getAnalyticsCosts = require('../../src/app/api/analytics/costs/route').GET
    createReading = require('../../src/app/api/readings/route').POST
    updateReading = require('../../src/app/api/readings/[id]/route').PUT
    getMeters = require('../../src/app/api/meters/route').GET
    createMeter = require('../../src/app/api/meters/route').POST
    updateMeter = require('../../src/app/api/meters/[id]/route').PUT
    deleteMeter = require('../../src/app/api/meters/[id]/route').DELETE
    getForecastUsage = require('../../src/app/api/forecast/usage/route').GET
    getForecastBill = require('../../src/app/api/forecast/bill/route').GET
    getBudgetMonitor = require('../../src/app/api/budget/monitor/route').GET
    getComparisons = require('../../src/app/api/analytics/comparisons/route').GET
  })

  beforeEach(() => {
    jest.clearAllMocks()
    db.meters = []
    db.readings = []
    db.prefs = []
    readingSeq = 1
    prefSeq = 1
    ;(require('next-auth').getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'user-1@volt.test' }
    })

    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-20T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('aggregates MTD across multiple meters and computes real vs_prev_same_period deltas', async () => {
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })
    addMeter({ id: 'm2', userId: 'user-1', label: 'Portion' })

    // Previous-month baseline and same-period points
    addReading({ id: 'r1', meterId: 'm1', userId: 'user-1', reading: 50, week: 5, month: 12, year: 2025, date: dateOf('2025-12-31T08:00:00.000Z') })
    addReading({ id: 'r2', meterId: 'm1', userId: 'user-1', reading: 70, week: 3, month: 1, year: 2026, date: dateOf('2026-01-20T08:00:00.000Z') })
    addReading({ id: 'r3', meterId: 'm1', userId: 'user-1', reading: 100, week: 5, month: 1, year: 2026, date: dateOf('2026-01-31T08:00:00.000Z') })

    addReading({ id: 'r4', meterId: 'm2', userId: 'user-1', reading: 150, week: 5, month: 12, year: 2025, date: dateOf('2025-12-31T08:00:00.000Z') })
    addReading({ id: 'r5', meterId: 'm2', userId: 'user-1', reading: 180, week: 3, month: 1, year: 2026, date: dateOf('2026-01-20T08:00:00.000Z') })
    addReading({ id: 'r6', meterId: 'm2', userId: 'user-1', reading: 200, week: 5, month: 1, year: 2026, date: dateOf('2026-01-31T08:00:00.000Z') })

    // Current month
    addReading({ id: 'r7', meterId: 'm1', userId: 'user-1', reading: 130, week: 3, month: 2, year: 2026, date: dateOf('2026-02-20T08:00:00.000Z') })
    addReading({ id: 'r8', meterId: 'm2', userId: 'user-1', reading: 260, week: 3, month: 2, year: 2026, date: dateOf('2026-02-20T08:00:00.000Z') })

    const stats = await computeStatsBundle('user-1')

    expect(stats.mtd.usage_kwh).toBe(90)
    expect(stats.mtd.vs_prev_same_period.delta_kwh).toBe(40)
    expect(stats.mtd.vs_prev_same_period.pct_kwh).toBe(80)

    const expectedCost = tariffEngine(30).totalCost + tariffEngine(60).totalCost
    expect(Math.abs(stats.mtd.cost_pkr - expectedCost)).toBeLessThanOrEqual(0.01)
  })

  it('keeps forecast cost consistent across dashboard and analytics endpoints', async () => {
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })
    addReading({ id: 'r1', meterId: 'm1', userId: 'user-1', reading: 100, week: 5, month: 1, year: 2026, date: dateOf('2026-01-31T08:00:00.000Z') })
    addReading({ id: 'r2', meterId: 'm1', userId: 'user-1', reading: 140, week: 3, month: 2, year: 2026, date: dateOf('2026-02-20T08:00:00.000Z') })

    const dashboardRes = await getDashboardStats(getRequest('http://localhost:3000/api/dashboard/stats'))
    const dashboard = await dashboardRes.json()

    const costsRes = await getAnalyticsCosts(getRequest('http://localhost:3000/api/analytics/costs'))
    const costs = await costsRes.json()

    expect(dashboardRes.status).toBe(200)
    expect(costsRes.status).toBe(200)
    expect(dashboard.forecast.cost_pkr).toBe(costs.data.forecast.cost_pkr)
    expect(dashboard.forecast.usage_kwh).toBe(costs.data.forecast.usage_kwh)
  })

  it('recalculates downstream chain correctly after reading update (no self-reference)', async () => {
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })
    addReading({ id: 'r1', meterId: 'm1', userId: 'user-1', reading: 100, week: 1, month: 2, year: 2026, date: dateOf('2026-02-01T08:00:00.000Z') })
    addReading({ id: 'r2', meterId: 'm1', userId: 'user-1', reading: 150, week: 2, month: 2, year: 2026, date: dateOf('2026-02-08T08:00:00.000Z') })
    addReading({ id: 'r3', meterId: 'm1', userId: 'user-1', reading: 180, week: 3, month: 2, year: 2026, date: dateOf('2026-02-15T08:00:00.000Z') })

    const req = jsonRequest('http://localhost:3000/api/readings/r2', { reading: 160 })

    const res = await updateReading(req, { params: { id: 'r2' } })
    expect(res.status).toBe(200)

    const updatedSecond = db.readings.find(r => r.id === 'r2')
    const updatedThird = db.readings.find(r => r.id === 'r3')
    expect(updatedSecond?.usage).toBe(60)
    expect(updatedThird?.usage).toBe(20)
  })

  it('updates dashboard stats after create reading (integration: reading -> dashboard)', async () => {
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })
    addReading({ id: 'r1', meterId: 'm1', userId: 'user-1', reading: 100, week: 5, month: 1, year: 2026, date: dateOf('2026-01-31T08:00:00.000Z') })
    addReading({ id: 'r2', meterId: 'm1', userId: 'user-1', reading: 120, week: 2, month: 2, year: 2026, date: dateOf('2026-02-10T08:00:00.000Z') })

    const beforeRes = await getDashboardStats(getRequest('http://localhost:3000/api/dashboard/stats'))
    const before = await beforeRes.json()
    expect(before.mtd.usage_kwh).toBe(20)

    const createReq = jsonRequest('http://localhost:3000/api/readings', {
      meterId: 'm1',
      reading: 140,
      date: '2026-02-20T08:00:00.000Z',
      week: 3,
      month: 2,
      year: 2026
    })

    const createRes = await createReading(createReq)
    const createPayload = await createRes.json()
    expect(createRes.status).toBe(201)
    expect(createPayload.reading.usage).toBe(20)

    const afterRes = await getDashboardStats(getRequest('http://localhost:3000/api/dashboard/stats'))
    const after = await afterRes.json()
    expect(after.mtd.usage_kwh).toBe(40)
  })

  it('keeps MTD usage non-zero when a meter reading resets and then rises', async () => {
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })

    addReading({ id: 'r1', meterId: 'm1', userId: 'user-1', reading: 10265, week: 5, month: 1, year: 2026, date: dateOf('2026-01-31T08:00:00.000Z') })
    addReading({ id: 'r2', meterId: 'm1', userId: 'user-1', reading: 9999, week: 1, month: 2, year: 2026, date: dateOf('2026-02-01T08:00:00.000Z') })
    addReading({ id: 'r3', meterId: 'm1', userId: 'user-1', reading: 10099, week: 2, month: 2, year: 2026, date: dateOf('2026-02-14T08:00:00.000Z') })

    const stats = await computeStatsBundle('user-1')

    expect(stats.mtd.usage_kwh).toBe(100)
    expect(stats.mtd.cost_pkr).toBeGreaterThan(0)
  })

  it('rejects future-dated reading creation requests', async () => {
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })

    const req = jsonRequest('http://localhost:3000/api/readings', {
      meterId: 'm1',
      reading: 120,
      date: '2026-02-25T08:00:00.000Z',
      week: 4,
      month: 2,
      year: 2026
    })

    const res = await createReading(req)
    const payload = await res.json()
    expect(res.status).toBe(400)
    expect(payload.error).toMatch(/future dates/i)
  })

  it('enforces duplicate reading slot protection (meter/week/month/year)', async () => {
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })

    const req1 = jsonRequest('http://localhost:3000/api/readings', {
      meterId: 'm1',
      reading: 100,
      date: '2026-02-01T08:00:00.000Z',
      week: 1,
      month: 2,
      year: 2026
    })
    const res1 = await createReading(req1)
    expect(res1.status).toBe(201)

    const req2 = jsonRequest('http://localhost:3000/api/readings', {
      meterId: 'm1',
      reading: 120,
      date: '2026-02-02T08:00:00.000Z',
      week: 1,
      month: 2,
      year: 2026
    })
    const res2 = await createReading(req2)
    const payload = await res2.json()
    expect(res2.status).toBe(409)
    expect(payload.error).toMatch(/already exists/i)
  })

  it('meters API contract supports CRUD and auth guard', async () => {
    const unauthorizedSession = (require('next-auth').getServerSession as jest.Mock)
    unauthorizedSession.mockResolvedValueOnce(null)
    const unauthorized = await getMeters(getRequest('http://localhost:3000/api/meters'))
    expect(unauthorized.status).toBe(401)

    const createRes = await createMeter(
      jsonRequest('http://localhost:3000/api/meters', {
        label: 'Main House'
      })
    )
    const created = await createRes.json()
    expect(createRes.status).toBe(201)
    expect(created.meter.label).toBe('Main House')
    expect(created.meter.type).toBeNull()

    const listRes = await getMeters(getRequest('http://localhost:3000/api/meters'))
    const list = await listRes.json()
    expect(listRes.status).toBe(200)
    expect(Array.isArray(list.meters)).toBe(true)
    expect(list.meters[0].status).toBe('inactive')
    expect(list.meters[0]).toHaveProperty('lastReading')
    expect(list.meters[0]).toHaveProperty('lastReadingDate')

    const updateRes = await updateMeter(
      jsonRequest(`http://localhost:3000/api/meters/${created.meter.id}`, { label: 'Updated Label' }),
      { params: { id: created.meter.id } }
    )
    const updated = await updateRes.json()
    expect(updateRes.status).toBe(200)
    expect(updated.meter.label).toBe('Updated Label')

    const deleteRes = await deleteMeter(
      getRequest(`http://localhost:3000/api/meters/${created.meter.id}`),
      { params: { id: created.meter.id } }
    )
    expect(deleteRes.status).toBe(200)
  })

  it('forecast usage and bill APIs use unified stats timeframe contract', async () => {
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })
    addReading({ id: 'r1', meterId: 'm1', userId: 'user-1', reading: 80, week: 5, month: 1, year: 2026, date: dateOf('2026-01-31T08:00:00.000Z') })
    addReading({ id: 'r2', meterId: 'm1', userId: 'user-1', reading: 120, week: 2, month: 2, year: 2026, date: dateOf('2026-02-12T08:00:00.000Z') })

    const usageRes = await getForecastUsage(getRequest('http://localhost:3000/api/forecast/usage'))
    const usage = await usageRes.json()
    const billRes = await getForecastBill(getRequest('http://localhost:3000/api/forecast/bill'))
    const bill = await billRes.json()

    expect(usageRes.status).toBe(200)
    expect(billRes.status).toBe(200)
    expect(usage.data).toHaveProperty('timeframeLabels')
    expect(bill.data).toHaveProperty('timeframeLabels')
    expect(usage.data.forecast.expected).toBe(bill.data.forecast.usage.expected)
    expect(bill.data.forecast.bill.expected).toBeGreaterThanOrEqual(0)
  })

  it('excludes future-dated readings from MTD and keeps forecast ahead of MTD before month end', async () => {
    jest.setSystemTime(new Date('2026-02-10T12:00:00.000Z'))
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })
    addReading({ id: 'r1', meterId: 'm1', userId: 'user-1', reading: 100, week: 5, month: 1, year: 2026, date: dateOf('2026-01-31T08:00:00.000Z') })
    addReading({ id: 'r2', meterId: 'm1', userId: 'user-1', reading: 120, week: 2, month: 2, year: 2026, date: dateOf('2026-02-08T08:00:00.000Z') })
    addReading({ id: 'r3', meterId: 'm1', userId: 'user-1', reading: 170, week: 4, month: 2, year: 2026, date: dateOf('2026-02-25T08:00:00.000Z') })

    const stats = await computeStatsBundle('user-1')
    expect(stats.mtd.usage_kwh).toBe(20)
    expect(stats.forecast.method).toBe('proportional')
    expect(stats.forecast.usage_kwh).toBeGreaterThan(stats.mtd.usage_kwh)
    expect(stats.forecast.cost_pkr).toBeGreaterThan(stats.mtd.cost_pkr)
  })

  it('returns slab distribution consistent with forecast usage in bill forecast API', async () => {
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })
    addReading({ id: 'r1', meterId: 'm1', userId: 'user-1', reading: 80, week: 5, month: 1, year: 2026, date: dateOf('2026-01-31T08:00:00.000Z') })
    addReading({ id: 'r2', meterId: 'm1', userId: 'user-1', reading: 120, week: 2, month: 2, year: 2026, date: dateOf('2026-02-12T08:00:00.000Z') })

    const billRes = await getForecastBill(getRequest('http://localhost:3000/api/forecast/bill'))
    const bill = await billRes.json()

    expect(billRes.status).toBe(200)
    expect(Array.isArray(bill.data.slabDistribution)).toBe(true)

    const sumSlabUnits = bill.data.slabDistribution.reduce(
      (acc: number, slab: { units: number }) => acc + slab.units,
      0
    )
    expect(Math.abs(sumSlabUnits - bill.data.forecast.usage.expected)).toBeLessThanOrEqual(0.01)
  })

  it('keeps forecast predictive at month end when latest reading is stale', async () => {
    jest.setSystemTime(new Date('2026-02-28T12:00:00.000Z'))
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })
    addReading({
      id: 'r1',
      meterId: 'm1',
      userId: 'user-1',
      reading: 100,
      week: 5,
      month: 1,
      year: 2026,
      date: dateOf('2026-01-31T08:00:00.000Z')
    })
    addReading({
      id: 'r2',
      meterId: 'm1',
      userId: 'user-1',
      reading: 140,
      week: 2,
      month: 2,
      year: 2026,
      date: dateOf('2026-02-14T08:00:00.000Z')
    })

    const stats = await computeStatsBundle('user-1')
    expect(stats.mtd.usage_kwh).toBe(40)
    expect(stats.forecast.method).toBe('proportional')
    expect(stats.forecast.usage_kwh).toBeGreaterThan(stats.mtd.usage_kwh)
    expect(stats.forecast.cost_pkr).toBeGreaterThan(stats.mtd.cost_pkr)
  })

  it('budget monitor derives values from stats/budget source', async () => {
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })
    db.prefs.push({
      id: 'pref-1',
      userId: 'user-1',
      disco: 'LESCO',
      language: 'en',
      unitType: 'kWh',
      currency: 'PKR',
      monthlyBudgetPkr: 25000
    })
    addReading({ id: 'r1', meterId: 'm1', userId: 'user-1', reading: 50, week: 5, month: 1, year: 2026, date: dateOf('2026-01-31T08:00:00.000Z') })
    addReading({ id: 'r2', meterId: 'm1', userId: 'user-1', reading: 110, week: 3, month: 2, year: 2026, date: dateOf('2026-02-20T08:00:00.000Z') })

    const res = await getBudgetMonitor(getRequest('http://localhost:3000/api/budget/monitor'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.data.budget.target).toBe(25000)
    expect(data.data).toHaveProperty('timeframeLabels')
    expect(data.data.period.labels.mtd).toBe('Month to Date')
  })

  it('comparisons endpoint returns MoM based on same-day cutoff shape', async () => {
    addMeter({ id: 'm1', userId: 'user-1', label: 'Main' })
    addReading({ id: 'r1', meterId: 'm1', userId: 'user-1', reading: 90, week: 5, month: 1, year: 2026, date: dateOf('2026-01-31T08:00:00.000Z') })
    addReading({ id: 'r2', meterId: 'm1', userId: 'user-1', reading: 130, week: 3, month: 2, year: 2026, date: dateOf('2026-02-20T08:00:00.000Z') })

    const res = await getComparisons(getRequest('http://localhost:3000/api/analytics/comparisons'))
    const payload = await res.json()
    expect(res.status).toBe(200)
    expect(payload.data.comparisons.comparisonType).toBe('MoM')
    expect(payload.data.comparisons.labels.previous).toMatch(/same day cutoff/i)
    expect(payload.data).toHaveProperty('timeframeLabels')
  })
})
