import React, { useState } from 'react'
import { X, Home, Plus } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

interface CreateMeterModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { label: string; type: string }) => Promise<void>
}

const CreateMeterModal: React.FC<CreateMeterModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    label: '',
    type: 'single-phase'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.label.trim()) {
      setError('Meter name is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await onSubmit(formData)
      setFormData({ label: '', type: 'single-phase' })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meter')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                <Home className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Add New Meter</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-background-card transition-colors"
            >
              <X className="h-5 w-5 text-foreground-secondary" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Meter Name"
              placeholder="e.g., Main House, Guest House"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground-secondary">
                Meter Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input-field w-full"
              >
                <option value="single-phase">Single Phase</option>
                <option value="three-phase">Three Phase</option>
              </select>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Meter'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

export default CreateMeterModal