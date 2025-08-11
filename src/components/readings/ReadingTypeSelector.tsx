import React from 'react'
import { Calendar, Zap, Clock, CheckCircle } from 'lucide-react'

interface ReadingTypeSelectorProps {
  selectedType: 'mandatory' | 'mini'
  onTypeChange: (type: 'mandatory' | 'mini') => void
  className?: string
}

const ReadingTypeSelector: React.FC<ReadingTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = ''
}) => {
  const readingTypes = [
    {
      id: 'mini' as const,
      title: 'Mini Reading',
      description: 'Quick check for tracking and analysis',
      icon: Clock,
      color: 'from-accent-blue to-accent-purple',
      features: ['Real-time tracking', 'Usage analysis', 'Early warnings']
    },
    {
      id: 'mandatory' as const,
      title: 'End-of-Month Reading',
      description: 'Official reading for bill calculation',
      icon: Calendar,
      color: 'from-primary to-accent-cyan',
      features: ['Bill calculation', 'Official record', 'Monthly summary']
    }
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Reading Type</h3>
        <p className="text-sm text-foreground-secondary">
          Choose the type of reading you want to record
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {readingTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onTypeChange(type.id)}
            className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
              selectedType === type.id
                ? 'border-primary bg-primary/10 shadow-glow'
                : 'border-border hover:border-border-light hover:bg-background-card/50'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`bg-gradient-to-r ${type.color} p-3 rounded-xl`}>
                    <type.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-lg">{type.title}</h4>
                    <p className="text-sm text-foreground-secondary">{type.description}</p>
                  </div>
                </div>
                {selectedType === type.id && (
                  <div className="bg-primary rounded-full p-1">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground-secondary">Features:</p>
                <ul className="space-y-1">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm text-foreground-secondary">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Reading Type Info */}
      <div className="p-4 rounded-2xl bg-background-card/30 border border-border/30">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Reading Guidelines</span>
          </div>
          <div className="text-sm text-foreground-secondary space-y-2">
            <p>
              <strong>Mini Readings:</strong> Record anytime for tracking usage patterns and getting early warnings about approaching higher tariff slabs.
            </p>
            <p>
              <strong>End-of-Month Readings:</strong> Required once per month for accurate bill calculation and official records. This should be your actual meter reading at month-end.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReadingTypeSelector