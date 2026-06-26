import { motion } from 'motion/react'

interface SkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
  count?: number
}

export function SkeletonLine({ width = '100%', height = '14px', borderRadius = '4px' }: SkeletonProps) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%)',
        backgroundSize: '200% 100%',
      }}
    />
  )
}

export function SkeletonCircle({ size = '40px' }: { size?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(90deg, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%)',
        backgroundSize: '200% 100%',
        flexShrink: 0,
      }}
    />
  )
}

export function SkeletonCard({ width = '240px' }: { width?: string }) {
  return (
    <div
      style={{
        width,
        padding: '16px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}
    >
      <SkeletonLine width="100%" height="100px" borderRadius="8px" />
      <div style={{ marginTop: '12px' }}>
        <SkeletonLine width="70%" height="16px" />
        <div style={{ marginTop: '8px' }}>
          <SkeletonLine width="100%" height="12px" />
        </div>
        <div style={{ marginTop: '4px' }}>
          <SkeletonLine width="80%" height="12px" />
        </div>
      </div>
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <SkeletonLine width="60px" height="24px" borderRadius="12px" />
        <SkeletonLine width="60px" height="24px" borderRadius="12px" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SkeletonCircle size="40px" />
          <div style={{ flex: 1 }}>
            <SkeletonLine width="60%" height="14px" />
            <div style={{ marginTop: '6px' }}>
              <SkeletonLine width="40%" height="10px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
