import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  glass?: boolean
  hover?: boolean
  premium?: boolean
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  glass = true, 
  hover = false,
  premium = false 
}) => {
  return (
    <div 
      className={clsx(
        'rounded-3xl transition-all duration-500',
        glass ? 'glass-card' : 'bg-background-card border border-border',
        hover && 'hover:shadow-card-hover hover:-translate-y-2 hover:border-border-light',
        premium && 'card-premium',
        className
      )}
    >
      <div className="p-8">
        {children}
      </div>
    </div>
  )
}

export default Card