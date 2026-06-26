import { type ReactNode, useState } from 'react'
import { motion } from 'motion/react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export default function GlassCard({ children, className = '', style, onClick }: GlassCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
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
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={{
        y: isHovered ? -4 : 0,
        boxShadow: isHovered
          ? '0 12px 40px rgba(0, 0, 0, 0.15)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  )
}
