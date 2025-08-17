import React, { useState, useEffect } from 'react'
import { X, Target, DollarSign, Save, Calculator } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import { setBudgetInStorage, getBudgetFromStorage } from '../../lib/budgetManager'

interface SetBudgetModalProps {
  isOpen: boolean
  onClose: () => void
  onBudgetSet: (budget: number) => void
  currentBudget?: number
}

const SetBudgetModal: React.FC<SetBudgetModalProps> = ({ 
  isOpen, 
  onClose, 
  onBudgetSet,
  currentBudget 
}) => {
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const existingBudget = currentBudget || getBudgetFromStorage()
      if (existingBudget) {
        setBudget(existingBudget.toString())
      }
    }
  }, [isOpen, currentBudget])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const budgetValue = parseFloat(budget)
    
    if (!budget || isNaN(budgetValue) || budgetValue <= 0) {
      setError('Please enter a valid budget amount')
      return
    }

    if (budgetValue < 1000) {
      setError('Budget should be at least Rs 1,000')
      return
    }

    if (budgetValue > 100000) {
      setError('Budget should not exceed Rs 100,000')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Save to localStorage
      setBudgetInStorage(budgetValue)
      
      // Call parent callback
      onBudgetSet(budgetValue)
      
      onClose()
    } catch (err) {
      setError('Failed to save budget')
    } finally {
      setLoading(false)
    }
  }

  const suggestedBudgets = [15000, 20000, 25000, 30000, 35000, 40000]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Set Monthly Budget</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-background-card transition-colors"
            >
              <X className="h-5 w-5 text-foreground-secondary" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent-cyan/10 border border-primary/20">
              <div className="flex items-center space-x-2 mb-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Budget Guidelines</span>
              </div>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                Set a realistic monthly electricity bill target based on your usage patterns. 
                This helps track spending and avoid bill surprises.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  label="Monthly Budget (PKR)"
                  type="number"
                  placeholder="e.g., 25000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  min="1000"
                  max="100000"
                />
                <DollarSign className="absolute right-4 top-12 h-5 w-5 text-foreground-tertiary pointer-events-none" />
              </div>

              {/* Quick Budget Suggestions */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground-secondary">
                  Quick Select (Common Budgets)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {suggestedBudgets.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setBudget(amount.toString())}
                      className={`p-3 rounded-xl border transition-all duration-200 text-sm font-medium ${
                        budget === amount.toString()
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-border-light text-foreground-secondary hover:text-foreground'
                      }`}
                    >
                      Rs {amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Breakdown Preview */}
              {budget && !isNaN(parseFloat(budget)) && parseFloat(budget) > 0 && (
                <div className="p-4 rounded-2xl bg-background-card/30 border border-border/30">
                  <h4 className="font-medium text-foreground mb-3">Budget Breakdown</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Daily Budget:</span>
                      <span className="font-semibold text-foreground">Rs {Math.round(parseFloat(budget) / 30)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Weekly Budget:</span>
                      <span className="font-semibold text-foreground">Rs {Math.round(parseFloat(budget) / 4.3)}</span>
                    </div>
                  </div>
                </div>
              )}

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
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Set Budget'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SetBudgetModal