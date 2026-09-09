import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { motion } from 'motion/react'
import { Search, Eye, Download } from 'lucide-react'

import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { competitionApi, exportApi } from '../api'
import type { CompetitionItem } from '../api/types'
import { toast } from '../components/toastUtils'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmDialog } from '../components/confirmDialogUtils'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import { ListSkeleton, LoadingBar } from '../components/PageSkeleton'
import { getStatusBadge } from '../utils/statusBadge'
import PageTabs, { usePageTab } from '../components/PageTabs'
import AdminTeams from './AdminTeams'
import AdminGrades from './AdminGrades'

type FilterStatus = 'all' | 1 | 2 | 3 | 4 | 0 | 5

const ADMIN_COMP_TABS = [
  { key: 'list', label: '竞赛列表' },
  { key: 'teams', label: '队伍审核' },
  { key: 'grades', label: '成绩管理' },
]

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 2, label: '已发布' },
  { key: 3, label: '进行中' },
  { key: 4, label: '已结束' },
  { key: 0, label: '草稿' },
]

export default function AdminCompetitions() {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pagination = usePagination()
  const navigate = useNavigate()
  const [pageTab, setPageTab] = usePageTab(ADMIN_COMP_TABS)
  const [searchParams] = useSearchParams()

  // 顶栏搜索跳转带来的 ?search= 同步到页内搜索框
  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearchQuery(q)
  }, [searchParams])

  const handleDelete = async (id: number, name: string, teamCount: number) => {
    const confirmed = await confirmDialog({
      message: teamCount > 0
        ? `确定要删除竞赛「${name}」吗？其下 ${teamCount} 支参赛队伍将一并删除。`
        : `确定要删除竞赛「${name}」吗？`,
      variant: 'danger',
      confirmText: '删除',
    })
    if (!confirmed) return
    try {
      await competitionApi.delete(id)
      toast.success('删除成功')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current: pagination.current, size: pagination.pageSize }
      if (filter !== 'all') params.status = filter
      if (debouncedSearch) params.keyword = debouncedSearch
      const result = await competitionApi.list(params as Parameters<typeof competitionApi.list>[0])
      setCompetitions(result.records)
      setTotal(result.total)
      pagination.setTotal(result.total)
    } catch (err) {
      toast.error('加载竞赛数据失败')
      console.error('加载竞赛数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [filter, debouncedSearch, pagination.current, pagination.pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 筛选条件变化时重置到第1页
  useEffect(() => {
    pagination.resetPage()
  }, [filter, debouncedSearch])


  const handleExport = async () => {
    try {
      const params: { status?: number; keyword?: string } = {}
      if (filter !== 'all') params.status = filter as number
      if (debouncedSearch) params.keyword = debouncedSearch
      await exportApi.competitions(params)
      toast.success('导出成功')
    } catch (e) {
      console.error('加载竞赛列表失败:', e)
      toast.error('导出失败')
    }
  }

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return dateStr.slice(5, 10)
  }

  if (pageTab === 'teams') {
    return (
      <>
        <PageTabs tabs={ADMIN_COMP_TABS} active={pageTab} onChange={setPageTab} />
        <AdminTeams />
      </>
    )
  }

  if (pageTab === 'grades') {
    return (
      <>
        <PageTabs tabs={ADMIN_COMP_TABS} active={pageTab} onChange={setPageTab} />
        <AdminGrades />
      </>
    )
  }

  if (loading && competitions.length === 0) {
    return <ListSkeleton />
  }

  return (
    <>
      <PageTabs tabs={ADMIN_COMP_TABS} active={pageTab} onChange={setPageTab} />

      <motion.div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            共 {total} 项竞赛
          </span>
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
              placeholder="搜索竞赛名称 / 发布者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>
      </motion.div>

      <motion.div style={{ marginBottom: '12px' }} variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
        <div className="chip-row">
          {filterOptions.map((opt) => (
            <button key={String(opt.key)} className={`chip ${filter === opt.key ? 'active' : ''}`} onClick={() => setFilter(opt.key)}>
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <LoadingBar visible={loading && competitions.length > 0} />
        <motion.div variants={staggerItem}>
          <table className="data-table">
            <thead>
              <tr>
                <th>竞赛名称</th>
                <th>发布者</th>
                <th>报名时间</th>
                <th>参赛队伍</th>
                <th>状态</th>
                <th style={{ width: '140px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((comp) => {
                const badge = getStatusBadge(comp.status)
                return (
                  <tr key={comp.id}>
                    <td style={{ fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {comp.competitionName}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{comp.publisherName || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {formatShortDate(comp.registrationStart)} ~ {formatShortDate(comp.registrationEnd)}
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{comp.registrationCount}</span>
                    </td>
                    <td>
                      <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '12px', padding: '2px 8px' }}>
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      {(
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="text-btn" style={{ fontSize: '12px', color: 'var(--accent)' }}
                            onClick={() => navigate(`/admin/competitions/${comp.id}/edit`)}>
                            编辑
                          </button>
                          <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => navigate(`/admin/competitions/${comp.id}`)}>
                            <Eye size={12} strokeWidth={1.5} /> 详情
                          </button>
                          <button className="text-btn" style={{ fontSize: '12px', color: 'var(--danger)' }}
                            onClick={() => handleDelete(comp.id, comp.competitionName, comp.registrationCount)}>
                            删除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {competitions.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    未找到匹配的竞赛
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

      {/* Detail Modal */}
    </>
  )
}
