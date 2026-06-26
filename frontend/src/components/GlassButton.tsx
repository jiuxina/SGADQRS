import { type ReactNode, type MouseEvent, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Ripple {
  id: number
  x: number
  y: number
}

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
  const [ripples, setRipples] = useState<Ripple[]>([])

  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples((prev) => [...prev, { id, x, y }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)

    onClick?.()
  }, [onClick])

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
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={handleClick}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: isPrimary ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 122, 255, 0.3)',
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>
    </button>
  )
}
