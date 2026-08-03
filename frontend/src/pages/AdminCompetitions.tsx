import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { motion, AnimatePresence } from 'motion/react'
import { Search, X, Eye, Calendar, MapPin, Users, Clock, Download } from 'lucide-react'

import { staggerContainer, staggerItem, fadeSlideUp, panelSlideIn } from '../motion/variants'
import { competitionApi, exportApi } from '../api'
import type { CompetitionItem } from '../api/types'
import { toast } from '../components/toastUtils'
import { formatDate, resolveCoverUrl, formatFileSize } from '../utils/format'
import { useIsMobile } from '../hooks/useIsMobile'
import { useNavigate } from 'react-router-dom'
import { confirmDialog } from '../components/confirmDialogUtils'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import { ListSkeleton, LoadingBar } from '../components/PageSkeleton'
import { getStatusBadge } from '../utils/statusBadge'

type FilterStatus = 'all' | 1 | 2 | 3 | 4 | 0 | 5

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 1, label: '待审核' },
  { key: 2, label: '已发布' },
  { key: 3, label: '进行中' },
  { key: 4, label: '已结束' },
  { key: 0, label: '草稿' },
  { key: 5, label: '已驳回' },
]

export default function AdminCompetitions() {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pagination = usePagination()
  const [selectedComp, setSelectedComp] = useState<CompetitionItem | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null)
  const [rejectRemark, setRejectRemark] = useState('')
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const handleDelete = async (id: number, name: string, registrationCount: number) => {
    if (registrationCount > 0) {
      toast.error('该竞赛已有报名记录，无法删除')
      return
    }
    const confirmed = await confirmDialog({
      message: `确定要删除竞赛「${name}」吗？`,
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

  const handleAudit = async (id: number, status: number) => {
    try {
      await competitionApi.audit(id, status)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectModal) return
    try {
      await competitionApi.audit(rejectModal.id, 5, rejectRemark)
      toast.success('已驳回')
      setRejectModal(null)
      setRejectRemark('')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const pendingCount = competitions.filter((c) => c.status === 1).length

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

  if (loading && competitions.length === 0) {
    return <ListSkeleton />
  }

  return (
    <>
      <motion.div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            共 {total} 项竞赛
            {pendingCount > 0 && (
              <span style={{ color: 'var(--warning)', fontWeight: '600', marginLeft: '12px' }}>
                {pendingCount} 项待审核
              </span>
            )}
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

      <motion.div style={{ marginBottom: '16px' }} variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
        <div className="chip-row">
          {filterOptions.map((opt) => (
            <button key={String(opt.key)} className={`chip ${filter === opt.key ? 'active' : ''}`} onClick={() => setFilter(opt.key)}>
              {opt.label}
              {opt.key === 1 && pendingCount > 0 && (
                <span style={{
                  marginLeft: '6px', color: 'var(--warning)',
                  borderRadius: '8px', padding: '0 5px', fontSize: '10px', fontWeight: '700',
                }}>
                  {pendingCount}
                </span>
              )}
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
                <th>报名人数</th>
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
                      <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      {comp.status === 1 ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="text-btn blue" style={{ fontSize: '12px' }}
                            onClick={() => handleAudit(comp.id, 2)}>
                            通过
                          </button>
                          <button className="text-btn danger" style={{ fontSize: '12px' }}
                            onClick={() => setRejectModal({ id: comp.id, name: comp.competitionName })}>
                            拒绝
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {(comp.status === 0 || comp.status === 5) && (
                            <button className="text-btn" style={{ fontSize: '12px', color: 'var(--accent)' }}
                              onClick={() => navigate(`/admin/competitions/${comp.id}/edit`)}>
                              编辑
                            </button>
                          )}
                          <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setSelectedComp(comp)}>
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
      <AnimatePresence>
        {selectedComp && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedComp(null)}
          >
            <motion.div
              className="glass-card glass-card-vertical glass-card-static"
              style={{ width: isMobile ? 'calc(100vw - 32px)' : '520px', maxHeight: '80vh', overflow: 'auto', padding: '24px', position: 'relative' }}
              variants={panelSlideIn}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedComp(null)}
                className="icon-btn"
                style={{ position: 'absolute', top: '16px', right: '16px' }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>

              {/* Cover Image */}
              {resolveCoverUrl(selectedComp.coverImage) && (
                <img
                  src={resolveCoverUrl(selectedComp.coverImage)!}
                  alt={selectedComp.competitionName}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  style={{
                    width: '100%', height: '180px', objectFit: 'cover',
                    borderRadius: '12px', marginBottom: '16px',
                  }}
                />
              )}

              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', paddingRight: '24px' }}>
                {selectedComp.competitionName}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <span className={`glass-badge ${getStatusBadge(selectedComp.status).cls}`} style={{ fontSize: '11px', padding: '3px 10px' }}>
                  {getStatusBadge(selectedComp.status).label}
                </span>
              </div>

              {selectedComp.description && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  {selectedComp.description}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Users size={13} strokeWidth={1.5} />
                  主办方：{selectedComp.organizer || '-'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <MapPin size={13} strokeWidth={1.5} />
                  地点：{selectedComp.location || '待定'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Calendar size={13} strokeWidth={1.5} />
                  报名：{formatDate(selectedComp.registrationStart)} ~ {formatDate(selectedComp.registrationEnd)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Clock size={13} strokeWidth={1.5} />
                  比赛：{formatDate(selectedComp.competitionStart)} ~ {formatDate(selectedComp.competitionEnd)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedComp.registrationCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>已报名</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedComp.maxTeams || '-'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>最大队伍数</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedComp.maxMembers}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>每队人数</div>
                </div>
              </div>

              {selectedComp.rules && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>竞赛规则</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                    {selectedComp.rules}
                  </div>
                </div>
              )}

              {selectedComp.attachments && selectedComp.attachments.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>附件</div>
                  {selectedComp.attachments.map((att) => (
                    <a key={att.fileUrl} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', padding: '4px 0' }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.fileName}</span>
                      {att.fileType && <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', flexShrink: 0 }}>{att.fileType}</span>}
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', flexShrink: 0 }}>{formatFileSize(att.fileSize)}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Admin actions in detail modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                {(selectedComp.status === 0 || selectedComp.status === 5) && (
                  <button className="text-btn" style={{ fontSize: '13px', color: 'var(--accent)' }}
                    onClick={() => { navigate(`/admin/competitions/${selectedComp.id}/edit`); setSelectedComp(null) }}>
                    编辑竞赛
                  </button>
                )}
                <button className="text-btn danger" style={{ fontSize: '13px' }}
                  onClick={() => {
                    const comp = selectedComp
                    setSelectedComp(null)
                    handleDelete(comp!.id, comp!.competitionName, comp!.registrationCount)
                  }}>
                  删除竞赛
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setRejectModal(null); setRejectRemark('') }}
          >
            <motion.div
              className="glass-card glass-card-vertical glass-card-static"
              style={{ width: isMobile ? 'calc(100vw - 32px)' : '420px', padding: '24px', position: 'relative' }}
              variants={panelSlideIn}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>驳回竞赛</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                确定要驳回「{rejectModal.name}」吗？
              </div>

              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>备注（选填）</div>
              <textarea
                value={rejectRemark}
                onChange={(e) => setRejectRemark(e.target.value)}
                placeholder="请输入驳回原因..."
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: '13px', resize: 'vertical',
                  outline: 'none', boxSizing: 'border-box', marginBottom: '20px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="text-btn"
                  style={{ fontSize: '13px' }}
                  onClick={() => { setRejectModal(null); setRejectRemark('') }}
                >
                  取消
                </button>
                <button
                  className="text-btn danger"
                  style={{ fontSize: '13px', fontWeight: '600' }}
                  onClick={handleRejectConfirm}
                >
                  确认驳回
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}
