import React from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group'
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-glow hover:shadow-glow-lg transform hover:-translate-y-1 focus:ring-primary/50',
    secondary: 'bg-background-card hover:bg-background-tertiary text-foreground border border-border hover:border-border-light backdrop-blur-sm',
    ghost: 'text-foreground-secondary hover:text-foreground hover:bg-background-card/50 backdrop-blur-sm',
    outline: 'border border-border hover:border-primary text-foreground-secondary hover:text-foreground hover:bg-primary/5 backdrop-blur-sm'
  }
  
  const sizes = {
    sm: 'px-6 py-3 text-sm',
    md: 'px-8 py-4 text-base',
    lg: 'px-12 py-6 text-lg'
  }

  return (
    <button
      className={clsx(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-light to-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  )
}

export default Button