import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { DEFAULT_OPERATOR, isSupportedDisco, normalizeDisco } from '@/lib/discoTariffs'

const DEFAULT_LANGUAGE = 'en'
const DEFAULT_UNIT_TYPE = 'kWh'
const DEFAULT_CURRENCY = 'PKR'

function buildDefaults() {
  return {
    disco: DEFAULT_OPERATOR,
    language: DEFAULT_LANGUAGE,
    unitType: DEFAULT_UNIT_TYPE,
    currency: DEFAULT_CURRENCY,
    monthlyBudgetPkr: null as number | null
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pref = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
      select: {
        disco: true,
        language: true,
        unitType: true,
        currency: true,
        monthlyBudgetPkr: true
      }
    })

    const defaults = buildDefaults()
    return NextResponse.json({
      preferences: {
        disco: pref?.disco ? normalizeDisco(pref.disco) : defaults.disco,
        language: pref?.language || defaults.language,
        unitType: pref?.unitType || defaults.unitType,
        currency: pref?.currency || defaults.currency,
        monthlyBudgetPkr:
          typeof pref?.monthlyBudgetPkr === 'number' ? pref.monthlyBudgetPkr : defaults.monthlyBudgetPkr
      }
    })
  } catch (error) {
    console.error('Error loading preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const disco = body?.disco
    const language = body?.language
    const unitType = body?.unitType
    const currency = body?.currency
    const monthlyBudgetRaw = body?.monthlyBudgetPkr

    if (disco !== undefined && (!disco || !isSupportedDisco(disco))) {
      return NextResponse.json({ error: 'Invalid disco operator' }, { status: 400 })
    }
    if (language !== undefined && !['en', 'ur'].includes(String(language).toLowerCase())) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
    }
    if (unitType !== undefined && !['kWh'].includes(String(unitType))) {
      return NextResponse.json({ error: 'Invalid unit type' }, { status: 400 })
    }
    if (currency !== undefined && !['PKR', 'USD'].includes(String(currency).toUpperCase())) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }

    let monthlyBudgetPkr: number | null | undefined
    if (monthlyBudgetRaw !== undefined) {
      if (monthlyBudgetRaw === null || monthlyBudgetRaw === '') {
        monthlyBudgetPkr = null
      } else {
        const parsed = Number(monthlyBudgetRaw)
        if (!Number.isFinite(parsed) || parsed < 1000 || parsed > 100000) {
          return NextResponse.json(
            { error: 'monthlyBudgetPkr must be null or a number between 1000 and 100000' },
            { status: 400 }
          )
        }
        monthlyBudgetPkr = Math.round(parsed * 100) / 100
      }
    }

    const defaults = buildDefaults()
    const updated = await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      update: {
        ...(disco !== undefined ? { disco: normalizeDisco(disco) } : {}),
        ...(language !== undefined ? { language: String(language).toLowerCase() } : {}),
        ...(unitType !== undefined ? { unitType: String(unitType) } : {}),
        ...(currency !== undefined ? { currency: String(currency).toUpperCase() } : {}),
        ...(monthlyBudgetPkr !== undefined ? { monthlyBudgetPkr } : {})
      },
      create: {
        userId: session.user.id,
        disco: disco ? normalizeDisco(disco) : defaults.disco,
        language: language ? String(language).toLowerCase() : defaults.language,
        unitType: unitType ? String(unitType) : defaults.unitType,
        currency: currency ? String(currency).toUpperCase() : defaults.currency,
        monthlyBudgetPkr: monthlyBudgetPkr ?? defaults.monthlyBudgetPkr
      },
      select: {
        disco: true,
        language: true,
        unitType: true,
        currency: true,
        monthlyBudgetPkr: true
      }
    })

    return NextResponse.json({
      preferences: {
        disco: normalizeDisco(updated.disco),
        language: updated.language,
        unitType: updated.unitType,
        currency: updated.currency,
        monthlyBudgetPkr: updated.monthlyBudgetPkr
      }
    })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
