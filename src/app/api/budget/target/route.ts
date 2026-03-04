import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getMonthlyBudgetPkr, setMonthlyBudgetPkr } from '@/lib/budgetStore'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const monthlyBudgetPkr = await getMonthlyBudgetPkr(session.user.id)
    return NextResponse.json({ monthly_budget_pkr: monthlyBudgetPkr })
  } catch (error) {
    console.error('Error fetching budget target:', error)
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
    const value = Number(body?.monthly_budget_pkr)

    if (!Number.isFinite(value) || value < 1000 || value > 100000) {
      return NextResponse.json(
        { error: 'monthly_budget_pkr must be a number between 1000 and 100000' },
        { status: 400 }
      )
    }

    const updated = await setMonthlyBudgetPkr(session.user.id, value)
    return NextResponse.json({ monthly_budget_pkr: updated })
  } catch (error) {
    console.error('Error updating budget target:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
