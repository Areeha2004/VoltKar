import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { recalculateMeterReadingChain } from '@/lib/readingChain'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reading, week, month, year, date, isOfficialEndOfMonth, notes } = await request.json()
    const readingId = params.id

    // Verify and load existing reading
    const existing = await prisma.meterReading.findFirst({
      where: { id: readingId, userId: session.user.id },
      include: { meter: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    const nextReadingValue =
      reading !== undefined ? parseFloat(reading) : existing.reading
    if (!Number.isFinite(nextReadingValue) || nextReadingValue < 0) {
      return NextResponse.json({ error: 'Reading must be a valid non-negative number' }, { status: 400 })
    }

    const nextWeek = week !== undefined ? week : existing.week
    const nextMonth = month !== undefined ? month : existing.month
    const nextYear = year !== undefined ? year : existing.year
    const nextDate = date !== undefined ? new Date(date) : existing.date

    if (nextWeek < 1 || nextWeek > 5) {
      return NextResponse.json({ error: 'Week must be between 1 and 5' }, { status: 400 })
    }
    if (Number.isNaN(nextDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    // Prevent duplicate slot after update
    const duplicate = await prisma.meterReading.findFirst({
      where: {
        meterId: existing.meterId,
        userId: session.user.id,
        week: nextWeek,
        month: nextMonth,
        year: nextYear,
        NOT: { id: readingId }
      }
    })
    if (duplicate) {
      return NextResponse.json(
        { error: 'Another reading already exists for this week/month/year' },
        { status: 409 }
      )
    }

    // Update the reading
    await prisma.meterReading.update({
      where: { id: readingId },
      data: {
        reading: nextReadingValue,
        week: nextWeek,
        month: nextMonth,
        year: nextYear,
        date: nextDate,
        isOfficialEndOfMonth: isOfficialEndOfMonth !== undefined ? isOfficialEndOfMonth : existing.isOfficialEndOfMonth,
        notes: notes !== undefined ? (notes?.trim() || null) : existing.notes,
      },
    })

    await recalculateMeterReadingChain(existing.meterId)

    const finalReading = await prisma.meterReading.findUnique({
      where: { id: readingId },
      include: { meter: true }
    })

    return NextResponse.json({ reading: finalReading })
  } catch (error) {
    console.error('Error updating reading:', error)
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

    const readingId = params.id

    const existing = await prisma.meterReading.findFirst({
      where: { id: readingId, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    // Delete the reading
    await prisma.meterReading.delete({ where: { id: readingId } })

    await recalculateMeterReadingChain(existing.meterId)

    return NextResponse.json({ message: 'Reading deleted successfully' })
  } catch (error) {
    console.error('Error deleting reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

