// app/api/readings/latest/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { calculateElectricityBill } from '@/lib/slabCalculations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const meters = await prisma.meter.findMany({
      where: { userId: session.user.id },
    })

    const latestReadings = await Promise.all(
      meters.map(async (meter) => {
        const latest = await prisma.meterReading.findFirst({
          where: { meterId: meter.id },
          orderBy: { createdAt: 'desc' },
          include: { meter: true },
        })

        if (!latest) {
          return {
            meterId: meter.id,
            meterName: meter.label,
            reading: null,
            date: null,
            usage: 0,
            estimatedCost: 0,
          }
        }

        const prev = await prisma.meterReading.findFirst({
          where: { meterId: meter.id, createdAt: { lt: latest.createdAt } },
          orderBy: { createdAt: 'desc' },
        })

        const baseValue = prev?.reading ?? meter.lastReading ?? 0
        const usage = Math.max(0, latest.reading - baseValue)

        let estimatedCost = latest.estimatedCost
        let costBreakdown = null

        // recalc if missing or out-of-sync
        if ((!estimatedCost || usage !== latest.usage) && usage > 0) {
          costBreakdown = calculateElectricityBill(usage)
          estimatedCost = Math.round(costBreakdown.totalCost)

          // persist fix
          await prisma.meterReading.update({
            where: { id: latest.id },
            data: { usage, estimatedCost },
          })
        }

        return {
          ...latest,
          usage,
          estimatedCost,
          slabWarning: costBreakdown?.slabWarning || false,
          costBreakdown,
        }
      })
    )

    return NextResponse.json({ readings: latestReadings })
  } catch (error) {
    console.error('Error fetching latest readings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
