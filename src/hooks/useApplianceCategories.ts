import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface WattageGuide {
  min: number
  max: number
  typical: number
}

export interface UsageGuide {
  min: number
  max: number
  typical: number
}

export interface ApplianceMetadata {
  categories: string[]
  types: string[]
  wattageGuides: Record<string, WattageGuide>
  usageGuides: Record<string, UsageGuide>
  tips: {
    inverter: string
    wattage: string
    usage: string
  }
}

export const useApplianceCategories = () => {
  const [metadata, setMetadata] = useState<ApplianceMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  const fetchMetadata = async () => {
    if (!session?.user?.email) return

    try {
      setLoading(true)
      const response = await fetch('/api/appliances/categories')
      
      if (!response.ok) {
        throw new Error('Failed to fetch appliance metadata')
      }

      const data = await response.json()
      setMetadata(data.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metadata')
    } finally {
      setLoading(false)
    }
  }

  const getWattageGuide = (category: string): WattageGuide | null => {
    return metadata?.wattageGuides[category] || null
  }

  const getUsageGuide = (category: string): UsageGuide | null => {
    return metadata?.usageGuides[category] || null
  }

  const getTypicalValues = (category: string) => {
    const wattageGuide = getWattageGuide(category)
    const usageGuide = getUsageGuide(category)
    
    return {
      wattage: wattageGuide?.typical || 0,
      hoursPerDay: usageGuide?.typical || 0,
      daysPerMonth: 30
    }
  }

  useEffect(() => {
    fetchMetadata()
  }, [session?.user?.email])

  return {
    metadata,
    loading,
    error,
    getWattageGuide,
    getUsageGuide,
    getTypicalValues,
    refetch: fetchMetadata
  }
}