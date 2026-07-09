import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  Trophy,
  Award,
  BarChart3,
  Download,
  Users,
  Calendar,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import DigitRoller from '../components/DigitRoller'
import { fadeInList, fadeSlideUp } from '../motion/variants'
import { resultApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { ResultItem } from '../api/types'
import { PAGE_SIZE, CANVAS_CONFIG } from '../config/constants'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatDate } from '../utils/format'

const awardLevelLabel: Record<number, string> = {
  1: '特等奖',
  2: '一等奖',
  3: '二等奖',
  4: '三等奖',
  5: '优秀奖',
}

const awardColorMap: Record<number, string> = {
  1: '#b45309',
  2: '#d97706',
  3: '#92400e',
  4: 'var(--accent)',
  5: 'var(--text-secondary)',
}

function downloadCertificate(result: ResultItem, userName: string) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_CONFIG.CERTIFICATE_WIDTH
  canvas.height = CANVAS_CONFIG.CERTIFICATE_HEIGHT
  const ctx = canvas.getContext('2d')!

  // Background
  const grad = ctx.createLinearGradient(0, 0, CANVAS_CONFIG.CERTIFICATE_WIDTH, CANVAS_CONFIG.CERTIFICATE_HEIGHT)
  grad.addColorStop(0, '#fefce8')
  grad.addColorStop(1, '#fff7ed')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1000, 700)

  // Border
  ctx.strokeStyle = '#d97706'
  ctx.lineWidth = 4
  ctx.strokeRect(30, 30, 940, 640)
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 1
  ctx.strokeRect(42, 42, 916, 616)

  // Title
  ctx.fillStyle = '#92400e'
  ctx.font = 'bold 36px serif'
  ctx.textAlign = 'center'
  ctx.fillText('荣 誉 证 书', 500, 120)

  // Decorative line
  ctx.strokeStyle = '#d97706'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(300, 145)
  ctx.lineTo(700, 145)
  ctx.stroke()

  // Content
  ctx.fillStyle = '#78350f'
  ctx.font = '20px serif'
  ctx.textAlign = 'center'
  ctx.fillText(`兹证明 ${userName} 同学`, 500, 220)

  ctx.font = '18px serif'
  ctx.fillText(`在「${result.competitionName || '竞赛'}」中`, 500, 270)

  const awardText = result.awardName || awardLevelLabel[result.awardLevel || 0] || '获奖'
  ctx.font = 'bold 28px serif'
  ctx.fillStyle = '#b45309'
  ctx.fillText(awardText, 500, 330)

  ctx.fillStyle = '#78350f'
  ctx.font = '18px serif'
  if (result.score !== null) {
    ctx.fillText(`成绩：${result.score} 分`, 500, 390)
  }
  if (result.ranking !== null) {
    ctx.fillText(`排名：第 ${result.ranking} 名`, 500, 430)
  }

  // Footer
  ctx.font = '16px serif'
  ctx.fillStyle = '#a16207'
  ctx.fillText('学生竞赛信息管理系统', 500, 540)

  const dateStr = result.publishTime || new Date().toISOString().slice(0, 10)
  ctx.fillText(`颁发日期：${dateStr}`, 500, 580)

  // Download
  const link = document.createElement('a')
  link.download = `证书_${result.competitionName || '竞赛'}_${userName}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export default function StudentGrades() {
  const user = useAuthStore((s) => s.user)
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await resultApi.list({ current: 1, size: PAGE_SIZE.LARGE, studentId: user.id, isPublished: 1 })
      setResults(result.records)
    } catch (err) {
      console.error('加载成绩数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const awardResults = results.filter((r) => r.awardLevel !== null)
  const scoredResults = results.filter((r) => r.score !== null)
  const avgScore =
    scoredResults.length > 0
      ? (scoredResults.reduce((s, r) => s + (r.score ?? 0), 0) / scoredResults.length).toFixed(1)
      : '--'

  const highestAward = (() => {
    const order = [1, 2, 3, 4, 5]
    for (const level of order) {
      const found = awardResults.find((r) => r.awardLevel === level)
      if (found) return found.awardName || awardLevelLabel[level]
    }
    return '--'
  })()

  if (loading && results.length === 0) {
    return <ListSkeleton />
  }

  return (
    <>
      {/* Summary metric cards */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}
        variants={fadeInList}
        initial="hidden"
        animate="visible"
      >
        <div className="metric-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <BarChart3 size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>参赛次数</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={results.length} />
          </div>
        </div>
        <div className="metric-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Trophy size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>获奖次数</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={awardResults.length} />
          </div>
        </div>
        <div className="metric-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Award size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>最高奖项</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {highestAward}
          </div>
        </div>
        <div className="metric-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <BarChart3 size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>平均成绩</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {avgScore}
          </div>
        </div>
      </motion.div>

      {/* Section header */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }} style={{ marginTop: '16px', marginBottom: '14px' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
          成绩明细
          <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
            {results.length}条
          </span>
        </span>
      </motion.div>

      {/* Results cards grid */}
      <motion.div
        variants={fadeInList}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '16px',
        }}
      >
        {results.map((result) => {
          const awardColor = result.awardLevel ? (awardColorMap[result.awardLevel] || 'var(--text-secondary)') : null
          const accentColor = result.awardLevel
            ? (result.awardLevel <= 2 ? '#d97706' : result.awardLevel <= 4 ? 'var(--accent)' : 'var(--gray-2)')
            : 'var(--gray-3)'
          return (
            <div
              key={result.id}
              className="glass-card glass-card-vertical"
              style={{ padding: '18px' }}
            >
              {/* Top: Name + status badge */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.35, flex: 1 }}>
                    {result.competitionName || '-'}
                  </span>
                  {result.isPublished === 1 ? (
                    <span className="glass-badge pass" style={{ fontSize: '11px', padding: '2px 8px', flexShrink: 0 }}>已发布</span>
                  ) : (
                    <span className="glass-badge pending" style={{ fontSize: '11px', padding: '2px 8px', flexShrink: 0 }}>待公布</span>
                  )}
                </div>

                {/* Accent line */}
                <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: accentColor, marginBottom: '10px' }} />
              </div>

              {/* Score + Ranking highlight */}
              {(result.score !== null || result.ranking !== null) && (
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.02)',
                }}>
                  {result.score !== null && (
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>分数</div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {result.score}
                      </div>
                    </div>
                  )}
                  {result.ranking !== null && (
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>排名</div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {result.ranking}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Award highlight */}
              {result.awardLevel && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  marginBottom: '12px',
                }}>
                  <Trophy size={14} strokeWidth={1.8} color={awardColor || 'var(--text-secondary)'} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: awardColor || 'var(--text-primary)' }}>
                    {result.awardName || awardLevelLabel[result.awardLevel]}
                  </span>
                </div>
              )}

              {/* Meta info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Users size={12} strokeWidth={1.5} />
                  队伍：{result.teamName || <span style={{ color: 'var(--text-tertiary)' }}>个人参赛</span>}
                </div>
                {result.remark && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    备注：{result.remark}
                  </div>
                )}
                {result.publishTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <Calendar size={12} strokeWidth={1.5} />
                    发布时间：{formatDate(result.publishTime)}
                  </div>
                )}
              </div>

              {/* Action button */}
              {result.isPublished === 1 && result.awardLevel ? (
                <button
                  className="btn ghost"
                  style={{ width: '100%', height: '32px', fontSize: '12px', marginTop: 'auto' }}
                  onClick={() => downloadCertificate(result, user?.realName || user?.username || '学生')}
                >
                  <Download size={14} strokeWidth={1.5} />
                  下载证书
                </button>
              ) : (
                <div style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  padding: '6px 0',
                  marginTop: 'auto',
                }}>
                  {result.isPublished !== 1 ? '成绩待公布' : '暂无奖项证书'}
                </div>
              )}
            </div>
          )
        })}
      </motion.div>

      {results.length === 0 && !loading && (
        <EmptyState text="暂无成绩记录" />
      )}

    </>
  )
}
