import prisma from './prisma'
import {
  type DistributionOperator,
  getTariffConfigForDisco,
  normalizeDisco
} from './discoTariffs'
import type { TariffConfig } from './tariffEngine'

const DEFAULT_PREFERENCE_CREATE = {
  language: 'en',
  unitType: 'kWh',
  currency: 'PKR'
} as const

export async function getUserDisco(userId: string): Promise<DistributionOperator> {
  const preference = await prisma.userPreference.findUnique({
    where: { userId },
    select: { disco: true }
  })

  return normalizeDisco(preference?.disco)
}

export async function getTariffConfigForUser(userId: string): Promise<TariffConfig> {
  const disco = await getUserDisco(userId)
  return getTariffConfigForDisco(disco)
}

export async function setUserDisco(
  userId: string,
  disco: string
): Promise<DistributionOperator> {
  const normalized = normalizeDisco(disco)

  await prisma.userPreference.upsert({
    where: { userId },
    update: { disco: normalized },
    create: {
      userId,
      disco: normalized,
      ...DEFAULT_PREFERENCE_CREATE
    }
  })

  return normalized
}
