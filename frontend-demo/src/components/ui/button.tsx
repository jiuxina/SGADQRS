import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-brand-primary text-text-inverse hover:bg-brand-primary-hover active:bg-brand-primary-active shadow-sm hover:shadow-md',
    secondary:
      'border border-border-default bg-bg-secondary text-text-primary hover:bg-bg-tertiary active:bg-border-default',
    ghost:
      'text-text-secondary hover:bg-bg-tertiary active:bg-border-default',
    danger:
      'bg-danger text-text-inverse hover:bg-red-600 active:bg-red-700 shadow-sm',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded',
    md: 'h-12 px-5 text-sm rounded-md',
    lg: 'h-14 px-6 text-base rounded-lg',
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
