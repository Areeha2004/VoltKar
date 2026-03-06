import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { computeStatsBundle } from '@/lib/statService'
import { tariffEngine } from '@/lib/tariffEngine'
import { getTariffConfigForUser } from '@/lib/userTariff'

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meterId = searchParams.get('meterId')
    const tariffConfig = await getTariffConfigForUser(session.user.id)

    const stats = await computeStatsBundle(session.user.id, meterId || undefined)

    const expectedUsage = stats.forecast.usage_kwh
    const expectedCost = stats.forecast.cost_pkr
    const mtdTariff = tariffEngine(stats.mtd.usage_kwh, tariffConfig)
    const forecastTariff = tariffEngine(expectedUsage, tariffConfig)

    const lowUsage =
      stats.forecast.method === 'actual' ? expectedUsage : Math.max(0, expectedUsage * 0.9)
    const highUsage =
      stats.forecast.method === 'actual' ? expectedUsage : expectedUsage * 1.1

    const lowCost =
      stats.forecast.method === 'actual'
        ? expectedCost
        : round2(tariffEngine(lowUsage, tariffConfig).totalCost)
    const highCost =
      stats.forecast.method === 'actual'
        ? expectedCost
        : round2(tariffEngine(highUsage, tariffConfig).totalCost)

    const savingsReduce10Cost = round2(
      tariffEngine(Math.max(0, expectedUsage * 0.9), tariffConfig).totalCost
    )
    const savingsReduce20Cost = round2(
      tariffEngine(Math.max(0, expectedUsage * 0.8), tariffConfig).totalCost
    )

    const confidence =
      stats.forecast.method === 'actual'
        ? 100
        : Math.max(55, Math.min(95, Math.round((stats.window.daysElapsed / stats.window.daysInMonth) * 100)))

    return NextResponse.json({
      success: true,
      data: {
        timeframeLabels: stats.timeframeLabels,
        forecast: {
          usage: {
            low: round2(lowUsage),
            expected: expectedUsage,
            high: round2(highUsage)
          },
          bill: {
            low: round2(lowCost),
            expected: expectedCost,
            high: round2(highCost)
          },
          method: stats.forecast.method
        },
        slabDistribution: forecastTariff.slabBreakdown.map(slab => ({
          range: slab.range,
          units: round2(slab.units),
          rate: slab.rate,
          energyCost: round2(slab.cost),
          unitsSharePct:
            expectedUsage > 0 ? round2((slab.units / expectedUsage) * 100) : 0,
          energyCostSharePct:
            forecastTariff.energyCost > 0 ? round2((slab.cost / forecastTariff.energyCost) * 100) : 0
        })),
        tariff: {
          mtd: {
            units: mtdTariff.units,
            energyCost: mtdTariff.energyCost,
            fuelAdj: mtdTariff.fuelAdj,
            fixedCharges: mtdTariff.fixedCharges,
            tax: mtdTariff.tax,
            tvFee: mtdTariff.tvFee,
            totalCost: mtdTariff.totalCost
          },
          forecast: {
            units: forecastTariff.units,
            energyCost: forecastTariff.energyCost,
            fuelAdj: forecastTariff.fuelAdj,
            fixedCharges: forecastTariff.fixedCharges,
            tax: forecastTariff.tax,
            tvFee: forecastTariff.tvFee,
            totalCost: forecastTariff.totalCost
          }
        },
        current: {
          mtdUsage: stats.mtd.usage_kwh,
          mtdCost: stats.mtd.cost_pkr,
          daysElapsed: stats.window.daysElapsed,
          projectedDailyRate:
            stats.window.daysElapsed > 0
              ? round2(stats.mtd.usage_kwh / stats.window.daysElapsed)
              : 0
        },
        comparison: {
          lastMonthBill: stats.prevMonthFull.cost_pkr,
          vsLastMonth: stats.forecast.vs_prev_full.pct_cost,
          difference: stats.forecast.vs_prev_full.delta_cost
        },
        savings: {
          scenarios: {
            reduce10Percent: {
              usage: round2(expectedUsage * 0.9),
              cost: savingsReduce10Cost
            },
            reduce20Percent: {
              usage: round2(expectedUsage * 0.8),
              cost: savingsReduce20Cost
            }
          },
          potential: {
            reduce10Percent: round2(expectedCost - savingsReduce10Cost),
            reduce20Percent: round2(expectedCost - savingsReduce20Cost)
          }
        },
        confidence: {
          level: confidence,
          factors: {
            method: stats.forecast.method,
            daysElapsed: stats.window.daysElapsed,
            daysInMonth: stats.window.daysInMonth
          }
        },
        period: {
          month: stats.window.now.getMonth() + 1,
          year: stats.window.now.getFullYear(),
          daysInMonth: stats.window.daysInMonth,
          meterId: meterId || 'all',
          labels: {
            mtd: stats.timeframeLabels.mtd,
            previousMonth: stats.timeframeLabels.prevMonthFull,
            forecast: stats.timeframeLabels.forecast
          }
        }
      }
    })
  } catch (error) {
    console.error('Error generating bill forecast:', error)
    return NextResponse.json(
      { error: 'Failed to generate bill forecast' },
      { status: 500 }
    )
  }
}
