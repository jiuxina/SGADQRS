import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { competitionApi, resultApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem, ResultItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/Toast'
import { confirmDialog } from '../components/ConfirmDialog'

const awardLevelLabel: Record<number, string> = { 1: '特等奖', 2: '一等奖', 3: '二等奖', 4: '三等奖', 5: '优秀奖' }

export default function TeacherGrades() {
  const user = useAuthStore((s) => s.user)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [selectedComp, setSelectedComp] = useState<number | null>(null)
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    competitionApi.list({ current: 1, size: PAGE_SIZE.LARGE, publisherId: user.id })
      .then((res) => { setCompetitions(res.records); if (res.records.length > 0) setSelectedComp(res.records[0].id) })
      .catch(console.error).finally(() => setLoading(false))
  }, [user])

  const loadResults = useCallback(async () => {
    if (!selectedComp) return
    try {
      const res = await resultApi.list({ current: 1, size: PAGE_SIZE.LARGE, competitionId: selectedComp })
      setResults(res.records)
    } catch (err) { console.error('加载成绩失败:', err) }
  }, [selectedComp])

  useEffect(() => { loadResults() }, [loadResults])

  const handlePublish = async () => {
    if (!selectedComp) return
    const confirmed = await confirmDialog({ message: '确定要发布该竞赛的所有成绩吗？', variant: 'warning', confirmText: '发布' })
    if (!confirmed) return
    try { await resultApi.publish(selectedComp); loadResults(); toast.success('发布成功') }
    catch (err) { toast.error(err instanceof Error ? err.message : '发布失败') }
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>

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

      <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }}
        variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div variants={staggerItem}>
          <table className="data-table">
            <thead>
              <tr>
                <th>学生/团队</th><th>分数</th><th>排名</th><th>奖项</th><th>状态</th><th style={{ width: '100px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: '600' }}>{r.studentName || r.teamName || '-'}</td>
                  <td>{r.score !== null ? <span style={{ fontWeight: '700' }}>{r.score}</span> : <span style={{ color: 'var(--text-tertiary)' }}>--</span>}</td>
                  <td>{r.ranking !== null ? `第 ${r.ranking} 名` : '-'}</td>
                  <td>{r.awardLevel ? <span style={{ fontWeight: '600', color: r.awardLevel <= 2 ? 'var(--accent)' : 'var(--text-primary)' }}>{awardLevelLabel[r.awardLevel] || r.awardName}</span> : '-'}</td>
                  <td>
                    <span className={`glass-badge ${r.isPublished === 1 ? 'pass' : 'pending'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {r.isPublished === 1 ? '已发布' : '待发布'}
                    </span>
                  </td>
                  <td>
                    <button className="text-btn blue" style={{ fontSize: '12px' }} onClick={async () => {
                      const score = prompt('输入分数:', String(r.score || ''))
                      if (score !== null) { try { await resultApi.update({ id: r.id, score: Number(score) }); loadResults() } catch (err) { toast.error('更新失败') } }
                    }}>编辑</button>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>暂无成绩记录</td></tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
