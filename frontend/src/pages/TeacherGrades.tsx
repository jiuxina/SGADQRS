import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import EmptyState from '../components/EmptyState'
import { TableSkeleton } from '../components/PageSkeleton'
import { fadeInList, fadeSlideUp } from '../motion/variants'
import { competitionApi, resultApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem, ResultItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/toastUtils'
import { confirmDialog } from '../components/confirmDialogUtils'
import { editGradeDialog } from '../components/editGradeDialogUtils'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'

function ScoreDistChart({ results }: { results: ResultItem[] }) {
  const scores = results.filter((r) => r.score !== null).map((r) => r.score!) as number[]
  if (scores.length === 0) return null

  const binCount = 8
  const sMin = Math.min(...scores)
  const sMax = Math.max(...scores)
  const binRange = (sMax - sMin) / binCount || 1

  const bins = Array.from({ length: binCount }, (_, i) => ({
    label0: Math.round(sMin + i * binRange),
    label1: Math.round(sMin + (i + 1) * binRange),
    count: 0,
  }))

  for (const s of scores) {
    const idx = Math.min(Math.floor((s - sMin) / binRange), binCount - 1)
    bins[idx].count++
  }

  const maxCount = Math.max(...bins.map((b) => b.count), 1)

  const W = 640, H = 200, PT = 20, PR = 20, PB = 36, PL = 40
  const cw = W - PL - PR, ch = H - PT - PB
  const barW = Math.max(8, cw / binCount - 4)

  const yTickCount = 4
  const yTicks: number[] = []
  for (let i = 0; i < yTickCount; i++) yTicks.push(Math.round((maxCount * i) / (yTickCount - 1)))

  return (
    <div className="glass-card glass-card-static" style={{ padding: '18px', marginTop: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
        成绩分布
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {yTicks.map((v, i) => {
          const y = PT + ch - (v / maxCount) * ch
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <text x={PL - 8} y={y + 4} textAnchor="end" fill="var(--text-tertiary)" fontSize="10">
                {v}
              </text>
            </g>
          )
        })}

        {bins.map((b, i) => {
          const x = PL + (i * (cw / binCount))
          const barH = (b.count / maxCount) * ch
          const y = PT + ch - barH
          return (
            <g key={i}>
              <rect x={x + 2} y={y} width={barW} height={barH} rx="3" fill="url(#histGrad)" stroke="#d97706" strokeWidth="1" />
              <text x={x + barW / 2 + 2} y={y - 6} textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">
                {b.count}
              </text>
              <text x={x + barW / 2 + 2} y={H - 6} textAnchor="middle" fill="var(--text-tertiary)" fontSize="8">
                {b.label0}-{b.label1}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function TeacherGrades() {
  const user = useAuthStore((s) => s.user)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [selectedComp, setSelectedComp] = useState<number | null>(null)
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(true)
  const pagination = usePagination()

  useEffect(() => {
    if (!user) return
    competitionApi.list({ current: 1, size: PAGE_SIZE.LARGE, publisherId: user.id })
      .then((res) => { setCompetitions(res.records); if (res.records.length > 0) setSelectedComp(res.records[0].id) })
      .catch(console.error).finally(() => setLoading(false))
  }, [user])

  const fetchResults = useCallback(async () => {
    if (!selectedComp) return null
    return resultApi.list({ current: pagination.current, size: pagination.pageSize, competitionId: selectedComp })
  }, [selectedComp, pagination.current, pagination.pageSize])

  const loadResults = useCallback(async () => {
    try {
      const res = await fetchResults()
      if (!res) return
      setResults(res.records)
      pagination.setTotal(res.total)
    } catch (err) { console.error('加载成绩失败:', err) }
  }, [fetchResults])

  useEffect(() => {
    fetchResults().then(res => {
      if (!res) return
      setResults(res.records)
      pagination.setTotal(res.total)
    }).catch(err => { console.error('加载成绩失败:', err) })
  }, [fetchResults])

  // 竞赛切换时重置到第1页
  useEffect(() => { pagination.resetPage() }, [selectedComp])

  const handlePublish = async () => {
    if (!selectedComp) return
    const confirmed = await confirmDialog({ message: '确定要发布该竞赛的所有成绩吗？', variant: 'warning', confirmText: '发布' })
    if (!confirmed) return
    try { await resultApi.publish(selectedComp); loadResults(); toast.success('发布成功') }
    catch (err) { toast.error(err instanceof Error ? err.message : '发布失败') }
  }

  const scoredScores = results.filter((r) => r.score !== null).map((r) => r.score!) as number[]
  const avgScore = scoredScores.length > 0 ? (scoredScores.reduce((s, v) => s + v, 0) / scoredScores.length).toFixed(1) : '--'
  const maxScore = scoredScores.length > 0 ? Math.max(...scoredScores) : '--'
  const minScore = scoredScores.length > 0 ? Math.min(...scoredScores) : '--'

  if (loading) return <TableSkeleton />

  return (
    <>
      <motion.div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
        variants={fadeSlideUp} initial="hidden" animate="visible">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>选择竞赛：</span>
          <select
            style={{ height: '36px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.32)', fontSize: '13px', color: 'var(--text-primary)', outline: 'none' }}
            value={selectedComp || ''} onChange={(e) => setSelectedComp(Number(e.target.value))}
          >
            {competitions.map((c) => <option key={c.id} value={c.id}>{c.competitionName}</option>)}
          </select>
        </div>
        <button className="btn primary" style={{ gap: '6px' }} onClick={handlePublish}>
          发布成绩
        </button>
      </motion.div>

      {scoredScores.length > 0 && (
        <>
          <motion.div
            variants={fadeInList}
            initial="hidden"
            animate="visible"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}
          >
            <div className="metric-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>平均分</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{avgScore}</div>
            </div>
            <div className="metric-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>最高分</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{maxScore}</div>
            </div>
            <div className="metric-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>最低分</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{minScore}</div>
            </div>
          </motion.div>

          <ScoreDistChart results={results} />
        </>
      )}

      <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }}
        variants={fadeInList} initial="hidden" animate="visible">
        <div>
          <table className="data-table">
            <thead>
              <tr>
                <th>学生/团队</th><th>分数</th><th>排名</th><th>奖项</th><th>备注</th><th>状态</th><th style={{ width: '100px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: '600' }}>{r.studentName || r.teamName || '-'}</td>
                  <td>{r.score !== null ? <span style={{ fontWeight: '700' }}>{r.score}</span> : <span style={{ color: 'var(--text-tertiary)' }}>--</span>}</td>
                  <td>{r.ranking !== null ? `第 ${r.ranking} 名` : '-'}</td>
                  <td>{r.awardName ? <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{r.awardName}</span> : '-'}</td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{r.remark || '-'}</td>
                  <td>
                    <span className={`glass-badge ${r.isPublished === 1 ? 'pass' : 'pending'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {r.isPublished === 1 ? '已发布' : '待发布'}
                    </span>
                  </td>
                  <td>
                    <button className="text-btn blue" style={{ fontSize: '12px' }} onClick={async () => {
                      const selectedCompData = competitions.find(c => c.id === selectedComp)
                      const result = await editGradeDialog({
                        studentName: r.studentName || r.teamName || '该学生',
                        defaultScore: r.score,
                        defaultRanking: r.ranking,
                        defaultAwardLevel: r.awardLevel,
                        defaultRemark: r.remark,
                        defaultCertificateUrl: r.certificateUrl,
                        awards: selectedCompData?.awards || undefined,
                      })
                      if (result !== null) {
                        try {
                          await resultApi.update({ id: r.id, score: result.score, remark: result.remark, ranking: result.ranking, awardLevel: result.awardLevel, certificateUrl: result.certificateUrl })
                          loadResults()
                          toast.success('更新成功')
                        } catch { toast.error('更新失败') }
                      }
                    }}>编辑</button>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={7}><EmptyState text="暂无成绩记录" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Pagination
        current={pagination.current}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setCurrent}
        onPageSizeChange={pagination.setPageSize}
      />

    </>
  )
}
