import React, { useState } from 'react'
import { Home, Edit, Trash2, Power, Calendar } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface Meter {
  id: string
  label: string
  type: string
  createdAt: string
  lastReading?: number
  lastReadingDate?: string
  status: 'active' | 'inactive'
}

interface MeterCardProps {
  meter: Meter
  onUpdate: (id: string, data: { label: string; type: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const MeterCard: React.FC<MeterCardProps> = ({ meter, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    label: meter.label,
    type: meter.type
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    try {
      setLoading(true)
      await onUpdate(meter.id, editData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update meter:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this meter?')) {
      try {
        setLoading(true)
        await onDelete(meter.id)
      } catch (error) {
        console.error('Failed to delete meter:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Card className="hover:shadow-card-hover transition-all duration-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-2xl ${
              meter.status === 'active' 
                ? 'bg-primary/20 text-primary' 
                : 'bg-foreground-tertiary/20 text-foreground-tertiary'
            }`}>
              <Home className="h-6 w-6" />
            </div>
            <div>
              {isEditing ? (
                <Input
                  value={editData.label}
                  onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                  className="text-lg font-semibold"
                />
              ) : (
                <h3 className="text-lg font-semibold text-foreground">{meter.label}</h3>
              )}
              <div className="flex items-center space-x-2 text-sm text-foreground-secondary">
                {isEditing ? (
                  <select
                    value={editData.type}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                    className="bg-background-card border border-border rounded px-2 py-1"
                  >
                    <option value="single-phase">Single Phase</option>
                    <option value="three-phase">Three Phase</option>
                  </select>
                ) : (
                  <span>{meter.type}</span>
                )}
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Power className="h-3 w-3" />
                  <span className="capitalize">{meter.status}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={loading}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-red-500 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
          <div>
            <p className="text-sm text-foreground-secondary">Last Reading</p>
            <p className="text-lg font-semibold text-foreground font-mono">
              {meter.lastReading ? meter.lastReading.toLocaleString() : 'No readings'}
            </p>
          </div>
          <div>
            <p className="text-sm text-foreground-secondary">Last Updated</p>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-foreground-tertiary" />
              <p className="text-sm text-foreground">
                {meter.lastReadingDate 
                  ? new Date(meter.lastReadingDate).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default MeterCard