import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  Trophy,
  Award,
  BarChart3,
  Download,
} from 'lucide-react'
import DigitRoller from '../components/DigitRoller'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { resultApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { ResultItem } from '../api/types'

const awardLevelLabel: Record<number, string> = {
  1: '特等奖',
  2: '一等奖',
  3: '二等奖',
  4: '三等奖',
  5: '优秀奖',
}

function downloadCertificate(result: ResultItem, userName: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 700
  const ctx = canvas.getContext('2d')!

  // Background
  const grad = ctx.createLinearGradient(0, 0, 1000, 700)
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

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await resultApi.list({ current: 1, size: 50, studentId: user.id, isPublished: 1 })
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
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>
  }

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
            <div className="icon-box sm blue"><BarChart3 strokeWidth={1.5} /></div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>参赛次数</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={results.length} />
          </div>
        </motion.div>
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm green"><Trophy strokeWidth={1.5} /></div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>获奖次数</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={awardResults.length} />
          </div>
        </motion.div>
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm purple"><Award strokeWidth={1.5} /></div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>最高奖项</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {highestAward}
          </div>
        </motion.div>
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm amber"><BarChart3 strokeWidth={1.5} /></div>
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
        <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            成绩明细
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {results.length}条
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
            {results.map((result) => (
              <tr key={result.id}>
                <td style={{ fontWeight: '600', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.competitionName || '-'}
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
                    <span style={{
                      fontWeight: '600',
                      color: result.awardLevel <= 2 ? 'var(--accent)' : 'var(--text-primary)',
                    }}>
                      {awardLevelLabel[result.awardLevel] ?? result.awardName}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)' }}>--</span>
                  )}
                </td>
                <td>
                  {result.isPublished === 1 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="status-dot pass" />
                      <span className="glass-badge pass" style={{ fontSize: '11px', padding: '2px 8px' }}>已发布</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="status-dot pending" />
                      <span className="glass-badge pending" style={{ fontSize: '11px', padding: '2px 8px' }}>待公布</span>
                    </div>
                  )}
                </td>
                <td>
                  {result.isPublished === 1 && result.awardLevel ? (
                    <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}
                      onClick={() => downloadCertificate(result, user?.realName || user?.username || '学生')}>
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

        {results.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            暂无成绩记录
          </div>
        )}
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
