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
import { staggerContainer, staggerItem } from '../motion/variants'
import {
  mockCompetitions,
  mockRegistrations,
  mockResults,
  mockCategories,
} from '../data/mockData'

export default function StudentDashboard() {
  const navigate = useNavigate()

  // ── Derived data ──────────────────────────────────

  const publishedCompetitions = mockCompetitions.filter(
    (c) => c.status === 'published' || c.status === 'ongoing',
  )

  const topPublished = [...mockCompetitions]
    .filter((c) => c.status === 'published')
    .sort((a, b) => b.registeredCount - a.registeredCount)
    .slice(0, 4)

  const approvedCount = mockRegistrations.filter((r) => r.status === 'approved').length
  const pendingCount = mockRegistrations.filter((r) => r.status === 'pending').length
  const rejectedCount = mockRegistrations.filter((r) => r.status === 'rejected').length

  const upcomingDeadlines = [...publishedCompetitions]
    .sort(
      (a, b) =>
        new Date(a.registrationEnd).getTime() - new Date(b.registrationEnd).getTime(),
    )
    .slice(0, 3)

  const scoredResults = mockResults.filter((r) => r.score !== null)
  const awardCount = mockResults.filter((r) => r.awardLevel !== null).length
  const avgScore =
    scoredResults.length > 0
      ? (
          scoredResults.reduce((sum, r) => sum + (r.score ?? 0), 0) / scoredResults.length
        ).toFixed(1)
      : '--'

  const recentResults = mockResults.slice(0, 3)

  // ── Helpers ────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────

  return (
    <>
      <motion.div
        className="bento-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* ─ 1. Featured: 可报名竞赛 (2x2) ─ */}
        <motion.div className="bento-card bento-lg" variants={staggerItem}>
          <div className="bento-label">
            <Trophy size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} strokeWidth={1.8} />
            可报名竞赛
          </div>
          <div className="bento-sub" style={{ marginTop: 2, marginBottom: 10 }}>
            共 {publishedCompetitions.length} 个竞赛正在进行
          </div>

          {topPublished.map((comp) => (
            <div
              key={comp.id}
              className="bento-action"
              onClick={() => navigate('/student/competitions')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {comp.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {getCategoryName(comp.categoryId)} · 截止 {formatDate(comp.registrationEnd)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <FileText size={11} strokeWidth={1.5} color="var(--text-tertiary)" />
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {comp.registeredCount}人
                </span>
                <ArrowUpRight size={13} color="var(--gray-3)" />
              </div>
            </div>
          ))}

          <div
            className="bento-action"
            style={{ justifyContent: 'center', color: 'var(--blue)', fontSize: 12, fontWeight: 500 }}
            onClick={() => navigate('/student/competitions')}
          >
            查看全部
            <ArrowUpRight size={12} style={{ marginLeft: 3 }} />
          </div>
        </motion.div>

        {/* ─ 2. 报名状态 (1x2 tall) ─ */}
        <motion.div className="bento-card bento-tall" variants={staggerItem}>
          <div className="bento-label">
            <Calendar size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} strokeWidth={1.8} />
            报名状态
          </div>
          <div className="bento-value" style={{ marginTop: 6 }}>
            {mockRegistrations.length}
          </div>
          <div className="bento-sub">总报名数</div>

          <div className="bento-dots" style={{ marginTop: 16 }}>
            <div className="bento-dot-row">
              <span className="bento-dot" style={{ background: 'var(--success, #34c759)' }} />
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>已通过</span>
              <span className="bento-num success">{approvedCount}</span>
            </div>
            <div className="bento-dot-row">
              <span className="bento-dot" style={{ background: 'var(--warning, #ff9f0a)' }} />
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>待审核</span>
              <span className="bento-num warn">{pendingCount}</span>
            </div>
            <div className="bento-dot-row">
              <span className="bento-dot" style={{ background: 'var(--danger, #ff3b30)' }} />
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>已拒绝</span>
              <span className="bento-num danger">{rejectedCount}</span>
            </div>
          </div>
        </motion.div>

        {/* ─ 3. 即将截止 (2x1 wide) ─ */}
        <motion.div className="bento-card bento-wide" variants={staggerItem}>
          <div className="bento-label">
            <Clock size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} strokeWidth={1.8} />
            即将截止
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            {upcomingDeadlines.map((comp) => {
              const days = daysUntil(comp.registrationEnd)
              return (
                <div
                  key={comp.id}
                  style={{ flex: 1, minWidth: 140, cursor: 'pointer' }}
                  onClick={() => navigate('/student/competitions')}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {comp.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span
                      className={
                        days <= 7
                          ? 'bento-num danger'
                          : days <= 30
                            ? 'bento-num warn'
                            : 'bento-num'
                      }
                    >
                      {days}天
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {formatDate(comp.registrationEnd)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ─ 4. 获奖数量 (1x1) ─ */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">
            <Medal size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} strokeWidth={1.8} />
            获奖数量
          </div>
          <div className="bento-value" style={{ marginTop: 8 }}>
            {awardCount}
          </div>
          <div className="bento-sub">参赛 {mockResults.length} 次</div>
        </motion.div>

        {/* ─ 5. 平均成绩 (1x1) ─ */}
        <motion.div className="bento-card" variants={staggerItem}>
          <div className="bento-label">
            <Trophy size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} strokeWidth={1.8} />
            平均成绩
          </div>
          <div className="bento-value" style={{ marginTop: 8 }}>
            {avgScore}
          </div>
          <div className="bento-sub">满分 100</div>
        </motion.div>

        {/* ─ 6. 最近成绩 (2x1 wide) ─ */}
        <motion.div className="bento-card bento-wide" variants={staggerItem}>
          <div className="bento-label">
            <Medal size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} strokeWidth={1.8} />
            最近成绩
          </div>

          <div style={{ marginTop: 8 }}>
            {recentResults.map((result) => (
              <div
                key={result.id}
                className="bento-action"
                onClick={() => navigate('/student/grades')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {result.competitionName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                    {result.isPublished ? result.awardName : '待公布'}
                  </div>
                </div>
                {result.isPublished && result.score !== null && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className="bento-num">{result.score}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      第{result.ranking}名
                    </div>
                  </div>
                )}
                {!result.isPublished && (
                  <span className="bento-num warn">待公布</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
