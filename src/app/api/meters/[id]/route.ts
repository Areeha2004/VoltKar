import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

type Params = {
  id: string
}

// -------------------
// PUT /api/meters/[id]
// -------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: meterId } = await params
    const { label, type } = await req.json()

    const nextLabel = label ? String(label).trim() : undefined
    const nextType = type ? String(type).trim() : undefined

    const existingMeter = await prisma.meter.findFirst({
      where: { id: meterId, userId: session.user.id },
    })
    if (!existingMeter)
      return NextResponse.json({ error: 'Meter not found' }, { status: 404 })

    if (nextLabel !== undefined && !nextLabel)
      return NextResponse.json(
        { error: 'Label cannot be empty' },
        { status: 400 }
      )

    const meter = await prisma.meter.update({
      where: { id: meterId },
      data: {
        label: nextLabel ?? existingMeter.label,
        type: nextType ?? existingMeter.type,
      },
    })

    return NextResponse.json({ meter })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ----------------------
// DELETE /api/meters/[id]
// ----------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: meterId } = await params

    const existingMeter = await prisma.meter.findFirst({
      where: { id: meterId, userId: session.user.id },
    })
    if (!existingMeter)
      return NextResponse.json({ error: 'Meter not found' }, { status: 404 })

    await prisma.meter.delete({ where: { id: meterId } })

    return NextResponse.json({ message: 'Meter deleted successfully' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
