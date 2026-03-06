import prisma from './prisma'
import { DEFAULT_OPERATOR } from './discoTariffs'

const DEFAULT_PREFERENCE_CREATE = {
  disco: DEFAULT_OPERATOR,
  language: 'en',
  unitType: 'kWh',
  currency: 'PKR'
} as const

export async function getMonthlyBudgetPkr(userId: string): Promise<number | null> {
  const pref = await prisma.userPreference.findUnique({
    where: { userId },
    select: { monthlyBudgetPkr: true }
  })

  if (!pref?.monthlyBudgetPkr || pref.monthlyBudgetPkr <= 0) {
    return null
  }

  return pref.monthlyBudgetPkr
}

export async function setMonthlyBudgetPkr(userId: string, budget: number): Promise<number> {
  const normalized = Math.round(budget * 100) / 100

  const pref = await prisma.userPreference.upsert({
    where: { userId },
    update: { monthlyBudgetPkr: normalized },
    create: {
      userId,
      ...DEFAULT_PREFERENCE_CREATE,
      monthlyBudgetPkr: normalized
    },
    select: { monthlyBudgetPkr: true }
  })

  return pref.monthlyBudgetPkr || normalized
}
