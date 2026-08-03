import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { motion } from 'motion/react'
import { Search, Award, Eye, EyeOff, Download, Pencil } from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { resultApi, competitionApi, exportApi } from '../api'
import { editGradeDialog } from '../components/editGradeDialogUtils'
import type { ResultItem, CompetitionItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/toastUtils'
import { confirmDialog } from '../components/confirmDialogUtils'
import { formatDate } from '../utils/format'
import { usePagination } from '../hooks/usePagination'
import ListMeta from '../components/ListMeta'
import Pagination from '../components/Pagination'
import { TableSkeleton, LoadingBar } from '../components/PageSkeleton'

export default function AdminGrades() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [results, setResults] = useState<ResultItem[]>([])
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pagination = usePagination()

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const isAllSelected = results.length > 0 && results.every((r) => selectedIds.has(r.id))
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(results.map((r) => r.id)))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Clear selection when data changes
  useEffect(() => { setSelectedIds(new Set()) }, [results])

  /** Load competitions for selector */
  useEffect(() => {
    competitionApi.list({ current: 1, size: PAGE_SIZE.LARGE })
      .then((res) => setCompetitions(res.records))
      .catch(() => {})
  }, [])

  /** Fetch raw data (no state set) */
  const fetchData = useCallback(async () => {
    const params: Record<string, unknown> = { current: pagination.current, size: pagination.pageSize }
    if (selectedCompId) params.competitionId = selectedCompId
    if (debouncedSearch) params.keyword = debouncedSearch
    return resultApi.list(params as Parameters<typeof resultApi.list>[0])
  }, [selectedCompId, pagination.current, pagination.pageSize, debouncedSearch])

  /** Load results with state */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchData()
      setResults(res.records)
      setTotal(res.total)
      pagination.setTotal(res.total)
    } catch (err) {
      toast.error('加载成绩数据失败')
      console.error('加载成绩数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchData])

  useEffect(() => {
    fetchData().then(res => {
      setResults(res.records)
      setTotal(res.total)
      pagination.setTotal(res.total)
    }).catch(err => {
      toast.error('加载成绩数据失败')
      console.error('加载成绩数据失败:', err)
    }).finally(() => setLoading(false))
  }, [fetchData])

  // 筛选条件变化时重置到第1页
  useEffect(() => { pagination.resetPage() }, [selectedCompId, debouncedSearch])

  /** Publish all results for a competition */
  const handlePublish = async (competitionId: number) => {
    try {
      await resultApi.publish(competitionId)
      toast.success('成绩发布成功')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发布失败')
    }
  }

  const handlePublishWithConfirm = async (competitionId: number) => {
    const confirmed = await confirmDialog({
      title: '确认发布全部成绩',
      message: '发布后将对该竞赛所有已录入成绩进行公开发布，确认执行此批量操作？',
      confirmText: '确认发布',
      cancelText: '取消',
      variant: 'warning',
    })
    if (confirmed) {
      handlePublish(competitionId)
    }
  }

  const publishedCount = results.filter((r) => r.isPublished === 1).length
  const unpublishedCount = results.filter((r) => r.isPublished === 0).length

  const handleExport = async () => {
    try {
      const params: { competitionId?: number; isPublished?: number } = {}
      if (selectedCompId) params.competitionId = selectedCompId
      await exportApi.results(params)
      toast.success('导出成功')
    } catch (e) {
      console.error('加载成绩数据失败:', e)
      toast.error('导出失败')
    }
  }

  if (loading && results.length === 0) {
    return <TableSkeleton />
  }

  return (
    <>
      {/* Header bar */}
      <motion.div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <div>
          <ListMeta count={total} unit="条成绩" />
          {publishedCount > 0 && (
            <span style={{ color: 'var(--success)', fontWeight: '600', marginLeft: '12px' }}>
              {publishedCount} 条已发布
            </span>
          )}
          {unpublishedCount > 0 && (
            <span style={{ color: 'var(--text-tertiary)', fontWeight: '600', marginLeft: '12px' }}>
              {unpublishedCount} 条未发布
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
            onClick={handleExport}
          >
            <Download size={14} strokeWidth={1.5} />
            导出
          </button>
          <div className="search-wrap" style={{ width: '220px' }}>
            <Search strokeWidth={1.5} />
            <input
              className="glass-search"
              placeholder="搜索学生 / 团队 / 竞赛..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Competition selector */}
      <motion.div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }} variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
        <select
          value={selectedCompId ?? ''}
          onChange={(e) => setSelectedCompId(e.target.value ? Number(e.target.value) : null)}
          style={{
            padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px',
          }}
        >
          <option value="">全部竞赛</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>{c.competitionName}</option>
          ))}
        </select>
      </motion.div>

      {/* Results table */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <LoadingBar visible={loading && results.length > 0} />
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => { if (el) el.indeterminate = isIndeterminate }}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>竞赛名称</th>
                <th>学生/团队</th>
                <th>分数</th>
                <th>排名</th>
                <th>奖项</th>
                <th>发布状态</th>
                <th style={{ width: '140px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => {
                return (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td style={{ fontWeight: '600', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.competitionName || '-'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <div>{item.studentName || '-'}</div>
                      {item.teamName && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{item.teamName}</div>}
                    </td>
                    <td style={{ fontWeight: '600' }}>{item.score ?? '-'}</td>
                    <td>{item.ranking ?? '-'}</td>
                    <td>
                      {item.awardName ? (
                        <span className="glass-badge reviewing" style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {item.awardName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                    <td>
                      {item.isPublished === 1 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '12px' }}>
                          <Eye size={13} strokeWidth={1.5} /> 已发布
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                          <EyeOff size={13} strokeWidth={1.5} /> 未发布
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          className="text-btn blue"
                          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={async () => {
                            const compData = competitions.find(c => c.id === item.competitionId)
                            const result = await editGradeDialog({
                              studentName: item.studentName || item.teamName || '该学生',
                              defaultScore: item.score,
                              defaultRanking: item.ranking,
                              defaultAwardLevel: item.awardLevel,
                              defaultRemark: item.remark,
                              awards: compData?.awards || undefined,
                            })
                            if (result !== null) {
                              try {
                                await resultApi.update({ id: item.id, score: result.score, remark: result.remark, ranking: result.ranking, awardLevel: result.awardLevel })
                                loadData()
                                toast.success('更新成功')
                              } catch {
                                toast.error('更新失败')
                              }
                            }
                          }}
                        >
                          <Pencil size={12} strokeWidth={1.5} /> 编辑
                        </button>
                        {item.isPublished === 0 ? (
                          <button
                            className="text-btn blue"
                            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handlePublishWithConfirm(item.competitionId)}
                          >
                            <Award size={12} strokeWidth={1.5} /> 发布全部
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            {formatDate(item.publishTime)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {results.length === 0 && !loading && (
                <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    未找到匹配的成绩记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
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
