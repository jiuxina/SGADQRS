import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  ClipboardCheck,
  Users,
  BarChart3,
  Settings,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { DashboardSkeleton } from '../components/PageSkeleton'
import QuickActions from '../components/QuickActions'
import { staggerContainer, staggerItem } from '../motion/variants'
import { competitionApi, statsApi, logApi } from '../api'
import type { CompetitionItem, LogItem, UpcomingDeadline, UpcomingStart } from '../api/types'
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

export default function AdminDashboard() {
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [logs, setLogs] = useState<LogItem[]>([])
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([])
  const [upcomingStarts, setUpcomingStarts] = useState<UpcomingStart[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      competitionApi.list({ current: 1, size: PAGE_SIZE.LARGE }),
      logApi.list({ current: 1, size: PAGE_SIZE.DASHBOARD_PREVIEW }),
      statsApi.admin(),
      statsApi.upcoming(),
    ]).then(([compResult, logResult, statsResult, upcomingResult]) => {
      setCompetitions(compResult.records)
      setLogs(logResult.records)
      setStats(statsResult as Record<string, unknown>)
      const upcoming = upcomingResult as { upcomingDeadlines: UpcomingDeadline[]; upcomingStarts: UpcomingStart[] }
      setUpcomingDeadlines(upcoming.upcomingDeadlines)
      setUpcomingStarts(upcoming.upcomingStarts)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const total = competitions.length
  const statusGroups = [
    { label: '已发布', count: competitions.filter((c) => c.status === 2).length, color: 'var(--accent)' },
    { label: '进行中', count: competitions.filter((c) => c.status === 3).length, color: 'var(--success)' },
    { label: '已结束', count: competitions.filter((c) => c.status === 4).length, color: 'var(--gray-3)' },
    { label: '草稿', count: competitions.filter((c) => c.status === 0).length, color: 'var(--warning)' },
    { label: '已驳回', count: competitions.filter((c) => c.status === 5).length, color: 'var(--danger)' },
  ].filter((g) => g.count > 0)
  const maxCount = Math.max(...statusGroups.map((g) => g.count), 1)

  const recentLogs = logs.slice(0, 5)
  const pendingList = competitions.filter((c) => c.status === 1)
  const totalUsers = (stats?.totalUsers as number) || 0
  const activeUsers = (stats?.totalStudents as number) || 0
  const disabledUsers = (stats?.disabledUsers as number) || 0

  const quickActions = [
    { icon: ClipboardCheck, label: '审核竞赛', path: '/admin/competitions' },
    { icon: Users, label: '用户管理', path: '/admin/users' },
    { icon: BarChart3, label: '数据统计', path: '/admin/stats' },
    { icon: Settings, label: '系统设置', path: '/admin/settings' },
  ]

  if (loading) return <DashboardSkeleton />

  return (
    <>
      <motion.div className="bento-grid" variants={staggerContainer} initial="hidden" animate="visible">
        {/* 竞赛状态分布 */}
        <motion.div className="bento-card bento-lg" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label">竞赛状态分布</div>
          <div className="bento-sub" style={{ marginBottom: '16px' }}>共 {total} 项竞赛</div>
          <div className="bento-bars" style={{ flex: 1, alignItems: 'flex-end', gap: '20px', paddingBottom: '4px' }}>
            {statusGroups.map((g) => (
              <div key={g.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>{g.count}</span>
                <div className="bento-bar" style={{ width: '100%', maxWidth: '44px', height: `${Math.max((g.count / maxCount) * 100, 8)}%`, background: g.color, borderRadius: '6px 6px 2px 2px' }} />
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{g.label}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>{total > 0 ? Math.round((g.count / total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 最近操作 */}
        <motion.div className="bento-card bento-wide" variants={staggerItem}>
          <div className="bento-label">最近操作</div>
          <div className="bento-timeline" style={{ marginTop: '10px' }}>
            {recentLogs.map((log) => (
              <div key={log.id} className="bento-timeline-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    <strong>{log.username || '-'}</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{log.operation}</span>
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '500', color: log.status === 1 ? 'var(--success)' : 'var(--danger)' }}>
                    {log.status === 1 ? '成功' : '失败'}
                  </span>
                </div>
                <div className="bento-sub" style={{ marginTop: '2px' }}>
                  {log.createTime} · {log.method || '-'} · {log.spendTime || 0}ms
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 待审核 */}
        <motion.div className="bento-card bento-tall" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label">待审核</div>
          <div className="bento-value" style={{ marginBottom: '10px' }}>{pendingList.length}</div>
          {pendingList.length === 0 ? (
            <div className="bento-sub">暂无待审核竞赛</div>
          ) : (
            <div className="bento-dots" style={{ flex: 1, gap: '10px' }}>
              {pendingList.map((c) => (
                <div key={c.id} className="bento-dot-row" style={{ gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.competitionName}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: '500', flexShrink: 0 }}>待审</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 注册用户 */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">注册用户</div>
          <div className="bento-value">{totalUsers}</div>
          <div className="bento-dots" style={{ marginTop: '10px', gap: '6px' }}>
            <div className="bento-dot-row" style={{ gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>活跃 {activeUsers}</span>
            </div>
            <div className="bento-dot-row" style={{ gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>禁用 {disabledUsers}</span>
            </div>
          </div>
        </motion.div>

        {/* 参赛队伍 */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">参赛队伍</div>
          <div className="bento-value">{(stats?.totalRegistrations as number) || 0}</div>
          <div className="bento-sub">已报名参赛队伍</div>
        </motion.div>

        {/* 系统预警 */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">系统预警</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <AlertTriangle size={18} color="var(--danger)" strokeWidth={1.5} />
            <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-1px' }}>{pendingList.length}</span>
          </div>
          <div className="bento-sub">待审核项</div>
        </motion.div>

        {/* 关键时间节点提醒 */}
        <motion.div className="bento-card bento-wide" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label"><Clock size={18} strokeWidth={1.5} /> 时间节点提醒</div>
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

        {/* 快捷入口 */}
        <motion.div className="bento-card" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label" style={{ marginBottom: '6px' }}>快捷入口</div>
          <QuickActions items={quickActions} />
        </motion.div>
      </motion.div>

    </>
  )
}
