import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface Appliance {
  id: string
  name: string
  category: string
  type: string
  wattage: number
  hoursPerDay: number
  daysPerMonth: number
  estimatedKwh: number
  contribution: number
  estimatedCost: number
  efficiency: string
  costPerKwh: number
  createdAt: string
  optimizationSuggestions?: string[]
}

export interface ApplianceSummary {
  totalAppliances: number
  totalKwh: number
  totalCost: number
  averageEfficiency: number
  categories: string[]
}

export interface CreateApplianceData {
  name: string
  category: string
  type: string
  wattage: number
  hoursPerDay: number
  daysPerMonth: number
}

export interface UpdateApplianceData extends CreateApplianceData {
  id: string
}

export const useAppliances = (includeOptimizations = false) => {
  const [appliances, setAppliances] = useState<Appliance[]>([])
  const [summary, setSummary] = useState<ApplianceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  const fetchAppliances = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (includeOptimizations) {
        params.append('optimizations', 'true')
      }

      const response = await fetch(`/api/appliances?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch appliances')
      }

      const data = await response.json()
      setAppliances(data.data.appliances || [])
      setSummary(data.data.summary || null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appliances')
    } finally {
      setLoading(false)
    }
  }

  const createAppliance = async (applianceData: CreateApplianceData): Promise<Appliance> => {
    try {
      const response = await fetch('/api/appliances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applianceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create appliance')
      }

      const data = await response.json()
      const newAppliance = data.data.appliance

      // Update local state
      setAppliances(prev => [newAppliance, ...prev])
      
      // Refresh to get updated contributions
      await fetchAppliances()
      
      return newAppliance
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create appliance')
    }
  }

  const updateAppliance = async (id: string, applianceData: Omit<CreateApplianceData, 'id'>): Promise<Appliance> => {
    try {
      const response = await fetch(`/api/appliances/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applianceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update appliance')
      }

      const data = await response.json()
      const updatedAppliance = data.data.appliance

      // Update local state
      setAppliances(prev => prev.map(app => 
        app.id === id ? updatedAppliance : app
      ))
      
      // Refresh to get updated contributions
      await fetchAppliances()
      
      return updatedAppliance
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update appliance')
    }
  }

  const deleteAppliance = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/appliances/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete appliance')
      }

      // Update local state
      setAppliances(prev => prev.filter(app => app.id !== id))
      
      // Refresh to get updated contributions
      await fetchAppliances()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete appliance')
    }
  }

  const getAppliancesByCategory = (category: string): Appliance[] => {
    return appliances.filter(app => app.category === category)
  }

  const getHighConsumptionAppliances = (threshold = 100): Appliance[] => {
    return appliances.filter(app => app.estimatedKwh >= threshold)
      .sort((a, b) => b.estimatedKwh - a.estimatedKwh)
  }

  const getInefficiientAppliances = (): Appliance[] => {
    return appliances.filter(app => app.efficiency === 'poor' || app.efficiency === 'fair')
      .sort((a, b) => b.estimatedCost - a.estimatedCost)
  }

  useEffect(() => {
    fetchAppliances()
  }, [session?.user?.id, includeOptimizations])

  return {
    appliances,
    summary,
    loading,
    error,
    createAppliance,
    updateAppliance,
    deleteAppliance,
    refetch: fetchAppliances,
    getAppliancesByCategory,
    getHighConsumptionAppliances,
    getInefficiientAppliances
  }
}