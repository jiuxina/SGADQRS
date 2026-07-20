import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Calendar,
  UserCheck,
  Phone,
  ExternalLink,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import DigitRoller from '../components/DigitRoller'
import { fadeInList, fadeSlideUp } from '../motion/variants'
import GlassModal from '../components/GlassModal'
import { registrationApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { RegistrationItem } from '../api/types'
import { toast } from '../components/toastUtils'
import { confirmDialog } from '../components/confirmDialogUtils'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatDate } from '../utils/format'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'

type FilterKey = 'all' | 0 | 1 | 2

const filterLabels: Record<string, string> = {
  all: '全部',
  0: '待审核',
  1: '已通过',
  2: '已拒绝',
}

const statusMap: Record<number, { badge: string; label: string }> = {
  0: { badge: 'pending', label: '待审核' },
  1: { badge: 'pass', label: '已通过' },
  2: { badge: 'fail', label: '已拒绝' },
}

const statusColorMap: Record<number, string> = {
  0: 'var(--warning)',
  1: 'var(--success)',
  2: 'var(--danger)',
}

export default function StudentRegistration() {
  const user = useAuthStore((s) => s.user)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReg, setSelectedReg] = useState<RegistrationItem | null>(null)
  const isMobile = useIsMobile()
  const pagination = usePagination()

  const fetchData = useCallback(async () => {
    if (!user) return null
    const params: Record<string, unknown> = { current: pagination.current, size: pagination.pageSize, studentId: user.id }
    if (filter !== 'all') params.status = filter
    return registrationApi.list(params as Parameters<typeof registrationApi.list>[0])
  }, [user, filter, pagination.current, pagination.pageSize])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchData()
      if (!result) return
      setRegistrations(result.records)
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
      if (!result) return
      setRegistrations(result.records)
      pagination.setTotal(result.total)
    }).catch(err => {
      toast.error('加载报名数据失败')
      console.error('加载报名数据失败:', err)
    }).finally(() => setLoading(false))
  }, [fetchData])

  // 筛选条件变化时重置到第1页
  useEffect(() => { pagination.resetPage() }, [filter])

  const handleCancel = async (id: number) => {
    const confirmed = await confirmDialog({ message: '确定要取消报名吗？', variant: 'danger', confirmText: '取消报名' })
    if (!confirmed) return
    try {
      await registrationApi.cancel(id)
      loadData()
      toast.success('取消成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '取消失败')
    }
  }

  const stats = {
    total: registrations.length,
    approved: registrations.filter((r) => r.status === 1).length,
    pending: registrations.filter((r) => r.status === 0).length,
    rejected: registrations.filter((r) => r.status === 2).length,
  }

  if (loading && registrations.length === 0) {
    return <ListSkeleton />
  }

  return (
    <>
      {/* Summary stats row */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}
        variants={fadeInList}
        initial="hidden"
        animate="visible"
      >
        <div className="metric-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <FileText size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>总报名数</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.total} />
          </div>
        </div>
        <div className="metric-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <CheckCircle size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已通过</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.approved} />
          </div>
        </div>
        <div className="metric-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Clock size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>待审核</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.pending} />
          </div>
        </div>
        <div className="metric-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <XCircle size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已拒绝</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.rejected} />
          </div>
        </div>
      </motion.div>

      {/* Filter chips */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }} style={{ marginTop: '16px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            报名记录
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {registrations.length}条
            </span>
          </span>
        </div>
        <div className="chip-row">
          {(Object.keys(filterLabels) as string[]).map((key) => (
            <button
              key={key}
              className={`chip ${filter === (key === 'all' ? 'all' : Number(key)) ? 'active' : ''}`}
              onClick={() => setFilter(key === 'all' ? 'all' : Number(key) as FilterKey)}
            >
              {filterLabels[key]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Registration cards grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={String(filter)}
          variants={fadeInList}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '16px',
          }}
        >
          {registrations.map((reg) => {
            const st = statusMap[reg.status] || statusMap[0]
            const accentColor = statusColorMap[reg.status] || 'var(--gray-2)'
            return (
              <div
                key={reg.id}
                className="glass-card glass-card-vertical glass-card-static"
                style={{ padding: '18px' }}
              >
                {/* Top: Name + status */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.35, flex: 1 }}>
                      {reg.competitionName || '-'}
                    </span>
                    <span
                      className={`glass-badge ${st.badge}`}
                      style={{ fontSize: '11px', padding: '2px 8px', flexShrink: 0 }}
                    >
                      {st.label}
                    </span>
                  </div>

                  {/* Status accent line */}
                  <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: accentColor, marginBottom: '10px' }} />
                </div>

                {/* Meta info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <Users size={12} strokeWidth={1.5} />
                    队伍：{reg.teamName || <span style={{ color: 'var(--text-tertiary)' }}>暂未分配</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <UserCheck size={12} strokeWidth={1.5} />
                    角色：{reg.isTeamLeader === 1 ? (
                      <span style={{ fontWeight: '600', color: 'var(--accent)' }}>队长</span>
                    ) : (
                      <span>队员</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <Calendar size={12} strokeWidth={1.5} />
                    报名时间：{formatDate(reg.createTime)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <Phone size={12} strokeWidth={1.5} />
                    联系电话：{reg.contactPhone || '-'}
                  </div>
                  {reg.attachmentUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      <ExternalLink size={12} strokeWidth={1.5} />
                      附件：<a href={reg.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>查看附件</a>
                    </div>
                  )}
                  {reg.auditTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      <Clock size={12} strokeWidth={1.5} />
                      审核时间：{formatDate(reg.auditTime)}
                    </div>
                  )}
                </div>

                {/* Audit remark */}
                {reg.auditRemark && (
                  <div style={{
                    fontSize: '12px',
                    color: reg.status === 2 ? 'var(--danger)' : 'var(--text-secondary)',
                    background: 'rgba(0,0,0,0.02)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    lineHeight: 1.5,
                  }}>
                    审核备注：{reg.auditRemark}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button className="btn ghost" style={{ flex: 1, height: '32px', fontSize: '12px' }} onClick={() => setSelectedReg(reg)}>
                    查看详情
                  </button>
                  {reg.status === 0 && (
                    <button className="btn danger" style={{ flex: 1, height: '32px', fontSize: '12px' }} onClick={() => handleCancel(reg.id)}>
                      取消报名
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {registrations.length === 0 && !loading && (
        <EmptyState text="暂无报名记录" />
      )}

      <Pagination
        current={pagination.current}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setCurrent}
        onPageSizeChange={pagination.setPageSize}
      />

      {/* Detail Modal */}
      <GlassModal open={!!selectedReg} onClose={() => setSelectedReg(null)} title="报名详情" maxWidth="80vw">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>竞赛名称</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.4 }}>{selectedReg?.competitionName || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>队伍名称</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedReg?.teamName || '暂未分配'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>角色</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedReg?.isTeamLeader === 1 ? '队长' : '队员'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>联系电话</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedReg?.contactPhone || '-'}</div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>状态</div>
                    <span className={`glass-badge ${(statusMap[selectedReg?.status ?? 0] || statusMap[0]).badge}`} style={{ fontSize: '12px', padding: '3px 10px' }}>
                      {(statusMap[selectedReg?.status ?? 0] || statusMap[0]).label}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>报名时间</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedReg ? formatDate(selectedReg.createTime) : '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>审核时间</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedReg?.auditTime ? formatDate(selectedReg.auditTime) : '-'}</div>
                  </div>
                  {selectedReg?.attachmentUrl && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>附件</div>
                      <a href={selectedReg.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ExternalLink size={14} strokeWidth={1.5} />
                        查看附件
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Full-width sections below */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedReg?.auditRemark && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>审核备注</div>
                    <div style={{
                      fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6,
                      padding: '12px 14px', borderRadius: '10px',
                      background: selectedReg.status === 2 ? 'rgba(239,68,68,0.06)' : 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                    }}>
                      {selectedReg.auditRemark}
                    </div>
                  </div>
                )}
                {selectedReg?.remark && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>备注</div>
                    <div style={{
                      fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6,
                      padding: '12px 14px', borderRadius: '10px',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    }}>
                      {selectedReg.remark}
                    </div>
                  </div>
                )}
              </div>
      </GlassModal>
    </>
  )
}

