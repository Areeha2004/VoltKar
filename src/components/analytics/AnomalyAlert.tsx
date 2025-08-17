import React from 'react'
import { AlertTriangle, CheckCircle, X, Eye, Clock, DollarSign,Target } from 'lucide-react'
import Button from '../ui/Button'
import { Anomaly } from '../../lib/anomalyDetection'

interface AnomalyAlertProps {
  anomaly: Anomaly;
  onResolve?: (anomalyId: string) => void;
  onInvestigate?: (anomalyId: string) => void;
  onDismiss?: (anomalyId: string) => void;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties; // Add this line
}

const AnomalyAlert: React.FC<AnomalyAlertProps> = ({
  anomaly,
  onResolve,
  onInvestigate,
  onDismiss,
  compact = false,
  className = ''
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-500/5'
      case 'high': return 'border-l-red-400 bg-red-400/5'
      case 'medium': return 'border-l-accent-amber bg-accent-amber/5'
      case 'low': return 'border-l-accent-blue bg-accent-blue/5'
      default: return 'border-l-border bg-background-secondary'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-accent-amber" />
      case 'low':
        return <AlertTriangle className="h-5 w-5 text-accent-blue" />
      default:
        return <AlertTriangle className="h-5 w-5 text-foreground-tertiary" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'usage_spike': return 'Usage Spike'
      case 'usage_drop': return 'Usage Drop'
      case 'cost_anomaly': return 'Cost Anomaly'
      case 'reading_error': return 'Reading Error'
      case 'pattern_break': return 'Pattern Break'
      default: return 'Unknown'
    }
  }

  if (compact) {
    return (
      <div className={`p-4 rounded-xl border-l-4 ${getSeverityColor(anomaly.severity)} ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getSeverityIcon(anomaly.severity)}
            <div>
              <p className="font-semibold text-foreground">{anomaly.title}</p>
              <p className="text-sm text-foreground-secondary">{anomaly.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              anomaly.resolved ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-400'
            }`}>
              {anomaly.resolved ? 'Resolved' : 'Active'}
            </span>
            {onDismiss && (
              <button
                onClick={() => onDismiss(anomaly.id)}
                className="p-1 rounded-lg hover:bg-background-card transition-colors"
              >
                <X className="h-4 w-4 text-foreground-tertiary" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 rounded-2xl border-l-4 ${getSeverityColor(anomaly.severity)} ${className}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getSeverityIcon(anomaly.severity)}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-foreground text-lg">{anomaly.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  anomaly.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                  anomaly.severity === 'high' ? 'bg-red-400/10 text-red-400' :
                  anomaly.severity === 'medium' ? 'bg-accent-amber/10 text-accent-amber' :
                  'bg-accent-blue/10 text-accent-blue'
                }`}>
                  {anomaly.severity.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  anomaly.resolved ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-400'
                }`}>
                  {anomaly.resolved ? 'Resolved' : 'Active'}
                </span>
              </div>
              <p className="text-foreground-secondary leading-relaxed">{anomaly.description}</p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(anomaly.id)}
              className="p-2 rounded-lg hover:bg-background-card transition-colors"
            >
              <X className="h-5 w-5 text-foreground-tertiary" />
            </button>
          )}
        </div>

        {/* Anomaly Details */}
        <div className="grid md:grid-cols-3 gap-4 p-4 rounded-xl bg-background-card/30">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-foreground-tertiary" />
            <div>
              <p className="text-xs text-foreground-secondary">Detected</p>
              <p className="text-sm font-medium text-foreground">
                {anomaly.detectedAt.toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-foreground-tertiary" />
            <div>
              <p className="text-xs text-foreground-secondary">Type</p>
              <p className="text-sm font-medium text-foreground">{getTypeLabel(anomaly.type)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-foreground-tertiary" />
            <div>
              <p className="text-xs text-foreground-secondary">Confidence</p>
              <p className="text-sm font-medium text-foreground">{anomaly.confidence}%</p>
            </div>
          </div>
        </div>

        {/* Impact */}
        {anomaly.impact && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-accent-amber/10 to-accent-pink/10 border border-accent-amber/20">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-accent-amber" />
              <span className="font-medium text-accent-amber">Impact: {anomaly.impact}</span>
            </div>
          </div>
        )}

        {/* Suggested Action */}
        {anomaly.suggestedAction && (
          <div className="p-4 rounded-xl bg-background-card/50 border border-border/50">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Suggested Action:</p>
              <p className="text-sm text-foreground-secondary leading-relaxed">{anomaly.suggestedAction}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!anomaly.resolved && (
          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <div className="flex space-x-3">
              {onInvestigate && (
                <Button variant="outline" size="sm" onClick={() => onInvestigate(anomaly.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Investigate
                </Button>
              )}
              {onResolve && (
                <Button size="sm" onClick={() => onResolve(anomaly.id)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              )}
            </div>
            <div className="text-xs text-foreground-tertiary">
              ID: {anomaly.id}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnomalyAlert