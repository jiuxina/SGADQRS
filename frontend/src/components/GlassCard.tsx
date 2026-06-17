import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export default function GlassCard({ children, className = '', style, onClick }: GlassCardProps) {
  return (
    <div
      className={`glass ${className}`}
      style={{
        borderRadius: '10px',
        overflow: 'hidden',
        ...style,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </div>
  )
}
