import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  ClipboardCheck,
  Users,
  BarChart3,
  Settings,
  AlertTriangle,
} from 'lucide-react'
import { DashboardSkeleton } from '../components/PageSkeleton'
import QuickActions from '../components/QuickActions'
import { staggerContainer, staggerItem } from '../motion/variants'
import { competitionApi, statsApi, logApi } from '../api'
import type { CompetitionItem, LogItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'

export default function AdminDashboard() {
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [logs, setLogs] = useState<LogItem[]>([])
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      competitionApi.list({ current: 1, size: PAGE_SIZE.LARGE }),
      logApi.list({ current: 1, size: PAGE_SIZE.DASHBOARD_PREVIEW }),
      statsApi.admin(),
    ]).then(([compResult, logResult, statsResult]) => {
      setCompetitions(compResult.records)
      setLogs(logResult.records)
      setStats(statsResult as Record<string, unknown>)
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
  const disabledUsers = 0

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

        {/* 快捷入口 */}
        <motion.div className="bento-card" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label" style={{ marginBottom: '6px' }}>快捷入口</div>
          <QuickActions items={quickActions} />
        </motion.div>
      </motion.div>

    </>
  )
}
