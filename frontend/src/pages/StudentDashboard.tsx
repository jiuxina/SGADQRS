import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Trophy, Clock, Medal, FileText } from 'lucide-react'
import { staggerContainer, staggerItem } from '../motion/variants'
import QuickActions from '../components/QuickActions'
import { competitionApi, statsApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem, UpcomingDeadline, UpcomingStart } from '../api/types'
import { PAGE_SIZE } from '../config/constants'

function countdownText(dateStr: string): string {
  const now = new Date()
  const target = new Date(dateStr)
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return '已截止'
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `剩余 ${days} 天`
  if (hours > 0) return `剩余 ${hours} 小时`
  return '即将截止'
}

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([])
  const [upcomingStarts, setUpcomingStarts] = useState<UpcomingStart[]>([])

  useEffect(() => {
    if (!user) return
    competitionApi.dashboard().then((res) => setStats(res as Record<string, unknown>)).catch(console.error)
    competitionApi.list({ current: 1, size: PAGE_SIZE.DASHBOARD_PREVIEW, status: 2 })
      .then((res) => setCompetitions(res.records))
      .catch(console.error)
    statsApi.upcoming().then((res) => {
      const data = res as { upcomingDeadlines: UpcomingDeadline[]; upcomingStarts: UpcomingStart[] }
      setUpcomingDeadlines(data.upcomingDeadlines)
      setUpcomingStarts(data.upcomingStarts)
    }).catch(console.error)
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

        {/* 时间节点提醒 */}
        <motion.div className="bento-card bento-wide" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label"><Clock size={16} /> 时间节点提醒</div>
          <div style={{ marginTop: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
            {upcomingDeadlines.length === 0 && upcomingStarts.length === 0 ? (
              <div className="bento-sub">暂无近期重要节点</div>
            ) : (
              <>
                {upcomingDeadlines.slice(0, 4).map((item) => (
                  <div key={`dl-${item.id}-${item.deadlineType}`} className="bento-timeline-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.competitionName}</span>
                      <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{item.deadlineType} · {countdownText(item.deadlineTime)}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--danger)', flexShrink: 0 }}>
                      {new Date(item.deadlineTime).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))}
                {upcomingStarts.slice(0, 3).map((item) => (
                  <div key={`st-${item.id}`} className="bento-timeline-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.competitionName}</span>
                      <span style={{ fontSize: '11px', color: 'var(--success)' }}>即将开始 · {countdownText(item.startTime)}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--success)', flexShrink: 0 }}>
                      {new Date(item.startTime).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </motion.div>

        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">快捷入口</div>
          <QuickActions items={quickActions} />
        </motion.div>
      </motion.div>

    </>
  )
}
