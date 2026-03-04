// app/api/meters/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { label, type } = await request.json()
    const meterId = params.id
    const nextLabel = label !== undefined ? String(label).trim() : undefined
    const nextType = type !== undefined ? String(type).trim() : undefined

    const existingMeter = await prisma.meter.findFirst({
      where: { id: meterId, userId: session.user.id }
    })

    if (!existingMeter) {
      return NextResponse.json({ error: 'Meter not found' }, { status: 404 })
    }

    if (nextLabel !== undefined && !nextLabel) {
      return NextResponse.json({ error: 'Label cannot be empty' }, { status: 400 })
    }

    const meter = await prisma.meter.update({
      where: { id: meterId },
      data: {
        label: nextLabel ?? existingMeter.label,
        type: nextType ?? existingMeter.type
      }
    })

    return NextResponse.json({ meter })
  } catch (error) {
    console.error('Error updating meter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const meterId = params.id

    const existingMeter = await prisma.meter.findFirst({
      where: { id: meterId, userId: session.user.id }
    })

    if (!existingMeter) {
      return NextResponse.json({ error: 'Meter not found' }, { status: 404 })
    }

    await prisma.meter.delete({
      where: { id: meterId }
    })

    return NextResponse.json({ message: 'Meter deleted successfully' })
  } catch (error) {
    console.error('Error deleting meter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

