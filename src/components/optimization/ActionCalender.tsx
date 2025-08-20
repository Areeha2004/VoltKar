import React, { useState } from 'react'
import { Calendar, Clock, DollarSign, Target, CheckCircle, AlertTriangle } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'

interface ActionPlanDay {
  date: string
  dayName: string
  recommendation: string
  priority: 'high' | 'medium' | 'low'
  expectedSavings: number
}

interface ActionCalendarProps {
  actionPlan: ActionPlanDay[]
  onDaySelect?: (day: ActionPlanDay) => void
  className?: string
}

const ActionCalendar: React.FC<ActionCalendarProps> = ({
  actionPlan,
  onDaySelect,
  className = ''
}) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())

  const handleDayClick = (day: ActionPlanDay) => {
    setSelectedDay(selectedDay === day.date ? null : day.date)
    onDaySelect?.(day)
  }

  const markCompleted = (date: string) => {
    setCompletedActions(prev => new Set([...prev, date]))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-500/10'
      case 'medium': return 'border-accent-amber bg-accent-amber/10'
      case 'low': return 'border-accent-blue bg-accent-blue/10'
      default: return 'border-border bg-background-card/30'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium': return <Clock className="h-4 w-4 text-accent-amber" />
      case 'low': return <Target className="h-4 w-4 text-accent-blue" />
      default: return <Calendar className="h-4 w-4 text-foreground-tertiary" />
    }
  }

  const totalSavings = actionPlan.reduce((sum, day) => sum + day.expectedSavings, 0)

  return (
    <Card className={`card-premium ${className}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-3 rounded-2xl">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-foreground font-sora">7-Day Action Calendar</h3>
              <p className="text-foreground-secondary">Daily optimization schedule</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary">Rs {totalSavings.toLocaleString()}</p>
            <p className="text-sm text-foreground-secondary">Total potential savings</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid md:grid-cols-7 gap-3">
          {actionPlan.map((day, index) => {
            const isSelected = selectedDay === day.date
            const isCompleted = completedActions.has(day.date)
            const isToday = new Date(day.date).toDateString() === new Date().toDateString()

            return (
              <button
                key={day.date}
                onClick={() => handleDayClick(day)}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left group relative ${
                  isSelected ? 'border-primary bg-primary/10 shadow-glow' :
                  isCompleted ? 'border-primary bg-primary/5' :
                  `${getPriorityColor(day.priority)} hover:shadow-card`
                }`}
              >
                {/* Completion Badge */}
                {isCompleted && (
                  <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Today Badge */}
                {isToday && !isCompleted && (
                  <div className="absolute -top-2 -right-2 bg-accent-amber rounded-full p-1">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{day.dayName}</p>
                    <p className="text-xs text-foreground-secondary">{new Date(day.date).getDate()}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      {getPriorityIcon(day.priority)}
                    </div>
                    <p className="text-xs text-foreground-secondary leading-tight line-clamp-3">
                      {day.recommendation}
                    </p>
                    <div className="flex items-center justify-center space-x-1">
                      <DollarSign className="h-3 w-3 text-primary" />
                      <span className="text-xs font-semibold text-primary">Rs {day.expectedSavings}</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-background-card/50 to-background-secondary/50 border border-border/50">
            <div className="space-y-4">
              {(() => {
                const day = actionPlan.find(d => d.date === selectedDay)
                if (!day) return null

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {day.dayName}, {new Date(day.date).toLocaleDateString()}
                          </h4>
                          <p className="text-sm text-foreground-secondary">Daily optimization plan</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        day.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                        day.priority === 'medium' ? 'bg-accent-amber/10 text-accent-amber' :
                        'bg-accent-blue/10 text-accent-blue'
                      }`}>
                        {day.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-background-card/50">
                      <p className="text-foreground-secondary leading-relaxed">{day.recommendation}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">Rs {day.expectedSavings} potential savings</span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => markCompleted(day.date)}
                        disabled={completedActions.has(day.date)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {completedActions.has(day.date) ? 'Completed' : 'Mark Complete'}
                      </Button>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Progress Summary */}
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-foreground-secondary">
                {completedActions.size} of {actionPlan.length} actions completed
              </span>
              <div className="w-32 bg-background-secondary rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-accent-cyan rounded-full h-2 transition-all duration-300"
                  style={{ width: `${(completedActions.size / actionPlan.length) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-foreground-tertiary">
              Rs {Math.round(totalSavings * (completedActions.size / actionPlan.length)).toLocaleString()} saved
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ActionCalendar