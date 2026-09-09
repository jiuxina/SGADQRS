import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ClipboardCheck,
  Users,
  BarChart3,
} from 'lucide-react'
import { DashboardSkeleton } from '../components/PageSkeleton'
import QuickActions from '../components/QuickActions'
import UpcomingReminders from '../components/UpcomingReminders'
import RoleHero from '../components/RoleHero'
import { staggerContainer, staggerItem } from '../motion/variants'
import { statsApi, registrationApi } from '../api'
import type { TeamItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/toastUtils'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [pendingTeams, setPendingTeams] = useState<TeamItem[]>([])
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsApi.admin(),
      registrationApi.teamList({ current: 1, size: PAGE_SIZE.LARGE, status: 1 }),
    ]).then(([statsResult, teamResult]) => {
      setStats(statsResult as Record<string, unknown>)
      setPendingTeams(teamResult.records)
    }).catch((e) => { toast.error('加载仪表盘数据失败'); console.error(e) }).finally(() => setLoading(false))
  }, [])

  const statusGroups = (() => {
    const byStatus = (stats?.competitionByStatus as Record<string, number>) || {}
    return [
      { label: '已发布', count: byStatus['2'] ?? 0, color: 'var(--accent)' },
      { label: '进行中', count: byStatus['3'] ?? 0, color: 'var(--success)' },
      { label: '已结束', count: byStatus['4'] ?? 0, color: 'var(--gray-3)' },
      { label: '草稿', count: byStatus['0'] ?? 0, color: 'var(--warning)' },
      { label: '已驳回', count: byStatus['5'] ?? 0, color: 'var(--gray-3)' },
    ].filter((g) => g.count > 0)
  })()
  const total = Object.values((stats?.competitionByStatus as Record<string, number>) || {}).reduce((a, b) => a + b, 0)
  const maxCount = Math.max(...statusGroups.map((g) => g.count), 1)

  const pendingList = pendingTeams
  const totalUsers = (stats?.totalUsers as number) || 0
  const activeUsers = (stats?.totalStudents as number) || 0
  const disabledUsers = (stats?.disabledUsers as number) || 0

  const quickActions = [
    { icon: ClipboardCheck, label: '竞赛管理', path: '/admin/competitions' },
    { icon: Users, label: '用户管理', path: '/admin/users' },
    { icon: BarChart3, label: '数据统计', path: '/admin/stats' },
  ]

  if (loading) return <DashboardSkeleton />

  return (
    <>
      <RoleHero />
      <motion.div className="bento-grid" variants={staggerContainer} initial="hidden" animate="visible">
        {/* 竞赛状态分布 */}
        <motion.div className="bento-card bento-lg" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label">竞赛状态分布</div>
          <div className="bento-sub" style={{ marginBottom: '12px' }}>共 {total} 项竞赛</div>
          <div className="bento-bars" style={{ flex: 1, alignItems: 'flex-end', gap: '14px', paddingBottom: '4px' }}>
            {statusGroups.map((g) => (
              <div key={g.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{g.count}</span>
                <div className="bento-bar" style={{ width: '100%', maxWidth: '44px', height: `${Math.max((g.count / maxCount) * 100, 8)}%`, background: g.color, borderRadius: '6px 6px 2px 2px' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{g.label}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{total > 0 ? Math.round((g.count / total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 待审核队伍 */}
        <motion.div className="bento-card bento-tall" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label">待审核队伍</div>
          <div className="bento-value" style={{ marginBottom: '10px' }}>{pendingList.length}</div>
          {pendingList.length === 0 ? (
            <div className="bento-sub">暂无待审核队伍</div>
          ) : (
            <div className="bento-dots" style={{ flex: 1, gap: '10px' }}>
              {pendingList.map((t) => (
                <div key={t.id} className="bento-dot-row" style={{ gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/admin/competitions?tab=teams')}>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.teamName}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: '500', flexShrink: 0 }}>待审核</span>
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
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>活跃 {activeUsers}</span>
            </div>
            <div className="bento-dot-row" style={{ gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>禁用 {disabledUsers}</span>
            </div>
          </div>
        </motion.div>

        {/* 参赛队伍 */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">参赛队伍</div>
          <div className="bento-value">{(stats?.totalRegistrations as number) || 0}</div>
          <div className="bento-sub">已报名参赛队伍</div>
        </motion.div>

        {/* 关键时间节点提醒 */}
        <UpcomingReminders />

        {/* 快捷入口 */}
        <motion.div className="bento-card" variants={staggerItem} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-label" style={{ marginBottom: '6px' }}>快捷入口</div>
          <QuickActions items={quickActions} />
        </motion.div>
      </motion.div>

    </>
  )
}
