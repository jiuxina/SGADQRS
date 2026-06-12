import { motion } from 'motion/react'
import {
  Trophy,
  Award,
  BarChart3,
  Download,
} from 'lucide-react'
import DigitRoller from '../components/DigitRoller'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { mockResults } from '../data/mockData'

const awardLevelLabel: Record<string, string> = {
  special: '特等奖',
  first: '一等奖',
  second: '二等奖',
  third: '三等奖',
  excellence: '优秀奖',
}

export default function StudentGrades() {
  const awardResults = mockResults.filter((r) => r.awardLevel !== null)
  const scoredResults = mockResults.filter((r) => r.score !== null)
  const avgScore =
    scoredResults.length > 0
      ? (scoredResults.reduce((s, r) => s + (r.score ?? 0), 0) / scoredResults.length).toFixed(1)
      : '--'

  const highestAward = (() => {
    const order = ['special', 'first', 'second', 'third', 'excellence']
    for (const level of order) {
      const found = awardResults.find((r) => r.awardLevel === level)
      if (found) return found.awardName
    }
    return '--'
  })()

  return (
    <>
      {/* Summary metric cards */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm blue">
              <BarChart3 strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>参赛次数</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={mockResults.length} />
          </div>
        </motion.div>

        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm green">
              <Trophy strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>获奖次数</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={awardResults.length} />
          </div>
        </motion.div>

        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm purple">
              <Award strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>最高奖项</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {highestAward}
          </div>
        </motion.div>

        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm amber">
              <BarChart3 strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>平均成绩</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {avgScore}
          </div>
        </motion.div>
      </motion.div>

      {/* Results table */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0', marginTop: '24px' }}
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
            成绩明细
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {mockResults.length}条
            </span>
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>竞赛名称</th>
              <th>队伍名称</th>
              <th>分数</th>
              <th>排名</th>
              <th>奖项</th>
              <th>状态</th>
              <th style={{ width: '100px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {mockResults.map((result) => (
              <tr key={result.id}>
                <td style={{ fontWeight: '600', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.competitionName}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {result.teamName ?? <span style={{ color: 'var(--text-tertiary)' }}>个人参赛</span>}
                </td>
                <td>
                  {result.score !== null ? (
                    <span style={{ fontWeight: '700' }}>{result.score}</span>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)' }}>--</span>
                  )}
                </td>
                <td>
                  {result.ranking !== null ? (
                    <span>第 {result.ranking} 名</span>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)' }}>--</span>
                  )}
                </td>
                <td>
                  {result.awardLevel ? (
                    <span
                      style={{
                        fontWeight: '600',
                        color:
                          result.awardLevel === 'special' || result.awardLevel === 'first'
                            ? 'var(--accent)'
                            : 'var(--text-primary)',
                      }}
                    >
                      {awardLevelLabel[result.awardLevel] ?? result.awardName}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)' }}>--</span>
                  )}
                </td>
                <td>
                  {result.isPublished ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="status-dot pass" />
                      <span className="glass-badge pass" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        已发布
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="status-dot pending" />
                      <span className="glass-badge pending" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        待公布
                      </span>
                    </div>
                  )}
                </td>
                <td>
                  {result.isPublished && result.awardLevel ? (
                    <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Download size={12} strokeWidth={1.5} />
                      下载证书
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
