import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Trophy, Users, FileText, Plus } from 'lucide-react'
import { staggerContainer, staggerItem } from '../motion/variants'
import { mockTeacherTeams, mockWarnings } from '../data/mockData'

export default function TeacherDashboard() {
  const navigate = useNavigate()

  const total = mockTeacherTeams.length
  const passCount = mockTeacherTeams.filter((t) => t.overallStatus === 'pass').length
  const failCount = mockTeacherTeams.filter((t) => t.overallStatus === 'fail').length
  const reviewingCount = mockTeacherTeams.filter((t) => t.overallStatus === 'reviewing').length
  const pendingCount = mockTeacherTeams.filter((t) => t.overallStatus === 'pending').length
  const avgScore = (mockTeacherTeams.reduce((s, t) => s + t.avgScore, 0) / total).toFixed(1)
  const highWarnings = mockWarnings.filter((w) => w.severity === 'high').length

  const teamsWithWarnings = mockTeacherTeams
    .filter((t) => t.warnings.length > 0)
    .map((t) => ({ name: t.teamName, count: t.warnings.length }))

  const statusBars = [
    { label: '已通过', count: passCount, color: 'var(--success, #34c759)' },
    { label: '未通过', count: failCount, color: 'var(--danger, #ff3b30)' },
    { label: '审查中', count: reviewingCount, color: 'var(--warning, #ff9500)' },
    { label: '待审核', count: pendingCount, color: 'var(--accent, #007aff)' },
  ]
  const maxBar = Math.max(...statusBars.map((b) => b.count), 1)

  const quickLinks = [
    { label: '竞赛管理', to: '/teacher/competitions', icon: Trophy },
    { label: '队伍管理', to: '/teacher/teams', icon: Users },
    { label: '成绩管理', to: '/teacher/grades', icon: FileText },
    { label: '创建竞赛', to: '/teacher/competitions/create', icon: Plus },
  ]

  return (
    <>
      <motion.div
        className="bento-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Featured — team status overview (2x2) */}
        <motion.div className="bento-card bento-lg" variants={staggerItem}>
          <div className="bento-label">队伍概览</div>
          <div className="bento-value">{total}</div>
          <div className="bento-sub">共 {total} 支参赛队伍</div>
          <div className="bento-bars" style={{ marginTop: '16px', gap: '12px' }}>
            {statusBars.map((bar) => (
              <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: '80px', alignItems: 'flex-end' }}>
                  <div
                    className="bento-bar"
                    style={{
                      height: `${Math.max((bar.count / maxBar) * 100, 8)}%`,
                      width: '28px',
                      background: bar.color,
                      borderRadius: '6px 6px 0 0',
                    }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{bar.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{bar.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Wide — teams needing attention (2x1) */}
        <motion.div className="bento-card bento-wide" variants={staggerItem}>
          <div className="bento-label">需关注队伍</div>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {teamsWithWarnings.map((tw) => (
              <div
                key={tw.name}
                className="bento-action"
                onClick={() => navigate('/teacher/teams')}
              >
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{tw.name}</span>
                <span className="bento-num warn">{tw.count} 项预警</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 1x1 — average score */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">平均评分</div>
          <div className="bento-value">{avgScore}</div>
          <div className="bento-sub">全部队伍均分</div>
        </motion.div>

        {/* 1x1 — pass count */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">已通过</div>
          <div className="bento-value" style={{ color: 'var(--success, #34c759)' }}>{passCount}</div>
          <div className="bento-sub">通过率 {Math.round((passCount / total) * 100)}%</div>
        </motion.div>

        {/* 1x1 — high risk warnings */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">高风险</div>
          <div className="bento-value" style={{ color: 'var(--danger, #ff3b30)' }}>{highWarnings}</div>
          <div className="bento-sub">高严重度预警</div>
        </motion.div>

        {/* Wide — quick actions (2x1) */}
        <motion.div className="bento-card bento-wide" variants={staggerItem}>
          <div className="bento-label">快捷操作</div>
          <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <div
                  key={link.to}
                  className="bento-action"
                  onClick={() => navigate(link.to)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={15} strokeWidth={1.8} style={{ color: 'var(--accent, #007aff)' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{link.label}</span>
                  </div>
                  <ArrowUpRight size={14} strokeWidth={1.8} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
