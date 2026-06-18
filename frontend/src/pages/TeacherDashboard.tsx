import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Trophy, Users, FileText, Clock, ArrowUpRight } from 'lucide-react'
import { staggerContainer, staggerItem } from '../motion/variants'
import { competitionApi } from '../api'
import { useAuthStore } from '../store/authStore'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [competitions, setCompetitions] = useState<Array<{ id: number; competitionName: string; registrationCount: number; status: number }>>([])

  useEffect(() => {
    if (!user) return
    competitionApi.dashboard().then(setStats as any).catch(console.error)
    competitionApi.list({ current: 1, size: 5, publisherId: user.id })
      .then((res) => setCompetitions(res.records))
      .catch(console.error)
  }, [user])

  const quickActions = [
    { icon: Trophy, label: '竞赛管理', path: '/teacher/competitions' },
    { icon: Users, label: '团队管理', path: '/teacher/teams' },
    { icon: FileText, label: '成绩录入', path: '/teacher/grades' },
    { icon: Clock, label: '消息通知', path: '/teacher/messages' },
  ]

  return (
    <>
      <motion.div className="bento-grid" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div className="bento-card bento-lg" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label">赛事概览</div>
          <div className="bento-value">{(stats?.myCompetitions as number) || 0}</div>
          <div className="bento-sub">我发布的竞赛</div>
          <div className="bento-dots" style={{ marginTop: '16px', gap: '10px' }}>
            <div className="bento-dot-row" style={{ gap: '8px' }}>
              <span className="bento-dot" style={{ background: 'var(--accent)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>总报名 {(stats?.totalRegistrations as number) || 0}</span>
            </div>
            <div className="bento-dot-row" style={{ gap: '8px' }}>
              <span className="bento-dot" style={{ background: 'var(--warning)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>待审核 {(stats?.pendingAudit as number) || 0}</span>
            </div>
          </div>
        </motion.div>

        <motion.div className="bento-card bento-wide" variants={staggerItem}>
          <div className="bento-label">最近竞赛</div>
          <div className="bento-timeline" style={{ marginTop: '10px' }}>
            {competitions.map((c) => (
              <div key={c.id} className="bento-timeline-item">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{c.competitionName}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.registrationCount} 人报名</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">快捷入口</div>
          {quickActions.map((action) => (
            <div key={action.label} className="bento-action" onClick={() => navigate(action.path)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
              <action.icon size={14} color="var(--text-secondary)" strokeWidth={1.5} />
              <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-primary)' }}>{action.label}</span>
              <ArrowUpRight size={12} color="var(--text-tertiary)" />
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
