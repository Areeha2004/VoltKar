import React from 'react'
import { DollarSign, Calculator, AlertCircle, TrendingUp } from 'lucide-react'
import { calculateElectricityBill, CostBreakdown } from "../../lib/slabCalculations"
import Card from '../ui/Card'

interface CostBreakdownCardProps {
  units: number
  title?: string
  showProjection?: boolean
  projectedUnits?: number
  className?: string
}

const CostBreakdownCard: React.FC<CostBreakdownCardProps> = ({
  units,
  title = "Cost Breakdown",
  showProjection = false,
  projectedUnits,
  className = ''
}) => {
  const breakdown = calculateElectricityBill(units)
  const projectedBreakdown = projectedUnits ? calculateElectricityBill(projectedUnits) : null

  const formatCurrency = (amount: number) => `Rs ${amount.toLocaleString()}`

  return (
    <Card className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-foreground-secondary">{units} kWh usage</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{formatCurrency(breakdown.totalCost)}</p>
          <p className="text-sm text-foreground-secondary">Total Bill</p>
        </div>
      </div>

      {/* Slab Breakdown */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground flex items-center space-x-2">
          <DollarSign className="h-4 w-4" />
          <span>Slab-wise Breakdown</span>
        </h4>
        
        <div className="space-y-3">
          {breakdown.slabBreakdown.map((slab, index) => (
            <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-background-card/30">
              <div className="space-y-1">
                <p className="font-medium text-foreground">{slab.slab} kWh</p>
                <p className="text-sm text-foreground-secondary">
                  {slab.units} units × Rs {slab.rate}/kWh
                </p>
              </div>
              <p className="font-semibold text-foreground">{formatCurrency(slab.cost)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Components */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground">Bill Components</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-foreground-secondary">Base Cost (Energy Charges)</span>
            <span className="font-medium text-foreground">{formatCurrency(breakdown.baseCost)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-foreground-secondary">FPA ({units} × Rs 4.77)</span>
            <span className="font-medium text-foreground">{formatCurrency(breakdown.fpaAmount)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-foreground-secondary">Fixed Charges</span>
            <span className="font-medium text-foreground">Rs 200</span>
          </div>
          
          <div className="border-t border-border/30 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Subtotal</span>
              <span className="font-medium text-foreground">{formatCurrency(breakdown.subtotal)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-foreground-secondary">GST (17%)</span>
            <span className="font-medium text-foreground">{formatCurrency(breakdown.gstAmount)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-foreground-secondary">TV Fee</span>
            <span className="font-medium text-foreground">{formatCurrency(breakdown.tvFee)}</span>
          </div>
          
          <div className="border-t border-border/30 pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground text-lg">Total Amount</span>
              <span className="font-bold text-primary text-xl">{formatCurrency(breakdown.totalCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Alert */}
      {breakdown.slabWarning && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-amber/10 to-red-500/10 border border-accent-amber/20">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-accent-amber mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-accent-amber">Cost Alert</p>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                You're approaching a higher tariff slab. Consider reducing usage to avoid increased rates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Projection Comparison */}
      {showProjection && projectedBreakdown && projectedUnits !== units && (
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-accent-blue" />
              <span className="font-semibold text-foreground">Monthly Projection</span>
            </div>
            <span className="text-sm text-foreground-secondary">{projectedUnits} kWh</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-background-card/50 text-center">
              <p className="text-sm text-foreground-secondary">Current</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(breakdown.totalCost)}</p>
            </div>
            <div className="p-3 rounded-xl bg-background-card/50 text-center">
              <p className="text-sm text-foreground-secondary">Projected</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(projectedBreakdown.totalCost)}</p>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-sm text-foreground-secondary">
              Difference: {formatCurrency(Math.abs(projectedBreakdown.totalCost - breakdown.totalCost))}
              <span className={`ml-1 ${
                projectedBreakdown.totalCost > breakdown.totalCost ? 'text-red-400' : 'text-primary'
              }`}>
                ({projectedBreakdown.totalCost > breakdown.totalCost ? '+' : '-'}
                {Math.abs(((projectedBreakdown.totalCost - breakdown.totalCost) / breakdown.totalCost * 100)).toFixed(1)}%)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Cost Per Unit */}
      <div className="pt-4 border-t border-border/30">
        <div className="flex justify-between items-center">
          <span className="text-foreground-secondary">Average Cost per kWh</span>
          <span className="font-semibold text-foreground">
            Rs {(breakdown.totalCost / units).toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  )
}

export default CostBreakdownCard