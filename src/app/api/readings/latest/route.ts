import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user's meters
    const meters = await prisma.meter.findMany({
      where: { userId: session.user.id },
    })

    // Get latest reading for each meter
    const latestReadings = await Promise.all(
      meters.map(async (meter) => {
        const latest = await prisma.meterReading.findFirst({
          where: { meterId: meter.id },
          orderBy: { date: 'desc' },
          include: { meter: true },
        })

        return {
          meterId: meter.id,
          meterName: meter.label,
          meterType: meter.type,
          reading: latest?.reading || null,
          date: latest?.date || null,
          week: latest?.week || null,
          month: latest?.month || null,
          year: latest?.year || null,
          usage: latest?.usage || 0,
          estimatedCost: latest?.estimatedCost || 0,
          isOfficialEndOfMonth: latest?.isOfficialEndOfMonth || false,
          lastReadingId: latest?.id || null
        }
      })
    )

    return NextResponse.json({ readings: latestReadings })
  } catch (error) {
    console.error('Error fetching latest readings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}