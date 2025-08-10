import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Reading {
  id: string
  meterId: string
  reading: number
  month: number
  year: number
  createdAt: string
  meter: {
    id: string
    label: string
    type: string
  }
  usage?: number
  estimatedCost?: number
}

export const useReadings = (meterId?: string, limit = 10) => {
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  const fetchReadings = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(meterId && { meterId })
      })
      
      const response = await fetch(`/api/readings?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch readings')
      }

      const data = await response.json()
      setReadings(data.readings || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch readings')
    } finally {
      setLoading(false)
    }
  }

  const createReading = async (readingData: {
    meterId: string
    reading: number
    month: number
    year: number
    notes?: string
  }) => {
    try {
      const response = await fetch('/api/readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(readingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create reading')
      }

      const data = await response.json()
      setReadings(prev => [data.reading, ...prev])
      return data.reading
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create reading')
    }
  }

  const updateReading = async (id: string, readingData: {
    reading: number
    month: number
    year: number
    notes?: string
  }) => {
    try {
      const response = await fetch(`/api/readings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(readingData),
      })

      if (!response.ok) {
        throw new Error('Failed to update reading')
      }

      const data = await response.json()
      setReadings(prev => prev.map(reading => 
        reading.id === id ? data.reading : reading
      ))
      return data.reading
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update reading')
    }
  }

  const deleteReading = async (id: string) => {
    try {
      const response = await fetch(`/api/readings/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete reading')
      }

      setReadings(prev => prev.filter(reading => reading.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete reading')
    }
  }

  useEffect(() => {
    fetchReadings()
  }, [session?.user?.id, meterId, limit])

  return {
    readings,
    loading,
    error,
    createReading,
    updateReading,
    deleteReading,
    refetch: fetchReadings
  }
}