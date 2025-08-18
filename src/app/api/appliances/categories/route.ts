import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getApplianceCategories, getApplianceTypes } from '@/lib/applianceCalculations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = getApplianceCategories()
    const types = getApplianceTypes()

    // Predefined wattage ranges for common appliances
    const wattageGuides = {
      'Air Conditioner': { min: 1000, max: 2500, typical: 1500 },
      'Refrigerator': { min: 100, max: 300, typical: 150 },
      'Lighting': { min: 5, max: 100, typical: 15 },
      'Fan': { min: 50, max: 150, typical: 75 },
      'Water Heater': { min: 1500, max: 3000, typical: 2000 },
      'Washing Machine': { min: 300, max: 800, typical: 500 },
      'Microwave': { min: 600, max: 1200, typical: 800 },
      'Television': { min: 50, max: 200, typical: 100 },
      'Computer': { min: 200, max: 600, typical: 300 },
      'Iron': { min: 800, max: 1500, typical: 1000 }
    }

    // Usage hour recommendations
    const usageGuides = {
      'Air Conditioner': { min: 4, max: 16, typical: 8 },
      'Refrigerator': { min: 24, max: 24, typical: 24 },
      'Lighting': { min: 2, max: 12, typical: 6 },
      'Fan': { min: 6, max: 20, typical: 12 },
      'Water Heater': { min: 1, max: 6, typical: 3 },
      'Washing Machine': { min: 0.5, max: 3, typical: 1 },
      'Microwave': { min: 0.2, max: 2, typical: 0.5 },
      'Television': { min: 2, max: 12, typical: 5 },
      'Computer': { min: 4, max: 16, typical: 8 },
      'Iron': { min: 0.5, max: 2, typical: 1 }
    }

    return NextResponse.json({
      success: true,
      data: {
        categories,
        types,
        wattageGuides,
        usageGuides,
        tips: {
          inverter: 'Inverter appliances are typically 30% more energy efficient',
          wattage: 'Check the appliance label or manual for accurate wattage',
          usage: 'Estimate realistic daily usage hours for accurate calculations'
        }
      }
    })

  } catch (error) {
    console.error('Error fetching appliance categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}