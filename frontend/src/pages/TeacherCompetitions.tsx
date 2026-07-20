import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { UserCheck, UserX, ImageIcon, ExternalLink } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import ListMeta from '../components/ListMeta'
import { ListSkeleton } from '../components/PageSkeleton'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import GlassModal from '../components/GlassModal'
import { competitionApi, registrationApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem, CompetitionDTO, RegistrationItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/toastUtils'
import { confirmDialog } from '../components/confirmDialogUtils'
import { resolveCoverUrl } from '../utils/format'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import { getStatusBadge } from '../utils/statusBadge'

export default function TeacherCompetitions() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all')
  const pagination = usePagination()
  const [managingComp, setManagingComp] = useState<CompetitionItem | null>(null)
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([])
  const [regLoading, setRegLoading] = useState(false)
  const [rejectingRegId, setRejectingRegId] = useState<number | null>(null)
  const [rejectRemark, setRejectRemark] = useState('')
  const [selectedRegIds, setSelectedRegIds] = useState<number[]>([])
  const fetchData = useCallback(async () => {
    if (!user) return null
    const params: Record<string, unknown> = { current: pagination.current, size: pagination.pageSize, publisherId: user.id }
    if (statusFilter !== 'all') params.status = statusFilter
    return competitionApi.list(params as Parameters<typeof competitionApi.list>[0])
  }, [user, statusFilter, pagination.current, pagination.pageSize])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchData()
      if (!result) return
      setCompetitions(result.records)
      pagination.setTotal(result.total)
    } catch (err) { toast.error('加载竞赛列表失败'); console.error('加载竞赛失败:', err) }
    finally { setLoading(false) }
  }, [fetchData])

  useEffect(() => {
    fetchData().then(result => {
      if (!result) return
      setCompetitions(result.records)
      pagination.setTotal(result.total)
    }).catch(err => { toast.error('加载竞赛列表失败'); console.error('加载竞赛失败:', err) })
      .finally(() => setLoading(false))
  }, [fetchData])

  // 筛选条件变化时重置到第1页
  useEffect(() => { pagination.resetPage() }, [statusFilter])

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({ message: '确定要删除此竞赛吗？', variant: 'danger', confirmText: '删除' })
    if (!confirmed) return
    try { await competitionApi.delete(id); loadData(); toast.success('删除成功') }
    catch (err) { toast.error(err instanceof Error ? err.message : '删除失败') }
  }

  const handleSubmitReview = async (id: number) => {
    try {
      await competitionApi.update({ id, status: 1 } as CompetitionDTO)
      loadData()
      toast.success('已提交审核')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '提交失败')
    }
  }

  const openManage = async (comp: CompetitionItem) => {
    setManagingComp(comp)
    setSelectedRegIds([])
    setRegLoading(true)
    try {
      const result = await registrationApi.list({ current: 1, size: PAGE_SIZE.LARGE, competitionId: comp.id })
      setRegistrations(result.records)
    } catch (err) {
      toast.error('加载报名列表失败')
      console.error('加载报名列表失败:', err)
      setRegistrations([])
    } finally {
      setRegLoading(false)
    }
  }

  const handleAuditReg = async (id: number, status: number, auditRemark?: string) => {
    try {
      await registrationApi.audit(id, { status, auditRemark })
      setRejectingRegId(null)
      setRejectRemark('')
      if (managingComp) {
        const result = await registrationApi.list({ current: 1, size: PAGE_SIZE.LARGE, competitionId: managingComp.id })
        setRegistrations(result.records)
      }
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '审核失败')
    }
  }

  const toggleSelectAll = useCallback(() => {
    const pendingIds = registrations.filter(r => r.status === 0).map(r => r.id)
    if (selectedRegIds.length === pendingIds.length && pendingIds.length > 0) {
      setSelectedRegIds([])
    } else {
      setSelectedRegIds(pendingIds)
    }
  }, [registrations, selectedRegIds])

  const toggleSelectReg = (id: number) => {
    setSelectedRegIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
  }

  const handleBatchAudit = async (status: number) => {
    if (selectedRegIds.length === 0) return
    try {
      await registrationApi.batchAudit({ ids: selectedRegIds, status })
      setSelectedRegIds([])
      toast.success(status === 1 ? '批量审核通过' : '已批量拒绝')
      if (managingComp) {
        const result = await registrationApi.list({ current: 1, size: PAGE_SIZE.LARGE, competitionId: managingComp.id })
        setRegistrations(result.records)
      }
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '批量审核失败')
    }
  }

  const formatShortDate = (dateStr: string) => dateStr ? dateStr.slice(5, 10) : '-'

  if (loading && competitions.length === 0) return <ListSkeleton />

  return (
    <>
      <motion.div style={{ marginBottom: '16px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <div className="chip-row">
          {[{ key: 'all', label: '全部' }, { key: 0, label: '草稿' }, { key: 2, label: '已发布' }, { key: 3, label: '进行中' }, { key: 4, label: '已结束' }].map((opt) => (
            <button key={String(opt.key)} className={`chip ${statusFilter === opt.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(opt.key as number | 'all')}>
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }}
        variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div variants={staggerItem}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>封面</th><th>竞赛名称</th><th>报名时间</th><th>报名人数</th><th>状态</th><th style={{ width: '120px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((comp) => {
                const badge = getStatusBadge(comp.status)
                return (
                  <tr key={comp.id}>
                    <td>
                      {resolveCoverUrl(comp.coverImage) ? (
                        <img
                          src={resolveCoverUrl(comp.coverImage)!}
                          alt=""
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                          style={{ width: '44px', height: '32px', objectFit: 'cover', borderRadius: '6px', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          width: '44px', height: '32px', borderRadius: '6px',
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.10) 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <ImageIcon size={14} strokeWidth={1.2} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {comp.competitionName}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {formatShortDate(comp.registrationStart)} ~ {formatShortDate(comp.registrationEnd)}
                    </td>
                    <td><span style={{ fontWeight: '600' }}>{comp.registrationCount}</span></td>
                    <td>
                      <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '11px', padding: '2px 8px' }}>{badge.label}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="text-btn blue" style={{ fontSize: '12px' }} onClick={() => openManage(comp)}>管理</button>
                        {(comp.status === 0 || comp.status === 5) && (
                          <button className="text-btn" style={{ fontSize: '12px', color: 'var(--accent)' }} onClick={() => navigate(`/teacher/competitions/${comp.id}/edit`)}>编辑</button>
                        )}
                        {comp.status === 0 && (
                          <button className="text-btn" style={{ fontSize: '12px', color: 'var(--success)' }} onClick={() => handleSubmitReview(comp.id)}>提交审核</button>
                        )}
                        {comp.status === 5 && (
                          <button className="text-btn" style={{ fontSize: '12px', color: 'var(--success)' }} onClick={() => handleSubmitReview(comp.id)}>修改后重新提交</button>
                        )}
                        <button className="text-btn" style={{ fontSize: '12px', color: 'var(--danger)' }} onClick={() => handleDelete(comp.id)}>删除</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {competitions.length === 0 && !loading && (
                <tr><td colSpan={7}><EmptyState text="暂无竞赛" /></td></tr>
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

      {/* Manage Modal */}
      <GlassModal open={!!managingComp} onClose={() => setManagingComp(null)} maxWidth="600px">

              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', paddingRight: '24px' }}>
                {managingComp?.competitionName}
              </div>
              <ListMeta count={registrations.length} unit="条报名记录" />

              {registrations.filter(r => r.status === 0).length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
                  padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input type="checkbox"
                      checked={selectedRegIds.length > 0 && selectedRegIds.length === registrations.filter(r => r.status === 0).length}
                      onChange={toggleSelectAll}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    全选
                  </label>
                  <div style={{ flex: 1 }} />
                  <button className="text-btn blue" style={{ fontSize: '12px', opacity: selectedRegIds.length === 0 ? 0.4 : 1 }}
                    disabled={selectedRegIds.length === 0} onClick={() => handleBatchAudit(1)}>
                    批量通过
                  </button>
                  <button className="text-btn danger" style={{ fontSize: '12px', opacity: selectedRegIds.length === 0 ? 0.4 : 1 }}
                    disabled={selectedRegIds.length === 0} onClick={() => handleBatchAudit(2)}>
                    批量拒绝
                  </button>
                </div>
              )}

              {regLoading ? (
                <ListSkeleton />
              ) : registrations.length === 0 ? (
                <EmptyState text="暂无报名记录" />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '36px' }}></th>
                      <th>学生姓名</th>
                      <th>队伍</th>
                      <th>联系电话</th>
                      <th>附件</th>
                      <th>报名时间</th>
                      <th>状态</th>
                      <th style={{ width: '130px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => {
                      const badge = getStatusBadge(reg.status, 'registration')
                      return (
                        <tr key={reg.id}>
                          <td style={{ textAlign: 'center' }}>
                            {reg.status === 0 ? (
                              <input type="checkbox"
                                checked={selectedRegIds.includes(reg.id)}
                                onChange={() => toggleSelectReg(reg.id)}
                                style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                              />
                            ) : null}
                          </td>
                          <td style={{ fontWeight: '600' }}>{reg.studentName || '-'}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                            {reg.teamName || <span style={{ color: 'var(--text-tertiary)' }}>个人</span>}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{reg.contactPhone || '-'}</td>
                          <td style={{ fontSize: '12px' }}>
                            {reg.attachmentUrl ? (
                              <a href={reg.attachmentUrl} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--accent)', textDecoration: 'none' }}>
                                <ExternalLink size={11} strokeWidth={1.5} /> 查看
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{reg.createTime?.slice(0, 10) || '-'}</td>
                          <td>
                            <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                              {badge.label}
                            </span>
                          </td>
                          <td>
                            {reg.status === 0 ? (
                              rejectingRegId === reg.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <input
                                    type="text"
                                    value={rejectRemark}
                                    onChange={e => setRejectRemark(e.target.value)}
                                    placeholder="审核备注（可选）"
                                    style={{
                                      padding: '4px 8px', fontSize: '11px', borderRadius: '6px',
                                      border: '1px solid var(--border-color, #e0e0e0)',
                                      background: 'var(--bg-secondary, #f5f5f5)',
                                      color: 'var(--text-primary)', outline: 'none', width: '130px',
                                      boxSizing: 'border-box',
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button className="text-btn danger" style={{ fontSize: '11px' }}
                                      onClick={() => handleAuditReg(reg.id, 2, rejectRemark || undefined)}>
                                      确认拒绝
                                    </button>
                                    <button className="text-btn" style={{ fontSize: '11px' }}
                                      onClick={() => { setRejectingRegId(null); setRejectRemark('') }}>
                                      取消
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="text-btn blue" style={{ fontSize: '11px' }}
                                    onClick={() => handleAuditReg(reg.id, 1)}>
                                    通过
                                  </button>
                                  <button className="text-btn danger" style={{ fontSize: '11px' }}
                                    onClick={() => { setRejectingRegId(reg.id); setRejectRemark('') }}>
                                    拒绝
                                  </button>
                                </div>
                              )
                            ) : reg.status === 1 ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--success)' }}>
                                <UserCheck size={12} /> 已通过
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--danger)' }}>
                                <UserX size={12} /> 已拒绝
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
      </GlassModal>

    </>
  )
}
