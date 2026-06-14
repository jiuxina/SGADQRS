import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ClipboardCheck,
  Users,
  BarChart3,
  Settings,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import {
  mockCompetitions,
  mockCompetitionTeams,
  mockUsers,
  mockLogs,
  mockWarnings,
  mockCategories,
} from '../data/mockData'

export default function AdminDashboard() {
  const navigate = useNavigate()

  // ── Derived data ──────────────────────────────────

  const total = mockCompetitions.length
  const statusGroups = [
    { label: '已发布', count: mockCompetitions.filter((c) => c.status === 'published').length, color: 'var(--accent)' },
    { label: '进行中', count: mockCompetitions.filter((c) => c.status === 'ongoing').length, color: 'var(--success)' },
    { label: '已结束', count: mockCompetitions.filter((c) => c.status === 'ended').length, color: 'var(--gray-3)' },
    { label: '草稿', count: mockCompetitions.filter((c) => c.status === 'draft').length, color: 'var(--warning)' },
    { label: '已驳回', count: mockCompetitions.filter((c) => c.status === 'rejected').length, color: 'var(--danger)' },
  ].filter((g) => g.count > 0)
  const maxCount = Math.max(...statusGroups.map((g) => g.count), 1)

  const recentLogs = [...mockLogs].sort((a, b) => (b.time > a.time ? 1 : -1)).slice(0, 5)

  const pendingList = mockCompetitions.filter((c) => c.status === 'pending')

  const activeUsers = mockUsers.filter((u) => u.status === 'active').length
  const disabledUsers = mockUsers.filter((u) => u.status === 'disabled').length

  const highCount = mockWarnings.filter((w) => w.severity === 'high').length

  const quickActions = [
    { icon: ClipboardCheck, label: '审核竞赛', path: '/admin/competitions' },
    { icon: Users, label: '用户管理', path: '/admin/users' },
    { icon: BarChart3, label: '数据统计', path: '/admin/stats' },
    { icon: Settings, label: '系统设置', path: '/admin/settings' },
  ]

  // ── Render ────────────────────────────────────────

  return (
    <>
      <motion.div
        className="bento-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* ── 1. Featured 2×2 — 竞赛状态分布 ──────── */}
        <motion.div
          className="bento-card bento-lg"
          variants={staggerItem}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div className="bento-label">竞赛状态分布</div>
          <div className="bento-sub" style={{ marginBottom: '16px' }}>
            共 {total} 项竞赛 · {mockCategories.length} 个类别
          </div>

          <div
            className="bento-bars"
            style={{
              flex: 1,
              alignItems: 'flex-end',
              gap: '20px',
              paddingBottom: '4px',
            }}
          >
            {statusGroups.map((g) => (
              <div
                key={g.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  flex: 1,
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {g.count}
                </span>
                <div
                  className="bento-bar"
                  style={{
                    width: '100%',
                    maxWidth: '44px',
                    height: `${Math.max((g.count / maxCount) * 100, 8)}%`,
                    background: g.color,
                    borderRadius: '6px 6px 2px 2px',
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  {g.label}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                  {Math.round((g.count / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 2. Wide 2×1 — 最近操作 ──────────────── */}
        <motion.div className="bento-card bento-wide" variants={staggerItem}>
          <div className="bento-label">最近操作</div>
          <div className="bento-timeline" style={{ marginTop: '10px' }}>
            {recentLogs.map((log) => (
              <div key={log.id} className="bento-timeline-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    <strong>{log.username}</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{log.operation}</span>
                  </span>
                  <span
                    className={`bento-num ${log.status === 'success' ? 'success' : 'danger'}`}
                    style={{ fontSize: '10px' }}
                  >
                    {log.status === 'success' ? '成功' : '失败'}
                  </span>
                </div>
                <div className="bento-sub" style={{ marginTop: '2px' }}>
                  {log.time} · {log.method} · {log.spendTime}ms
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 3. Tall 1×2 — 待审核 ────────────────── */}
        <motion.div
          className="bento-card bento-tall"
          variants={staggerItem}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div className="bento-label">待审核</div>
          <div className="bento-value" style={{ marginBottom: '10px' }}>
            {pendingList.length}
          </div>

          {pendingList.length === 0 ? (
            <div className="bento-sub">暂无待审核竞赛</div>
          ) : (
            <div className="bento-dots" style={{ flex: 1, gap: '10px' }}>
              {pendingList.map((c) => (
                <div key={c.id} className="bento-dot-row" style={{ gap: '8px' }}>
                  <span className="bento-dot" style={{ background: 'var(--warning)' }} />
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.name}
                  </span>
                  <span className="bento-num warn" style={{ fontSize: '10px', flexShrink: 0 }}>
                    待审
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── 4. 1×1 — 注册用户 ───────────────────── */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">注册用户</div>
          <div className="bento-value">{mockUsers.length}</div>
          <div className="bento-dots" style={{ marginTop: '10px', gap: '6px' }}>
            <div className="bento-dot-row" style={{ gap: '6px' }}>
              <span className="bento-dot" style={{ background: 'var(--success)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                活跃 {activeUsers}
              </span>
            </div>
            <div className="bento-dot-row" style={{ gap: '6px' }}>
              <span className="bento-dot" style={{ background: 'var(--gray-3)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                禁用 {disabledUsers}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── 5. 1×1 — 参赛队伍 ───────────────────── */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">参赛队伍</div>
          <div className="bento-value">{mockCompetitionTeams.length}</div>
          <div className="bento-sub">已组建参赛队伍</div>
        </motion.div>

        {/* ── 6. 1×1 — 系统预警 ───────────────────── */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">系统预警</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <AlertTriangle size={18} color="var(--danger)" strokeWidth={1.5} />
            <span className="bento-num danger">{highCount}</span>
          </div>
          <div className="bento-sub">高风险预警项</div>
        </motion.div>

        {/* ── 7. 1×1 — 快捷入口 ───────────────────── */}
        <motion.div
          className="bento-card"
          variants={staggerItem}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div className="bento-label" style={{ marginBottom: '6px' }}>快捷入口</div>
          {quickActions.map((action) => (
            <div
              key={action.label}
              className="bento-action"
              onClick={() => navigate(action.path)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}
            >
              <action.icon size={14} color="var(--text-secondary)" strokeWidth={1.5} />
              <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-primary)' }}>
                {action.label}
              </span>
              <ArrowUpRight size={12} color="var(--text-tertiary)" />
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
