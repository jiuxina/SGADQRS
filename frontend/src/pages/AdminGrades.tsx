import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { Search, Award, Eye, EyeOff, Download } from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { resultApi, competitionApi, exportApi } from '../api'
import type { ResultItem, CompetitionItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/toastUtils'
import { formatDate } from '../utils/format'
import { usePagination } from '../hooks/usePagination'
import ListMeta from '../components/ListMeta'
import Pagination from '../components/Pagination'
import { TableSkeleton } from '../components/PageSkeleton'

export default function AdminGrades() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<ResultItem[]>([])
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pagination = usePagination()

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
    return resultApi.list(params as Parameters<typeof resultApi.list>[0])
  }, [selectedCompId, pagination.current, pagination.pageSize])

  /** Load results with state */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchData()
      let records = res.records
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        records = records.filter(
          (r) =>
            (r.studentName && r.studentName.toLowerCase().includes(q)) ||
            (r.teamName && r.teamName.toLowerCase().includes(q)) ||
            (r.competitionName && r.competitionName.toLowerCase().includes(q))
        )
      }
      setResults(records)
      setTotal(res.total)
      pagination.setTotal(res.total)
    } catch (err) {
      toast.error('加载成绩数据失败')
      console.error('加载成绩数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchData, searchQuery])

  useEffect(() => {
    fetchData().then(res => {
      let records = res.records
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        records = records.filter(
          (r) =>
            (r.studentName && r.studentName.toLowerCase().includes(q)) ||
            (r.teamName && r.teamName.toLowerCase().includes(q)) ||
            (r.competitionName && r.competitionName.toLowerCase().includes(q))
        )
      }
      setResults(records)
      setTotal(res.total)
      pagination.setTotal(res.total)
    }).catch(err => {
      toast.error('加载成绩数据失败')
      console.error('加载成绩数据失败:', err)
    }).finally(() => setLoading(false))
  }, [fetchData, searchQuery])

  // 筛选条件变化时重置到第1页
  useEffect(() => { pagination.resetPage() }, [selectedCompId, searchQuery])

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
          <table className="data-table">
            <thead>
              <tr>
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
                      {item.isPublished === 0 ? (
                        <button
                          className="text-btn blue"
                          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handlePublish(item.competitionId)}
                        >
                          <Award size={12} strokeWidth={1.5} /> 发布
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {formatDate(item.publishTime)}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {results.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
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
