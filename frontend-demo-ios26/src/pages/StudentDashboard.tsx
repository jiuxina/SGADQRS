import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Trophy,
  Clock,
  Medal,
  FileText,
  ArrowUpRight,
  Calendar,
} from 'lucide-react'
import DigitRoller from '../components/DigitRoller'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { mockCompetitions, mockRegistrations, mockResults, mockCategories } from '../data/mockData'

export default function StudentDashboard() {
  const navigate = useNavigate()

  const myRegistrations = mockRegistrations
  const myResults = mockResults
  const publishedCompetitions = mockCompetitions.filter(
    (c) => c.status === 'published' || c.status === 'ongoing'
  )
  const awardCount = myResults.filter((r) => r.awardLevel !== null).length
  const avgScore =
    myResults.filter((r) => r.score !== null).length > 0
      ? (
          myResults.filter((r) => r.score !== null).reduce((s, r) => s + (r.score ?? 0), 0) /
          myResults.filter((r) => r.score !== null).length
        ).toFixed(1)
      : '--'

  const hotCompetitions = [...mockCompetitions]
    .filter((c) => c.status === 'published')
    .sort((a, b) => b.registeredCount - a.registeredCount)
    .slice(0, 4)

  const upcomingDeadlines = [...mockCompetitions]
    .filter((c) => c.status === 'published' || c.status === 'ongoing')
    .sort((a, b) => new Date(a.registrationEnd).getTime() - new Date(b.registrationEnd).getTime())
    .slice(0, 5)

  const getCategoryName = (categoryId: string) =>
    mockCategories.find((c) => c.id === categoryId)?.name ?? ''

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return (
    <>
      {/* Metric Cards Row */}
      <motion.div className="metric-grid" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div className="metric-card" variants={staggerItem}>
          <div className="metric-card-header">
            <span className="metric-card-label">可报名竞赛</span>
          </div>
          <div className="metric-card-value">
            <DigitRoller value={publishedCompetitions.length} />
          </div>
          <div className="metric-card-footer">共 {mockCompetitions.length} 个竞赛</div>
        </motion.div>

        <motion.div className="metric-card" variants={staggerItem}>
          <div className="metric-card-header">
            <span className="metric-card-label">我的报名</span>
          </div>
          <div className="metric-card-value">
            <DigitRoller value={myRegistrations.length} />
          </div>
          <div className="metric-card-footer">
            已通过 {myRegistrations.filter((r) => r.status === 'approved').length} 项
          </div>
        </motion.div>

        <motion.div className="metric-card" variants={staggerItem}>
          <div className="metric-card-header">
            <span className="metric-card-label">获奖数量</span>
          </div>
          <div className="metric-card-value">
            <DigitRoller value={awardCount} />
          </div>
          <div className="metric-card-footer">参赛 {myResults.length} 次</div>
        </motion.div>

        <motion.div className="metric-card" variants={staggerItem}>
          <div className="metric-card-header">
            <span className="metric-card-label">平均成绩</span>
          </div>
          <div className="metric-card-value">{avgScore}</div>
          <div className="metric-card-footer">满分 100</div>
        </motion.div>
      </motion.div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hot Competitions */}
          <motion.div
            className="glass-card glass-card-vertical glass-card-static"
            style={{ padding: '0' }}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
          >
            <div
              style={{
                padding: '16px 18px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                <Trophy size={15} style={{ marginRight: '6px', verticalAlign: '-2px' }} strokeWidth={1.8} />
                热门竞赛
              </span>
              <button
                className="text-btn blue"
                style={{ fontSize: '12px' }}
                onClick={() => navigate('/student/competitions')}
              >
                查看全部
              </button>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                padding: '0 14px 14px',
              }}
            >
              {hotCompetitions.map((comp) => (
                <motion.div
                  key={comp.id}
                  variants={staggerItem}
                  className="glass-card glass-card-vertical"
                  style={{ padding: '14px', cursor: 'pointer' }}
                  onClick={() => navigate('/student/competitions')}
                >
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
                    {comp.name.length > 14 ? comp.name.slice(0, 14) + '...' : comp.name}
                  </div>
                  <span
                    className="glass-badge"
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      background: 'rgba(0,122,255,0.06)',
                      borderRadius: '6px',
                      alignSelf: 'flex-start',
                      marginBottom: '8px',
                    }}
                  >
                    {getCategoryName(comp.categoryId)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                    <Clock size={11} strokeWidth={1.5} />
                    截止 {formatDate(comp.registrationEnd)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                    <FileText size={11} strokeWidth={1.5} />
                    {comp.registeredCount} 人已报名
                  </div>
                  <button
                    className="btn primary"
                    style={{ width: '100%', height: '30px', fontSize: '12px' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/student/competitions')
                    }}
                  >
                    报名
                  </button>
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
            transition={{ delay: 0.1 }}
          >
            <div style={{ padding: '16px 18px 12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                <Calendar size={15} style={{ marginRight: '6px', verticalAlign: '-2px' }} strokeWidth={1.8} />
                即将截止
              </span>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {upcomingDeadlines.map((comp, i) => {
                const days = daysUntil(comp.registrationEnd)
                return (
                  <motion.div
                    key={comp.id}
                    variants={staggerItem}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 18px',
                      borderBottom:
                        i < upcomingDeadlines.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate('/student/competitions')}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: days <= 7 ? 'rgba(255,59,48,0.08)' : 'var(--gray-5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Clock
                        size={14}
                        strokeWidth={1.5}
                        color={days <= 7 ? 'var(--danger)' : 'var(--gray-1)'}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {comp.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        截止 {formatDate(comp.registrationEnd)} · 还剩{days}天
                      </div>
                    </div>
                    {days <= 7 && <span className="severity-badge high">紧急</span>}
                    {days > 7 && days <= 30 && <span className="severity-badge medium">注意</span>}
                    <ArrowUpRight size={14} color="var(--gray-3)" />
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* My Recent Results */}
          <motion.div
            className="glass-card glass-card-vertical glass-card-static"
            style={{ padding: '0' }}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15 }}
          >
            <div
              style={{
                padding: '16px 18px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                <Medal size={15} style={{ marginRight: '6px', verticalAlign: '-2px' }} strokeWidth={1.8} />
                最近成绩
              </span>
              <button
                className="text-btn blue"
                style={{ fontSize: '12px' }}
                onClick={() => navigate('/student/grades')}
              >
                查看全部
              </button>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {myResults.slice(0, 4).map((result, i) => (
                <motion.div
                  key={result.id}
                  variants={staggerItem}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    borderBottom: i < 3 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {result.competitionName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                      {result.teamName ?? '个人参赛'}
                    </div>
                  </div>
                  {result.isPublished ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {result.awardName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                        {result.score}分 · 第{result.ranking}名
                      </div>
                    </div>
                  ) : (
                    <span className="glass-badge pending" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      待公布
                    </span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
