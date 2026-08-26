import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import EmptyState from '../components/EmptyState'
import { TableSkeleton } from '../components/PageSkeleton'
import { fadeInList, fadeSlideUp } from '../motion/variants'
import { competitionApi, resultApi, registrationApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem, ResultItem, RegistrationItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/toastUtils'
import { confirmDialog } from '../components/confirmDialogUtils'
import { editGradeDialog } from '../components/editGradeDialogUtils'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import GlassModal from '../components/GlassModal'
import { Upload, FileSpreadsheet, Plus, Trash2 } from 'lucide-react'

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
    <div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '18px', marginTop: '16px' }}>
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
  const [stats, setStats] = useState<{ avgScore: string; maxScore: string; minScore: string; totalCount: number }>({ avgScore: '--', maxScore: '--', minScore: '--', totalCount: 0 })
  const pagination = usePagination()

  // 批量录入相关状态
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([])
  const [batchRows, setBatchRows] = useState<Array<{ studentId: number; studentName: string; score: string; ranking: string; awardLevel: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    competitionApi.list({ current: 1, size: PAGE_SIZE.LARGE, publisherId: user.id })
      .then((res) => { setCompetitions(res.records); if (res.records.length > 0) setSelectedComp(res.records[0].id) })
      .catch((e) => { toast.error('加载竞赛列表失败'); console.error(e) }).finally(() => setLoading(false))
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
    } catch (err) { toast.error('加载成绩失败'); console.error('加载成绩失败:', err) }
  }, [fetchResults])

  useEffect(() => {
    fetchResults().then(res => {
      if (!res) return
      setResults(res.records)
      pagination.setTotal(res.total)
    }).catch(err => { toast.error('加载成绩失败'); console.error('加载成绩失败:', err) })
  }, [fetchResults])

  // 竞赛切换时重置到第1页
  useEffect(() => { pagination.resetPage() }, [selectedComp])

  // 获取竞赛统计数据
  useEffect(() => {
    if (!selectedComp) return
    resultApi.stats({ competitionId: selectedComp }).then(res => {
      setStats({
        avgScore: res.avgScore != null ? res.avgScore.toFixed(1) : '--',
        maxScore: res.maxScore != null ? res.maxScore.toString() : '--',
        minScore: res.minScore != null ? res.minScore.toString() : '--',
        totalCount: res.totalCount ?? 0
      })
    }).catch(err => { console.error('加载统计数据失败:', err) })
  }, [selectedComp])

  const handlePublish = async () => {
    if (!selectedComp) return
    const confirmed = await confirmDialog({ message: '确定要发布该竞赛的所有成绩吗？', variant: 'warning', confirmText: '发布' })
    if (!confirmed) return
    try { await resultApi.publish(selectedComp); loadResults(); toast.success('发布成功') }
    catch (err) { toast.error(err instanceof Error ? err.message : '发布失败') }
  }

  // 打开批量录入弹窗
  const handleOpenBatch = async () => {
    if (!selectedComp) return
    setBatchModalOpen(true)
    setBatchLoading(true)
    try {
      // 获取该竞赛已审核通过的报名列表
      const res = await registrationApi.list({ current: 1, size: PAGE_SIZE.LARGE, competitionId: selectedComp, status: 1 })
      setRegistrations(res.records)
      // 初始化行为每个已报名学生一行
      setBatchRows(res.records.map(r => ({
        studentId: r.studentId,
        studentName: r.studentName || `学生${r.studentId}`,
        score: '',
        ranking: '',
        awardLevel: '',
      })))
    } catch (err) {
      toast.error('加载报名列表失败')
      console.error('加载报名列表失败:', err)
    } finally {
      setBatchLoading(false)
    }
  }

  // 更新批量录入行
  const updateBatchRow = (index: number, field: string, value: string) => {
    setBatchRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  // 删除批量录入行
  const removeBatchRow = (index: number) => {
    setBatchRows(prev => prev.filter((_, i) => i !== index))
  }

  // 添加空行
  const addBatchRow = () => {
    setBatchRows(prev => [...prev, { studentId: 0, studentName: '', score: '', ranking: '', awardLevel: '' }])
  }

  // CSV导入
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) { toast.error('CSV文件格式错误'); return }

      // 解析CSV（支持逗号和制表符分隔）
      const parseLine = (line: string) => {
        const sep = line.includes('\t') ? '\t' : ','
        return line.split(sep).map(s => s.trim().replace(/^"|"$/g, ''))
      }

      const header = parseLine(lines[0])
      const studentIdIdx = header.findIndex(h => /学号|studentId|id/i.test(h))
      const scoreIdx = header.findIndex(h => /分数|score/i.test(h))
      const rankingIdx = header.findIndex(h => /排名|ranking/i.test(h))
      const awardIdx = header.findIndex(h => /奖项|award/i.test(h))

      if (studentIdIdx === -1 || scoreIdx === -1) {
        toast.error('CSV必须包含"学号"和"分数"列')
        return
      }

      const newRows = lines.slice(1).map(line => {
        const cols = parseLine(line)
        const studentId = Number(cols[studentIdIdx]) || 0
        const reg = registrations.find(r => r.studentId === studentId)
        return {
          studentId,
          studentName: reg?.studentName || `学生${studentId}`,
          score: cols[scoreIdx] || '',
          ranking: rankingIdx >= 0 ? cols[rankingIdx] || '' : '',
          awardLevel: awardIdx >= 0 ? cols[awardIdx] || '' : '',
        }
      }).filter(row => row.studentId > 0)

      if (newRows.length === 0) { toast.error('未解析到有效数据'); return }
      setBatchRows(newRows)
      toast.success(`已导入 ${newRows.length} 条记录`)
    }
    reader.readAsText(file)
    // 重置input以允许重复导入同一文件
    e.target.value = ''
  }

  // 提交批量录入
  const handleBatchSubmit = async () => {
    if (!selectedComp) return
    const validRows = batchRows.filter(r => r.studentId > 0 && r.score !== '')
    if (validRows.length === 0) { toast.error('请至少填写一条有效成绩'); return }

    const confirmed = await confirmDialog({
      message: `确定要批量录入 ${validRows.length} 条成绩吗？`,
      variant: 'warning',
      confirmText: '确认录入',
    })
    if (!confirmed) return

    setBatchLoading(true)
    try {
      await resultApi.batch({
        competitionId: selectedComp,
        results: validRows.map(r => ({
          studentId: r.studentId,
          score: Number(r.score),
          ranking: r.ranking ? Number(r.ranking) : null,
          awardLevel: r.awardLevel ? Number(r.awardLevel) : null,
        })),
      })
      toast.success(`成功录入 ${validRows.length} 条成绩`)
      setBatchModalOpen(false)
      loadResults()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '批量录入失败')
      console.error('批量录入失败:', err)
    } finally {
      setBatchLoading(false)
    }
  }

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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn ghost" style={{ gap: '6px' }} onClick={handleOpenBatch} disabled={!selectedComp}>
            <Upload size={14} /> 批量录入
          </button>
          <button className="btn ghost" style={{ gap: '6px', color: 'var(--accent)' }} onClick={handlePublish}>
            发布成绩
          </button>
        </div>
      </motion.div>

      {stats.totalCount > 0 && (
        <>
          <motion.div
            variants={fadeInList}
            initial="hidden"
            animate="visible"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}
          >
            <div className="metric-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>平均分</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{stats.avgScore}</div>
            </div>
            <div className="metric-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>最高分</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{stats.maxScore}</div>
            </div>
            <div className="metric-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>最低分</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{stats.minScore}</div>
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
                        awards: selectedCompData?.awards || undefined,
                      })
                      if (result !== null) {
                        try {
                          await resultApi.update({ id: r.id, score: result.score, remark: result.remark, ranking: result.ranking, awardLevel: result.awardLevel })
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

      {/* 批量录入弹窗 */}
      <GlassModal open={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="批量录入成绩" maxWidth="900px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 操作栏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv"
                style={{ display: 'none' }}
                onChange={handleCSVImport}
              />
              <button
                className="btn ghost"
                style={{ gap: '6px', fontSize: '13px' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet size={14} /> 导入CSV
              </button>
              <button
                className="btn ghost"
                style={{ gap: '6px', fontSize: '13px' }}
                onClick={addBatchRow}
              >
                <Plus size={14} /> 添加行
              </button>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              共 {batchRows.length} 条记录
            </span>
          </div>

          {/* CSV格式说明 */}
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}>
            <strong>CSV格式：</strong>表头需包含"学号"和"分数"列，可选"排名"和"奖项等级"列。支持逗号或制表符分隔。
          </div>

          {/* 可编辑表格 */}
          {batchLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>加载中...</div>
          ) : batchRows.length === 0 ? (
            <EmptyState text="暂无数据，请导入CSV或手动添加" />
          ) : (
            <div style={{ maxHeight: '400px', overflow: 'auto', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>学生</th>
                    <th style={{ width: '120px' }}>分数 *</th>
                    <th style={{ width: '100px' }}>排名</th>
                    <th style={{ width: '120px' }}>奖项等级</th>
                    <th style={{ width: '50px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {batchRows.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{idx + 1}</td>
                      <td style={{ fontWeight: '600', fontSize: '13px' }}>{row.studentName || `学生${row.studentId}`}</td>
                      <td>
                        <input
                          type="number"
                          value={row.score}
                          onChange={e => updateBatchRow(idx, 'score', e.target.value)}
                          placeholder="分数"
                          style={{
                            width: '100%', height: '32px', padding: '0 8px',
                            borderRadius: '6px', border: '1px solid var(--glass-border)',
                            background: 'rgba(255,255,255,0.2)', fontSize: '13px',
                            color: 'var(--text-primary)', outline: 'none',
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.ranking}
                          onChange={e => updateBatchRow(idx, 'ranking', e.target.value)}
                          placeholder="排名"
                          style={{
                            width: '100%', height: '32px', padding: '0 8px',
                            borderRadius: '6px', border: '1px solid var(--glass-border)',
                            background: 'rgba(255,255,255,0.2)', fontSize: '13px',
                            color: 'var(--text-primary)', outline: 'none',
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.awardLevel}
                          onChange={e => updateBatchRow(idx, 'awardLevel', e.target.value)}
                          placeholder="等级(1-10)"
                          style={{
                            width: '100%', height: '32px', padding: '0 8px',
                            borderRadius: '6px', border: '1px solid var(--glass-border)',
                            background: 'rgba(255,255,255,0.2)', fontSize: '13px',
                            color: 'var(--text-primary)', outline: 'none',
                          }}
                        />
                      </td>
                      <td>
                        <button
                          className="icon-btn"
                          onClick={() => removeBatchRow(idx)}
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 底部按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            <button className="btn ghost" onClick={() => setBatchModalOpen(false)}>取消</button>
            <button
              className="btn ghost"
              onClick={handleBatchSubmit}
              disabled={batchLoading || batchRows.length === 0}
              style={{ gap: '6px', color: 'var(--accent)' }}
            >
              <Upload size={14} />
              {batchLoading ? '提交中...' : '确认录入'}
            </button>
          </div>
        </div>
      </GlassModal>

    </>
  )
}
