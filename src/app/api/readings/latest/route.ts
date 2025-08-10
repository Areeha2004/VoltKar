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

    // Get all meters for the user
    const meters = await prisma.meter.findMany({
      where: {
        userId: session.user.id
      }
    })

    // Get latest reading for each meter
    const latestReadings = await Promise.all(
      meters.map(async (meter) => {
        const latestReading = await prisma.meterReading.findFirst({
          where: {
            meterId: meter.id
          },
          orderBy: { createdAt: 'desc' },
          include: {
            meter: true
          }
        })

        if (!latestReading) {
          return {
            meterId: meter.id,
            meterName: meter.label,
            reading: null,
            date: null,
            usage: 0,
            cost: 0
          }
        }

        // Calculate usage from previous reading
        const previousReading = await prisma.meterReading.findFirst({
          where: {
            meterId: meter.id,
            createdAt: { lt: latestReading.createdAt }
          },
          orderBy: { createdAt: 'desc' }
        })

        const usage = previousReading 
          ? Math.max(0, latestReading.reading - previousReading.reading)
          : 0

        const estimatedCost = usage * 19.3 // Average rate

        return {
          ...latestReading,
          usage,
          estimatedCost: Math.round(estimatedCost)
        }
      })
    )

    return NextResponse.json({ readings: latestReadings })
  } catch (error) {
    console.error('Error fetching latest readings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}