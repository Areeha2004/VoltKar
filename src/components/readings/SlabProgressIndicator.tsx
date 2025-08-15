import React from 'react'
import { AlertTriangle, TrendingUp, Zap } from 'lucide-react'
import { getCurrentSlab, getSlabWarningMessage, DEFAULT_TARIFF } from '../../lib/tariffEngine'
import Card from '../ui/Card'

interface SlabProgressIndicatorProps {
  currentUnits: number
  projectedUnits?: number
  className?: string
}

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * SlabProgressIndicator component shows the current slab progress, current and next tariff rates,
 * warning alerts, and monthly projection.
 *
 * @param {SlabProgressIndicatorProps} props - The component props:
 *                                            - currentUnits: current usage in kWh
 *                                            - projectedUnits: projected usage in kWh (optional)
 *                                            - className: additional CSS classes for the component
 * @returns {React.ReactElement | null} The rendered component or null if current slab info is not available
 */
/*******  f8ddb779-e0c9-4f2c-8583-fa7b73f05da2  *******/const SlabProgressIndicator: React.FC<SlabProgressIndicatorProps> = ({
  currentUnits,
  projectedUnits,
  className = ''
}) => {
  const currentSlabInfo = getCurrentSlab(currentUnits)
  const projectedSlabInfo = projectedUnits ? getCurrentSlab(projectedUnits) : null
  const warningMessage = getSlabWarningMessage(currentUnits)

  if (!currentSlabInfo) return null

  const { slab: currentSlab, index: currentSlabIndex } = currentSlabInfo
  const nextSlab = DEFAULT_TARIFF.slabs[currentSlabIndex + 1]
  
  // Calculate progress within current slab
  const slabRange = currentSlab.max - currentSlab.min + 1
  const unitsInSlab = currentUnits - currentSlab.min
  const progressPercentage = Math.min((unitsInSlab / slabRange) * 100, 100)

  return (
    <Card className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Slab Progress</h3>
            <p className="text-sm text-foreground-secondary">Current usage: {currentUnits} kWh</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">Rs {currentSlab.rate}</p>
          <p className="text-sm text-foreground-secondary">per kWh</p>
        </div>
      </div>

      {/* Current Slab Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">
            Slab {currentSlab.max === Infinity ? `${currentSlab.min}+` : `${currentSlab.min}-${currentSlab.max}`}
          </span>
          <span className="text-foreground font-medium">
            {unitsInSlab}/{currentSlab.max === Infinity ? '∞' : slabRange} units
          </span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-background-secondary rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                progressPercentage > 80 ? 'bg-gradient-to-r from-accent-amber to-red-500' :
                progressPercentage > 60 ? 'bg-gradient-to-r from-primary to-accent-amber' :
                'bg-gradient-to-r from-primary to-accent-cyan'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          
          {/* Progress indicator dot */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-lg"
            style={{ left: `${Math.min(progressPercentage, 95)}%` }}
          />
        </div>
      </div>

      {/* Slab Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-xl bg-background-card/50">
          <p className="text-sm text-foreground-secondary">Current Rate</p>
          <p className="text-lg font-bold text-primary">Rs {currentSlab.rate}</p>
        </div>
        
        {nextSlab && (
          <div className="text-center p-3 rounded-xl bg-background-card/50">
            <p className="text-sm text-foreground-secondary">Next Rate</p>
            <p className="text-lg font-bold text-accent-amber">Rs {nextSlab.rate}</p>
          </div>
        )}
        
        <div className="text-center p-3 rounded-xl bg-background-card/50">
          <p className="text-sm text-foreground-secondary">Units to Next</p>
          <p className="text-lg font-bold text-foreground">
            {nextSlab ? nextSlab.min - currentUnits : 'N/A'}
          </p>
        </div>
      </div>

      {/* Warning Alert */}
      {warningMessage && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-amber/10 to-red-500/10 border border-accent-amber/20">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-accent-amber mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-accent-amber">Slab Warning</p>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                {warningMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Projected Usage */}
      {projectedUnits && projectedUnits !== currentUnits && (
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-accent-blue" />
              <span className="text-sm font-medium text-foreground">Monthly Projection</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">{Math.round(projectedUnits)} kWh</p>
              {projectedSlabInfo && projectedSlabInfo.index !== currentSlabIndex && (
                <p className="text-sm text-accent-amber">
                  Will reach Rs {projectedSlabInfo.slab.rate}/kWh slab
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Slabs Reference */}
      <div className="pt-4 border-t border-border/30">
        <p className="text-sm font-medium text-foreground-secondary mb-3">All Tariff Slabs</p>
        <div className="space-y-2">
          {DEFAULT_TARIFF.slabs.map((slab, index) => (
            <div 
              key={index}
              className={`flex justify-between items-center p-2 rounded-lg transition-colors ${
                index === currentSlabIndex 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-background-card/30'
              }`}
            >
              <span className="text-sm text-foreground-secondary">
                {slab.max === Infinity ? `${slab.min}+` : `${slab.min}-${slab.max}`} kWh
              </span>
              <span className={`text-sm font-medium ${
                index === currentSlabIndex ? 'text-primary' : 'text-foreground'
              }`}>
                Rs {slab.rate}/kWh
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default SlabProgressIndicator