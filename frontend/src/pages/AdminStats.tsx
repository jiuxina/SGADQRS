import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ListSkeleton } from '../components/PageSkeleton'
import { instant, fadeSlideUp } from '../motion/variants'
import { statsApi } from '../api'
import { useIsMobile } from '../hooks/useIsMobile'

export default function AdminStats() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    statsApi.admin().then((data) => setStats(data as Record<string, unknown>)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <ListSkeleton />

  const awardDistribution = (stats?.awardDistribution as Record<string, number>) || {}

  return (
    <>
      <motion.div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}
        variants={instant} initial="hidden" animate="visible">
        {[
          { label: '总用户', value: (stats?.totalUsers as number) || 0 },
          { label: '总竞赛', value: (stats?.totalCompetitions as number) || 0 },
          { label: '总报名', value: (stats?.totalRegistrations as number) || 0 },
          { label: '进行中', value: (stats?.ongoingCompetitions as number) || 0 },
        ].map((item) => (
          <div key={item.label} className="metric-card" style={{ padding: '16px' }}>
            <div style={{ marginBottom: '10px' }}><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span></div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{item.value}</div>
          </div>
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '20px' }}
          variants={fadeSlideUp} initial="hidden" animate="visible">
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>获奖分布</div>
          {Object.entries(awardDistribution).map(([name, count]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{name}</span>
              <div style={{ flex: 2, height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: 'var(--success)', width: `${Math.min(Number(count) * 10, 100)}%` }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', width: 30, textAlign: 'right' }}>{String(count)}</span>
            </div>
          ))}
        </motion.div>
      </div>

    </>
  )
}
