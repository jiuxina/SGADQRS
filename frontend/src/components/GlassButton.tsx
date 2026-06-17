import { type ReactNode } from 'react'

interface GlassButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'default' | 'primary'
  size?: 'sm' | 'md'
}

export default function GlassButton({
  children,
  onClick,
  className = '',
  variant = 'default',
  size = 'md',
}: GlassButtonProps) {
  const isPrimary = variant === 'primary'

  return (
    <button
      className={className}
      style={{
        padding: size === 'sm' ? '8px 16px' : '12px 24px',
        borderRadius: '10px',
        border: 'none',
        background: isPrimary ? 'var(--accent)' : 'rgba(120, 120, 128, 0.12)',
        color: isPrimary ? 'white' : 'var(--accent)',
        fontSize: size === 'sm' ? '15px' : '17px',
        fontWeight: isPrimary ? '600' : '400',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.15s ease',
      }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
