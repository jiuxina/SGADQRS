import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { Search, CheckCircle, XCircle, Phone, Download } from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { registrationApi, competitionApi, exportApi } from '../api'
import type { RegistrationItem, CompetitionItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/toastUtils'
import { formatDate } from '../utils/format'
import { usePagination } from '../hooks/usePagination'
import ListMeta from '../components/ListMeta'
import Pagination from '../components/Pagination'
import { ListSkeleton } from '../components/PageSkeleton'
import { getStatusBadge } from '../utils/statusBadge'

type FilterStatus = 'all' | 0 | 1 | 2

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 0, label: '待审核' },
  { key: 1, label: '已通过' },
  { key: 2, label: '已拒绝' },
]

export default function AdminRegistrations() {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([])
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

  /** Build API params */
  const buildParams = useCallback(() => {
    const params: Record<string, unknown> = { current: pagination.current, size: pagination.pageSize }
    if (selectedCompId) params.competitionId = selectedCompId
    if (filter !== 'all') params.status = filter
    return params
  }, [selectedCompId, filter, pagination.current, pagination.pageSize])

  /** Fetch raw data (no state) */
  const fetchData = useCallback(async () => {
    const params = buildParams()
    const res = await registrationApi.list(params as Parameters<typeof registrationApi.list>[0])
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
    return { records, total: res.total }
  }, [buildParams, searchQuery])

  /** Load registrations with loading state */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchData()
      setRegistrations(result.records)
      setTotal(result.total)
      pagination.setTotal(result.total)
    } catch (err) {
      toast.error('加载报名数据失败')
      console.error('加载报名数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchData])

  useEffect(() => {
    fetchData().then(result => {
      setRegistrations(result.records)
      setTotal(result.total)
      pagination.setTotal(result.total)
    }).catch(err => {
      toast.error('加载报名数据失败')
      console.error('加载报名数据失败:', err)
    }).finally(() => setLoading(false))
  }, [fetchData])

  // 筛选条件变化时重置到第1页
  useEffect(() => { pagination.resetPage() }, [selectedCompId, filter, searchQuery])

  /** Audit a registration */
  const handleAudit = async (id: number, status: number) => {
    try {
      await registrationApi.audit(id, { status })
      toast.success(status === 1 ? '审核通过' : '已拒绝')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const pendingCount = registrations.filter((r) => r.status === 0).length

  const handleExport = async () => {
    try {
      const params: { competitionId?: number; status?: number } = {}
      if (selectedCompId) params.competitionId = selectedCompId
      if (filter !== 'all') params.status = filter as number
      await exportApi.registrations(params)
      toast.success('导出成功')
    } catch (e) {
      console.error('加载报名数据失败:', e)
      toast.error('导出失败')
    }
  }

  if (loading && registrations.length === 0) {
    return <ListSkeleton />
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
          <ListMeta count={total} unit="条报名记录" />
          {pendingCount > 0 && (
            <span style={{ color: 'var(--warning)', fontWeight: '600', marginLeft: '12px' }}>
              {pendingCount} 条待审核
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

      {/* Competition selector + status filter */}
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
        <div className="chip-row">
          {filterOptions.map((opt) => (
            <button key={String(opt.key)} className={`chip ${filter === opt.key ? 'active' : ''}`} onClick={() => setFilter(opt.key)}>
              {opt.label}
              {opt.key === 0 && pendingCount > 0 && (
                <span style={{
                  marginLeft: '6px', background: 'var(--warning)', color: '#fff',
                  borderRadius: '8px', padding: '0 5px', fontSize: '10px', fontWeight: '700',
                }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Registrations table */}
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
                <th>学生</th>
                <th>团队</th>
                <th>联系方式</th>
                <th>报名时间</th>
                <th>状态</th>
                <th style={{ width: '140px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => {
                const badge = getStatusBadge(reg.status, 'registration')
                return (
                  <tr key={reg.id}>
                    <td style={{ fontWeight: '600', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {reg.competitionName || '-'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <div>{reg.studentName || '-'}</div>
                      {reg.isTeamLeader === 1 && (
                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '600' }}>队长</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{reg.teamName || '-'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {reg.contactPhone ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={11} strokeWidth={1.5} /> {reg.contactPhone}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{formatDate(reg.createTime)}</td>
                    <td>
                      <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      {reg.status === 0 ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="text-btn blue" style={{ fontSize: '12px' }}
                            onClick={() => handleAudit(reg.id, 1)}>
                            通过
                          </button>
                          <button className="text-btn danger" style={{ fontSize: '12px' }}
                            onClick={() => handleAudit(reg.id, 2)}>
                            拒绝
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {reg.status === 1 ? <CheckCircle size={13} strokeWidth={1.5} /> : <XCircle size={13} strokeWidth={1.5} />}
                          {reg.auditTime ? formatDate(reg.auditTime) : '-'}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {registrations.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    未找到匹配的报名记录
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
