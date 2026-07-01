import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Trophy, Clock, Medal, FileText, ArrowUpRight } from 'lucide-react'
import { staggerContainer, staggerItem } from '../motion/variants'
import { competitionApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])

  useEffect(() => {
    if (!user) return
    competitionApi.dashboard().then(setStats as any).catch(console.error)
    competitionApi.list({ current: 1, size: PAGE_SIZE.DASHBOARD_PREVIEW, status: 2 })
      .then((res) => setCompetitions(res.records))
      .catch(console.error)
  }, [user])

  const quickActions = [
    { icon: Trophy, label: '竞赛浏览', path: '/student/competitions' },
    { icon: FileText, label: '我的报名', path: '/student/registration' },
    { icon: Medal, label: '成绩查询', path: '/student/grades' },
    { icon: Clock, label: '消息通知', path: '/student/messages' },
  ]

  return (
    <>
      <motion.div className="bento-grid" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div className="bento-card bento-lg" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label">竞赛总览</div>
          <div className="bento-sub" style={{ marginBottom: '16px' }}>
            可报名 {(stats?.availableCompetitions as number) || 0} 项 · 已报名 {(stats?.myRegistrations as number) || 0} 项
          </div>
          <div className="bento-dots" style={{ flex: 1, gap: '10px' }}>
            {competitions.map((c) => (
              <div key={c.id} className="bento-dot-row" style={{ gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.competitionName}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{c.registrationCount}人</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">已报名</div>
          <div className="bento-value">{(stats?.myRegistrations as number) || 0}</div>
          <div className="bento-sub">我的报名数</div>
        </motion.div>

        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">可报名</div>
          <div className="bento-value">{(stats?.availableCompetitions as number) || 0}</div>
          <div className="bento-sub">当前可报名竞赛</div>
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
