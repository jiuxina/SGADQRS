import { motion } from 'motion/react'

function shimmer() {
  return {
    animate: { opacity: [0.4, 0.7, 0.4] } as const,
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
  }
}

function Bar({ width = '100%', height = '14px', borderRadius = '6px' }: { width?: string; height?: string; borderRadius?: string }) {
  return (
    <motion.div
      {...shimmer()}
      style={{ width, height, borderRadius, background: 'rgba(0,0,0,0.06)' }}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="metric-card" style={{ padding: '14px' }}>
          <Bar width="60%" height="12px" />
          <div style={{ marginTop: '10px' }}><Bar width="40%" height="24px" borderRadius="8px" /></div>
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="glass-card glass-card-static" style={{ padding: '0' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
          <motion.div {...shimmer()} style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(0,0,0,0.06)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Bar width="55%" height="13px" />
            <div style={{ marginTop: '6px' }}><Bar width="30%" height="10px" /></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="glass-card glass-card-static" style={{ padding: '0' }}>
      {/* Header row */}
      <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Bar width="80px" height="12px" />
        <Bar width="120px" height="12px" />
        <Bar width="100px" height="12px" />
        <Bar width="60px" height="12px" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '16px', padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
          <Bar width="80px" height="13px" />
          <Bar width="120px" height="13px" />
          <Bar width="100px" height="13px" />
          <Bar width="60px" height="13px" />
        </div>
      ))}
    </div>
  )
}
