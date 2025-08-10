import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const meters = await prisma.meter.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        readings: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    // Add calculated fields
    const metersWithStats = meters.map(meter => ({
      ...meter,
      lastReading: meter.readings[0]?.reading || 0,
      lastReadingDate: meter.readings[0]?.createdAt || null,
      status: meter.readings.length > 0 ? 'active' : 'inactive'
    }))

    return NextResponse.json({ meters: metersWithStats })
  } catch (error) {
    console.error('Error fetching meters:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { label, type } = await request.json()

    if (!label || !type) {
      return NextResponse.json({ error: 'Label and type are required' }, { status: 400 })
    }

    const meter = await prisma.meter.create({
      data: {
        userId: session.user.id,
        label,
        type
      }
    })

    return NextResponse.json({ meter }, { status: 201 })
  } catch (error) {
    console.error('Error creating meter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}