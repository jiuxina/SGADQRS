import { motion } from 'motion/react'
import DigitRoller from '../components/DigitRoller'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { mockCompetitions, mockResults, mockCompetitionTeams, mockCategories, mockUsers } from '../data/mockData'

const barColors = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#AF52DE', '#5AC8FA']

const awardLevels = [
  { key: 'special', label: '特等奖', color: '#FFD60A' },
  { key: 'first', label: '一等奖', color: '#FF9500' },
  { key: 'second', label: '二等奖', color: '#007AFF' },
  { key: 'third', label: '三等奖', color: '#34C759' },
  { key: 'excellence', label: '优秀奖', color: '#5AC8FA' },
]

export default function AdminStats() {
  const totalRegistered = mockCompetitions.reduce((sum, c) => sum + c.registeredCount, 0)
  const totalAwards = mockResults.filter((r) => r.awardLevel !== null).length
  const activeUsers = mockUsers.filter((u) => u.status === 'active').length

  // Category distribution: count competitions per category
  const categoryData = mockCategories
    .map((cat) => ({
      label: cat.name,
      count: mockCompetitions.filter((c) => c.categoryId === cat.id).length,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
  const maxCatCount = Math.max(...categoryData.map((d) => d.count), 1)

  // Department participation (synthetic aggregated view from teams + users)
  const deptParticipation = [
    { label: '计算机科学与技术学院', count: 3 },
    { label: '软件工程学院', count: 2 },
    { label: '信息安全学院', count: 2 },
    { label: '数据科学学院', count: 1 },
    { label: '电子工程学院', count: 1 },
    { label: '机械工程学院', count: 1 },
  ].sort((a, b) => b.count - a.count)
  const maxDeptCount = Math.max(...deptParticipation.map((d) => d.count), 1)

  // Monthly trend: registrations per month from competition registrationStart
  const monthMap: Record<string, number> = {}
  mockCompetitions.forEach((c) => {
    const month = c.registrationStart.slice(0, 7) // YYYY-MM
    monthMap[month] = (monthMap[month] || 0) + c.registeredCount
  })
  const monthLabels: Record<string, string> = {
    '2025-03': '3月', '2025-04': '4月', '2025-05': '5月',
    '2025-06': '6月', '2025-07': '7月', '2025-08': '8月',
    '2025-09': '9月', '2025-10': '10月',
  }
  const monthData = Object.entries(monthMap)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([key, count]) => ({ label: monthLabels[key] || key, count }))
  const maxMonthCount = Math.max(...monthData.map((d) => d.count), 1)

  // Award distribution
  const awardData = awardLevels.map((level) => ({
    ...level,
    count: mockResults.filter((r) => r.awardLevel === level.key).length,
  }))
  const maxAwardCount = Math.max(...awardData.map((d) => d.count), 1)

  const sectionStyle: React.CSSProperties = {
    padding: '20px',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '16px',
  }

  return (
    <>
      {/* Top Metrics Row */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: '竞赛总数', value: mockCompetitions.length, footer: '全部竞赛项目' },
          { label: '参赛总人数', value: totalRegistered, footer: '累计报名人次' },
          { label: '获奖总数', value: totalAwards, footer: '已公布获奖' },
          { label: '活跃用户数', value: activeUsers, footer: '状态正常用户' },
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

      {/* Two-column layout for charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>

        {/* Category Distribution */}
        <motion.div
          className="glass-card glass-card-vertical glass-card-static"
          style={sectionStyle}
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
        >
          <div style={sectionTitleStyle}>竞赛分类分布</div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {categoryData.map((item, i) => (
              <motion.div key={item.label} variants={staggerItem} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.count}项</span>
                </div>
                <div className="glass-progress" style={{ height: '8px' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 'inherit',
                      width: `${(item.count / maxCatCount) * 100}%`,
                      background: barColors[i % barColors.length],
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Department Participation */}
        <motion.div
          className="glass-card glass-card-vertical glass-card-static"
          style={sectionStyle}
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.05 }}
        >
          <div style={sectionTitleStyle}>院系参与度</div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {deptParticipation.map((item, i) => (
              <motion.div key={item.label} variants={staggerItem} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.count}队</span>
                </div>
                <div className="glass-progress" style={{ height: '8px' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 'inherit',
                      width: `${(item.count / maxDeptCount) * 100}%`,
                      background: barColors[(i + 2) % barColors.length],
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          className="glass-card glass-card-vertical glass-card-static"
          style={sectionStyle}
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <div style={sectionTitleStyle}>月度报名趋势</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px', paddingTop: '10px' }}>
            {monthData.map((item, i) => (
              <motion.div
                key={item.label}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
              >
                <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)' }}>{item.count}</span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '36px',
                    height: `${Math.max((item.count / maxMonthCount) * 100, 4)}%`,
                    background: barColors[i % barColors.length],
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.6s ease',
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Award Distribution */}
        <motion.div
          className="glass-card glass-card-vertical glass-card-static"
          style={sectionStyle}
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
        >
          <div style={sectionTitleStyle}>获奖等级分布</div>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {awardData.map((item) => (
              <motion.div key={item.key} variants={staggerItem} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.count}人</span>
                </div>
                <div className="glass-progress" style={{ height: '8px' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 'inherit',
                      width: `${(item.count / maxAwardCount) * 100}%`,
                      background: item.color,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Summary stats footer */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ marginTop: '20px', padding: '20px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <div style={sectionTitleStyle}>数据概览</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: '平均每竞赛报名', value: `${Math.round(totalRegistered / mockCompetitions.length)}人` },
            { label: '队伍平均人数', value: `${(mockCompetitionTeams.reduce((s, t) => s + t.memberCount, 0) / mockCompetitionTeams.length).toFixed(1)}人` },
            { label: '队伍平均评分', value: `${(mockCompetitionTeams.reduce((s, t) => s + t.avgScore, 0) / mockCompetitionTeams.length).toFixed(1)}分` },
            { label: '获奖率', value: `${totalAwards > 0 ? Math.round((totalAwards / totalRegistered) * 100) : 0}%` },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{item.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
