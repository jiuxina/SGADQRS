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
import DigitRoller from '../components/DigitRoller'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import {
  mockCompetitions,
  mockCompetitionTeams,
  mockUsers,
  mockLogs,
  mockWarnings,
} from '../data/mockData'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const pendingCompetitions = mockCompetitions.filter((c) => c.status === 'pending').length
  const highWarnings = mockWarnings.filter((w) => w.severity === 'high')
  const recentLogs = [...mockLogs].sort((a, b) => (b.time > a.time ? 1 : -1)).slice(0, 5)

  const statusGroups = [
    { label: '已发布', count: mockCompetitions.filter((c) => c.status === 'published').length, color: 'var(--accent)' },
    { label: '进行中', count: mockCompetitions.filter((c) => c.status === 'ongoing').length, color: 'var(--success)' },
    { label: '已结束', count: mockCompetitions.filter((c) => c.status === 'ended').length, color: 'var(--gray-3)' },
    { label: '草稿', count: mockCompetitions.filter((c) => c.status === 'draft').length, color: 'var(--warning)' },
    { label: '已驳回', count: mockCompetitions.filter((c) => c.status === 'rejected').length, color: 'var(--danger)' },
  ].filter((g) => g.count > 0)

  const maxStatusCount = Math.max(...statusGroups.map((g) => g.count), 1)

  const upcomingDeadlines = [...mockCompetitions]
    .filter((c) => c.status === 'published' || c.status === 'ongoing')
    .sort((a, b) => (a.registrationEnd > b.registrationEnd ? 1 : -1))
    .slice(0, 3)

  const quickActions = [
    { icon: ClipboardCheck, label: '审核竞赛', desc: '处理待审核竞赛发布', path: '/admin/competitions' },
    { icon: Users, label: '用户管理', desc: '管理系统用户账号', path: '/admin/users' },
    { icon: BarChart3, label: '数据统计', desc: '查看竞赛数据分析', path: '/admin/stats' },
    { icon: Settings, label: '系统设置', desc: '修改系统配置参数', path: '/admin/settings' },
  ]

  return (
    <>
      {/* Top Metric Cards Row */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: '竞赛总数', value: mockCompetitions.length, footer: '全部竞赛项目' },
          { label: '参赛队伍', value: mockCompetitionTeams.length, footer: '已组建参赛队伍' },
          { label: '注册用户', value: mockUsers.length, footer: '系统注册用户数' },
          { label: '待审核竞赛', value: pendingCompetitions, footer: '等待审核发布' },
          { label: '系统预警', value: highWarnings.length, footer: '高风险预警项' },
        ].map((item) => (
          <motion.div key={item.label} className="metric-card" style={{ padding: '16px' }} variants={staggerItem}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
            <div className="metric-card-value">
              <DigitRoller value={item.value} />
            </div>
            <div className="metric-card-footer">{item.footer}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Recent Activity (last 5 logs) */}
          <motion.div
            className="glass-card glass-card-vertical glass-card-static"
            style={{ padding: '0' }}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
          >
            <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>最近操作日志</span>
              <button className="text-btn blue" style={{ fontSize: '12px' }} onClick={() => navigate('/admin/logs')}>
                查看全部
              </button>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {recentLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  variants={staggerItem}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    borderBottom: i < recentLogs.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: log.status === 'success' ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: log.status === 'success' ? 'var(--success)' : 'var(--danger)',
                      flexShrink: 0,
                    }}
                  >
                    {log.username.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {log.username}
                      <span style={{ fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        {log.operation}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                      {log.time} · {log.method} · {log.spendTime}ms
                    </div>
                  </div>
                  <span
                    className={`glass-badge ${log.status === 'success' ? 'pass' : 'fail'}`}
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    {log.status === 'success' ? '成功' : '失败'}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Competition Status Overview */}
          <motion.div
            className="glass-card glass-card-vertical glass-card-static"
            style={{ padding: '0' }}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <div style={{ padding: '16px 18px 12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>竞赛状态分布</span>
              <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                共{mockCompetitions.length}项
              </span>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {statusGroups.map((row, i) => (
                <motion.div
                  key={row.label}
                  variants={staggerItem}
                  style={{
                    padding: '12px 18px',
                    borderBottom: i < statusGroups.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {row.label}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {row.count}项 · {Math.round((row.count / mockCompetitions.length) * 100)}%
                    </span>
                  </div>
                  <div className="glass-progress" style={{ height: '4px' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 'inherit',
                        width: `${(row.count / maxStatusCount) * 100}%`,
                        background: row.color,
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Upcoming Deadlines */}
          <motion.div
            className="glass-card glass-card-vertical glass-card-static"
            style={{ padding: '0' }}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
          >
            <div style={{ padding: '16px 18px 12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>报名截止日期</span>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {upcomingDeadlines.map((c, i) => {
                const deadline = new Date(c.registrationEnd)
                const now = new Date()
                const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                const urgent = daysLeft <= 14
                return (
                  <motion.div
                    key={c.id}
                    variants={staggerItem}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 18px',
                      borderBottom: i < upcomingDeadlines.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        截止：{c.registrationEnd} · 还剩{daysLeft}天
                      </div>
                    </div>
                    {urgent && <span className="severity-badge high">即将截止</span>}
                    {!urgent && <span className="severity-badge low">{daysLeft}天</span>}
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="glass-card glass-card-vertical glass-card-static"
            style={{ padding: '0' }}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <div style={{ padding: '16px 18px 12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>快捷操作</span>
            </div>
            {quickActions.map((action, i, arr) => (
              <div
                key={action.label}
                onClick={() => navigate(action.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 18px',
                  cursor: 'pointer',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <action.icon size={16} color="var(--gray-1)" strokeWidth={1.5} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{action.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{action.desc}</div>
                </div>
                <ArrowUpRight size={14} color="var(--gray-3)" />
              </div>
            ))}
          </motion.div>

          {/* Warning Summary (high severity) */}
          <motion.div
            className="glass-card glass-card-vertical glass-card-static"
            style={{ padding: '0' }}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15 }}
          >
            <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                <AlertTriangle size={14} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--danger)' }} />
                高风险预警
                <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                  {highWarnings.length}条
                </span>
              </span>
            </div>
            {highWarnings.length === 0 ? (
              <div style={{ padding: '20px 18px', textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                暂无高风险预警
              </div>
            ) : (
              highWarnings.map((warning, i) => (
                <div
                  key={warning.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    borderBottom: i < highWarnings.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {warning.teamName}
                      </span>
                      <span className="severity-badge high">高</span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-tertiary)',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {warning.message}
                    </div>
                  </div>
                  <ArrowUpRight size={14} color="var(--text-tertiary)" />
                </div>
              ))
            )}
          </motion.div>
        </div>
      </div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
