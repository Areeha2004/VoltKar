import React from 'react'
import { AlertTriangle, X, TrendingUp, Lightbulb } from 'lucide-react'
import { getSlabWarningMessage, getCurrentSlab, TARIFF_SLABS } from '../../lib/slabCalculations'

interface SlabWarningAlertProps {
  units: number
  onDismiss?: () => void
  showSuggestions?: boolean
  className?: string
}

const SlabWarningAlert: React.FC<SlabWarningAlertProps> = ({
  units,
  onDismiss,
  showSuggestions = true,
  className = ''
}) => {
  const warningMessage = getSlabWarningMessage(units)
  const currentSlabInfo = getCurrentSlab(units)
  
  if (!warningMessage || !currentSlabInfo) return null

  const { slab: currentSlab, index: currentSlabIndex } = currentSlabInfo
  const nextSlab = TARIFF_SLABS[currentSlabIndex + 1]
  const unitsToNextSlab = nextSlab ? nextSlab.min - units : 0

  const suggestions = [
    'Reduce AC usage during peak hours (6-10 PM)',
    'Use energy-efficient LED bulbs',
    'Unplug devices when not in use',
    'Schedule high-power appliances during off-peak hours'
  ]

  return (
    <div className={`rounded-2xl border-l-4 border-l-accent-amber bg-gradient-to-r from-accent-amber/10 to-red-500/10 border border-accent-amber/20 ${className}`}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-accent-amber mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-accent-amber text-lg">Slab Warning Alert</h3>
              <p className="text-foreground-secondary leading-relaxed">
                {warningMessage}
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg hover:bg-background-card/50 transition-colors"
            >
              <X className="h-5 w-5 text-foreground-tertiary" />
            </button>
          )}
        </div>

        {/* Slab Comparison */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-background-card/30">
          <div className="text-center">
            <p className="text-sm text-foreground-secondary">Current Rate</p>
            <p className="text-2xl font-bold text-primary">Rs {currentSlab.rate}</p>
            <p className="text-xs text-foreground-tertiary">per kWh</p>
          </div>
          {nextSlab && (
            <div className="text-center">
              <p className="text-sm text-foreground-secondary">Next Slab Rate</p>
              <p className="text-2xl font-bold text-red-400">Rs {nextSlab.rate}</p>
              <p className="text-xs text-foreground-tertiary">per kWh</p>
            </div>
          )}
        </div>

        {/* Impact Calculation */}
        {nextSlab && (
          <div className="p-4 rounded-xl bg-background-card/50 border border-border/30">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-4 w-4 text-accent-blue" />
              <span className="font-medium text-foreground">Cost Impact</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">If you exceed by 10 units:</span>
                <span className="font-semibold text-red-400">
                  +Rs {((nextSlab.rate - currentSlab.rate) * 10).toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">If you exceed by 50 units:</span>
                <span className="font-semibold text-red-400">
                  +Rs {((nextSlab.rate - currentSlab.rate) * 50).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Energy Saving Suggestions */}
        {showSuggestions && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Energy Saving Tips</span>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 rounded-lg bg-background-card/30">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-foreground-secondary">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <div className="text-sm text-foreground-tertiary">
            Stay within {unitsToNextSlab} units to avoid higher rates
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
              View Usage Tips
            </button>
            <button className="px-4 py-2 rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors text-sm font-medium">
              Set Usage Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SlabWarningAlert