import prisma from './prisma'
import { calculateUsage, tariffEngine } from './tariffEngine'
import { getTariffConfigForUser } from './userTariff'

/**
 * Recalculate usage and estimated cost for all readings of a meter
 * in strict chronological order so inserts/updates/deletes stay consistent.
 */
export async function recalculateMeterReadingChain(meterId: string): Promise<void> {
  const readings = await prisma.meterReading.findMany({
    where: { meterId },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      reading: true,
      userId: true
    }
  })

  if (readings.length === 0) return

  const tariffConfig = await getTariffConfigForUser(readings[0].userId)
  let previousReadingValue: number | null = null

  for (const current of readings) {
    const usage =
      previousReadingValue === null
        ? 0
        : calculateUsage(current.reading, previousReadingValue)

    const estimatedCost = usage > 0 ? tariffEngine(usage, tariffConfig).totalCost : 0

    await prisma.meterReading.update({
      where: { id: current.id },
      data: {
        usage,
        estimatedCost
      }
    })

    previousReadingValue = current.reading
  }
}
