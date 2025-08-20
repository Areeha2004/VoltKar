// components/forms/DeviceForm.tsx
'use client'

import React, {
  FC,
  useState,
  useEffect,
  ChangeEvent,
  FormEvent
} from 'react'
import { Plus, X, Calculator, Save } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export interface FormData {
  name: string
  category: string
  type: string
  wattage: string
  hoursPerDay: string
  daysPerMonth: string
}

export interface DeviceFormProps {
  initialData?: FormData
  metadata: {
    categories: string[]
    types: string[]
  }
  getWattageGuide: (cat: string) => { min: number; max: number } | null
  getUsageGuide: (cat: string) => { min: number; max: number } | null
  onSave: (data: FormData) => Promise<void> | void
  onCancel: () => void
}

const DeviceForm: FC<DeviceFormProps> = ({
  initialData,
  metadata,
  getWattageGuide,
  getUsageGuide,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<FormData>(
    initialData ?? {
      name: '',
      category: '',
      type: 'Non-Inverter',
      wattage: '',
      hoursPerDay: '',
      daysPerMonth: '30'
    }
  )
  const [preview, setPreview] = useState({ kWh: 0, cost: 0 })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const calculatePreview = (data: FormData) => {
    const w = parseFloat(data.wattage) || 0
    const h = parseFloat(data.hoursPerDay) || 0
    const d = parseInt(data.daysPerMonth) || 0
    if (w <= 0 || h <= 0 || d <= 0) return { kWh: 0, cost: 0 }
    let kWh = (w * h * d) / 1000
    if (data.type === 'Inverter') kWh *= 0.7
    return { kWh: Math.round(kWh * 100) / 100, cost: Math.round(kWh * 20) }
  }

  // update preview whenever formData changes
  useEffect(() => {
    setPreview(calculatePreview(formData))
  }, [formData])

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      type: 'Non-Inverter',
      wattage: '',
      hoursPerDay: '',
      daysPerMonth: '30'
    })
    setFormError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (
      !formData.name.trim() ||
      !formData.category ||
      !formData.wattage ||
      !formData.hoursPerDay
    ) {
      setFormError('Please fill in all required fields')
      return
    }
    try {
      setSubmitting(true)
      setFormError(null)
      await onSave(formData)
    } catch (err: any) {
      setFormError(err?.message ?? 'Failed to save appliance')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground font-sora">
                {initialData ? 'Edit Appliance' : 'Add New Appliance'}
              </h2>
              <p className="text-foreground-secondary">
                Configure your appliance details
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm()
              onCancel()
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column: inputs */}
          <div className="space-y-6">
            <Input
              label="Appliance Name *"
              placeholder="e.g., Living Room AC"
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground-secondary">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="input-field w-full"
                required
              >
                <option value="">Select Category</option>
                {metadata.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground-secondary">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="input-field w-full"
                required
              >
                {metadata.types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {formData.type === 'Inverter' && (
                <p className="text-xs text-primary">
                  ✨ 30% more efficient than non-inverter
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Power Rating (Watts) *"
                type="number"
                placeholder="1500"
                value={formData.wattage}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, wattage: e.target.value })
                }
                min="1"
                max="10000"
                required
              />
              <Input
                label="Hours per Day *"
                type="number"
                placeholder="8"
                value={formData.hoursPerDay}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, hoursPerDay: e.target.value })
                }
                min="0.1"
                max="24"
                step="0.1"
                required
              />
            </div>

            <Input
              label="Days per Month"
              type="number"
              placeholder="30"
              value={formData.daysPerMonth}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, daysPerMonth: e.target.value })
              }
              min="1"
              max="31"
            />
          </div>

          {/* Right column: preview & guides */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent-cyan/10 border border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-primary">Live Preview</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-xl bg-background-card/50">
                    <p className="text-sm text-foreground-secondary">Estimated kWh</p>
                    <p className="text-2xl font-bold text-foreground">{preview.kWh}</p>
                    <p className="text-xs text-foreground-tertiary">per month</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-background-card/50">
                    <p className="text-sm text-foreground-secondary">Estimated Cost</p>
                    <p className="text-2xl font-bold text-primary">
                      Rs {preview.cost.toLocaleString()}
                    </p>
                    <p className="text-xs text-foreground-tertiary">per month</p>
                  </div>
                </div>
              </div>
            </div>

            {formData.category && (
              <div className="p-4 rounded-2xl bg-background-card/30 border border-border/30">
                <h4 className="font-medium text-foreground mb-3">
                  Typical Values for {formData.category}
                </h4>
                <div className="space-y-2 text-sm">
                  {(() => {
                    const wg = getWattageGuide(formData.category)
                    const ug = getUsageGuide(formData.category)
                    return (
                      <>
                        {wg && (
                          <div className="flex justify-between">
                            <span className="text-foreground-secondary">Power Range:</span>
                            <span className="text-foreground">
                              {wg.min}-{wg.max}W
                            </span>
                          </div>
                        )}
                        {ug && (
                          <div className="flex justify-between">
                            <span className="text-foreground-secondary">Usage Range:</span>
                            <span className="text-foreground">
                              {ug.min}-{ug.max}h/day
                            </span>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            {formError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{formError}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-border/30">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm()
              onCancel()
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            <Save className="h-5 w-5 mr-2" />
            {submitting
              ? 'Saving...'
              : initialData
              ? 'Update Appliance'
              : 'Add Appliance'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default DeviceForm