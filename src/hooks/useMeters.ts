import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Meter {
  id: string
  label: string
  type: string
  createdAt: string
  lastReading?: number
  lastReadingDate?: string
  status: 'active' | 'inactive'
}

export const useMeters = () => {
  const [meters, setMeters] = useState<Meter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  const fetchMeters = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/meters')
      
      if (!response.ok) {
        throw new Error('Failed to fetch meters')
      }

      const data = await response.json()
      setMeters(data.meters || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meters')
    } finally {
      setLoading(false)
    }
  }

  const createMeter = async (meterData: { label: string; type: string }) => {
    try {
      const response = await fetch('/api/meters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meterData),
      })

      if (!response.ok) {
        throw new Error('Failed to create meter')
      }

      const data = await response.json()
      setMeters(prev => [...prev, data.meter])
      return data.meter
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create meter')
    }
  }

  const updateMeter = async (id: string, meterData: { label: string; type: string }) => {
    try {
      const response = await fetch(`/api/meters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meterData),
      })

      if (!response.ok) {
        throw new Error('Failed to update meter')
      }

      const data = await response.json()
      setMeters(prev => prev.map(meter => 
        meter.id === id ? data.meter : meter
      ))
      return data.meter
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update meter')
    }
  }

  const deleteMeter = async (id: string) => {
    try {
      const response = await fetch(`/api/meters/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete meter')
      }

      setMeters(prev => prev.filter(meter => meter.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete meter')
    }
  }

  useEffect(() => {
    fetchMeters()
  }, [session?.user?.id])

  return {
    meters,
    loading,
    error,
    createMeter,
    updateMeter,
    deleteMeter,
    refetch: fetchMeters
  }
}