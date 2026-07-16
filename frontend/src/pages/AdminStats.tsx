import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ListSkeleton } from '../components/PageSkeleton'
import { instant, fadeSlideUp } from '../motion/variants'
import { statsApi } from '../api'
import { useIsMobile } from '../hooks/useIsMobile'
import type { EnrollmentTrend, CollegeStat, CompetitionRanking } from '../api/types'

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function AdminStats() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    statsApi.admin().then((data) => setStats(data as Record<string, unknown>)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <ListSkeleton />

  const awardDistribution = (stats?.awardDistribution as Record<string, number>) || {}
  const enrollmentTrends = (stats?.enrollmentTrends as EnrollmentTrend[]) || []
  const collegeStats = (stats?.collegeStats as CollegeStat[]) || []
  const competitionRankings = (stats?.competitionRankings as CompetitionRanking[]) || []

  const maxTrendCount = Math.max(...enrollmentTrends.map(t => t.count), 1)
  const totalCollegeCount = collegeStats.reduce((sum, c) => sum + c.count, 0)
  const maxRankingCount = Math.max(...competitionRankings.map(r => r.count), 1)

  return (
    <>
      {/* 指标卡片 */}
      <motion.div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}
        variants={instant} initial="hidden" animate="visible">
        {[
          { label: '总用户', value: (stats?.totalUsers as number) || 0 },
          { label: '总竞赛', value: (stats?.totalCompetitions as number) || 0 },
          { label: '已发布', value: (stats?.publishedCompetitions as number) || 0 },
          { label: '进行中', value: (stats?.ongoingCompetitions as number) || 0 },
          { label: '总报名', value: (stats?.totalRegistrations as number) || 0 },
          { label: '学生数', value: (stats?.totalStudents as number) || 0 },
          { label: '教师数', value: (stats?.totalTeachers as number) || 0 },
          { label: '获奖数', value: Object.values(awardDistribution).reduce((s, v) => s + v, 0) },
        ].map((item) => (
          <div key={item.label} className="metric-card" style={{ padding: '16px' }}>
            <div style={{ marginBottom: '10px' }}><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span></div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{item.value}</div>
          </div>
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* 报名趋势折线图 */}
        <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '20px' }}
          variants={fadeSlideUp} initial="hidden" animate="visible">
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>报名趋势（近6个月）</div>
          <div style={{ position: 'relative', height: '180px', paddingLeft: '32px', paddingBottom: '28px' }}>
            {/* Y轴标签 */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>{maxTrendCount}</span>
              <span>{Math.round(maxTrendCount / 2)}</span>
              <span>0</span>
            </div>
            {/* 网格线 */}
            <div style={{ position: 'absolute', left: '32px', right: 0, top: 0, bottom: '28px' }}>
              {[0, 0.5, 1].map(ratio => (
                <div key={ratio} style={{ position: 'absolute', left: 0, right: 0, top: `${(1 - ratio) * 100}%`, borderTop: '1px dashed rgba(0,0,0,0.08)' }} />
              ))}
            </div>
            {/* 折线区域 */}
            <div style={{ position: 'absolute', left: '32px', right: 0, top: 0, bottom: '28px', display: 'flex', alignItems: 'flex-end' }}>
              {enrollmentTrends.map((trend, i) => {
                const heightPct = maxTrendCount > 0 ? (trend.count / maxTrendCount) * 100 : 0
                return (
                  <div key={trend.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {/* 数据点 */}
                    <div style={{ position: 'absolute', bottom: `${heightPct}%`, width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary, #6366f1)', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', zIndex: 1 }} />
                    {/* 连接线 */}
                    {i < enrollmentTrends.length - 1 && (
                      <div style={{ position: 'absolute', bottom: `${heightPct}%`, left: '50%', right: '-50%', height: '2px', background: 'var(--primary, #6366f1)', opacity: 0.4, transformOrigin: 'left center' }} />
                    )}
                    {/* 柱形 */}
                    <div style={{ width: '60%', height: `${heightPct}%`, background: 'linear-gradient(to top, var(--primary, #6366f1), rgba(99,102,241,0.2))', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                  </div>
                )
              })}
            </div>
            {/* X轴标签 */}
            <div style={{ position: 'absolute', left: '32px', right: 0, bottom: 0, display: 'flex' }}>
              {enrollmentTrends.map(trend => (
                <div key={trend.month} style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {trend.month.slice(5)}月
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 院系统计饼图 */}
        <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '20px' }}
          variants={fadeSlideUp} initial="hidden" animate="visible">
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>院系报名分布</div>
          {collegeStats.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              {/* 饼图 */}
              <div style={{
                width: '160px', height: '160px', borderRadius: '50%', flexShrink: 0,
                background: `conic-gradient(${collegeStats.map((_, i) => {
                  const startPct = collegeStats.slice(0, i).reduce((s, c) => s + (c.count / totalCollegeCount) * 100, 0)
                  const endPct = startPct + (collegeStats[i].count / totalCollegeCount) * 100
                  return `${PIE_COLORS[i % PIE_COLORS.length]} ${startPct}% ${endPct}%`
                }).join(', ')})`,
                boxShadow: 'inset 0 0 0 30px white'
              }} />
              {/* 图例 */}
              <div style={{ flex: 1, minWidth: '120px' }}>
                {collegeStats.slice(0, 6).map((college, i) => (
                  <div key={college.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{college.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{college.count}</span>
                  </div>
                ))}
                {collegeStats.length > 6 && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>+{collegeStats.length - 6}个院系</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>暂无数据</div>
          )}
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
        {/* 竞赛热度排行 */}
        <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '20px' }}
          variants={fadeSlideUp} initial="hidden" animate="visible">
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>竞赛热度排行</div>
          {competitionRankings.length > 0 ? (
            competitionRankings.map((comp, i) => (
              <div key={comp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{
                  width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '700', flexShrink: 0,
                  background: i < 3 ? ['#f59e0b', '#94a3b8', '#cd7f32'][i] : 'rgba(0,0,0,0.06)',
                  color: i < 3 ? 'white' : 'var(--text-secondary)'
                }}>{i + 1}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comp.name}</span>
                <div style={{ width: '80px', height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: 'var(--primary, #6366f1)', width: `${(comp.count / maxRankingCount) * 100}%` }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', width: 32, textAlign: 'right' }}>{comp.count}人</span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>暂无数据</div>
          )}
        </motion.div>

        {/* 获奖分布 */}
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
