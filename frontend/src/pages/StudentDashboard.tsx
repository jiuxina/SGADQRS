import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Trophy, Clock, Medal, Users, Image as ImageIcon } from 'lucide-react'
import { staggerContainer, staggerItem } from '../motion/variants'
import QuickActions from '../components/QuickActions'
import UpcomingReminders from '../components/UpcomingReminders'
import RoleHero from '../components/RoleHero'
import { DashboardSkeleton, ListSkeleton } from '../components/PageSkeleton'
import { competitionApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { resolveCoverUrl, formatDate } from '../utils/format'
import { useIsMobile } from '../hooks/useIsMobile'
import type { CompetitionItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/toastUtils'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])

  useEffect(() => {
    if (!user) return
    Promise.all([
      competitionApi.dashboard().then((res) => setStats(res as Record<string, unknown>)).catch((e) => { toast.error('加载仪表盘数据失败'); console.error(e) }),
      competitionApi.list({ current: 1, size: PAGE_SIZE.DASHBOARD_PREVIEW, status: 2 })
        .then((res) => setCompetitions(res.records))
        .catch((e) => { toast.error('加载竞赛列表失败'); console.error(e) }),
    ]).finally(() => setLoading(false))
  }, [user])

  const quickActions = [
    { icon: Trophy, label: '竞赛浏览', path: '/student/competitions' },
    { icon: Users, label: '我的队伍', path: '/student/teams' },
    { icon: Medal, label: '成绩查询', path: '/student/history?tab=transcript' },
    { icon: Clock, label: '消息通知', path: '/student/notifications' },
  ]

  return (
    <>
      <RoleHero />
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <DashboardSkeleton />
          <ListSkeleton />
        </div>
      ) : (
      <>
      <motion.div className="bento-grid" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div className="bento-card bento-lg" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label">竞赛总览</div>
          <div className="bento-sub" style={{ marginBottom: '12px' }}>
            可报名 {(stats?.availableCompetitions as number) || 0} 项 · 已参赛 {(stats?.myRegistrations as number) || 0} 项
          </div>
          <div className="bento-dots" style={{ flex: 1, gap: '10px' }}>
            {competitions.map((c) => (
              <div
                key={c.id}
                className="bento-dot-row"
                title="查看竞赛详情"
                onClick={() => navigate(`/student/competitions/${c.id}`)}
                style={{ gap: '8px', cursor: 'pointer', borderRadius: '8px', padding: '2px 6px', margin: '0 -6px' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,122,255,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.competitionName}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{c.registrationCount}人</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 时间节点提醒 */}
        <UpcomingReminders />

        <motion.div className="bento-card bento-wide" variants={staggerItem}>
          <div className="bento-label">快捷入口</div>
          <div style={{ marginTop: '10px' }}>
            <QuickActions items={quickActions} layout="grid" />
          </div>
        </motion.div>
      </motion.div>

      {/* 报名中竞赛 */}
      {competitions.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="section-title">报名中竞赛</h2>
            <button className="text-btn blue" style={{ fontSize: '12px' }} onClick={() => navigate('/student/competitions')}>
              查看全部 →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
            {competitions.slice(0, 4).map((c) => {
              const cover = resolveCoverUrl(c.coverImage)
              return (
                <div
                  key={c.id}
                  className="glass-card glass-card-vertical glass-card-static"
                  style={{ padding: '12px', gap: '8px', cursor: 'pointer' }}
                  onClick={() => navigate(`/student/competitions/${c.id}`)}
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={c.competitionName}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '10px' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%', aspectRatio: '16/9', borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.10) 50%, rgba(236,72,153,0.08) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <ImageIcon size={24} strokeWidth={1.2} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.4,
                      overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '36px',
                    }}
                  >
                    {c.competitionName}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    <span>报名至 {formatDate(c.registrationEnd)}</span>
                    <span>{c.registrationCount} 人</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      </>
      )}
    </>
  )
}
