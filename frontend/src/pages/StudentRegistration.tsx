import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  X,
  Users,
  Calendar,
  UserCheck,
  Phone,
  ExternalLink,
} from 'lucide-react'
import DigitRoller from '../components/DigitRoller'
import { staggerContainer, staggerItem, fadeSlideUp, panelSlideIn } from '../motion/variants'
import { registrationApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { RegistrationItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/Toast'
import { confirmDialog } from '../components/ConfirmDialog'
import { useIsMobile } from '../hooks/useIsMobile'

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

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current: 1, size: PAGE_SIZE.LARGE, studentId: user.id }
      if (filter !== 'all') params.status = filter
      const result = await registrationApi.list(params as Parameters<typeof registrationApi.list>[0])
      setRegistrations(result.records)
    } catch (err) {
      console.error('加载报名数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [user, filter])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  if (loading && registrations.length === 0) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>
  }

  return (
    <>
      {/* Summary stats row */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <FileText size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>总报名数</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.total} />
          </div>
        </motion.div>
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <CheckCircle size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已通过</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.approved} />
          </div>
        </motion.div>
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Clock size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>待审核</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.pending} />
          </div>
        </motion.div>
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <XCircle size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已拒绝</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.rejected} />
          </div>
        </motion.div>
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
          variants={staggerContainer}
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
              <motion.div
                key={reg.id}
                variants={staggerItem}
                className="glass-card glass-card-vertical"
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
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {registrations.length === 0 && !loading && (
        <motion.div
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-tertiary)',
            fontSize: '14px',
          }}
        >
          暂无报名记录
        </motion.div>
      )}

      <div style={{ paddingBottom: '40px' }} />

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReg && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedReg(null)}
          >
            <motion.div
              className="glass-card glass-card-vertical glass-card-static"
              style={{ width: isMobile ? 'calc(100vw - 32px)' : '420px', padding: '24px', position: 'relative' }}
              variants={panelSlideIn} initial="initial" animate="animate" exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setSelectedReg(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}>
                <X size={16} strokeWidth={1.5} />
              </button>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>报名详情</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>竞赛名称</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedReg.competitionName || '-'}</div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>队伍名称</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedReg.teamName || '--'}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>角色</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedReg.isTeamLeader === 1 ? '队长' : '队员'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>报名时间</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{formatDate(selectedReg.createTime)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>状态</div>
                    <span className={`glass-badge ${(statusMap[selectedReg.status] || statusMap[0]).badge}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {(statusMap[selectedReg.status] || statusMap[0]).label}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>联系电话</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedReg.contactPhone || '-'}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>审核时间</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedReg.auditTime ? formatDate(selectedReg.auditTime) : '-'}</div>
                  </div>
                </div>
                {selectedReg.attachmentUrl && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>附件</div>
                    <a href={selectedReg.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none' }}>
                      查看附件
                    </a>
                  </div>
                )}
                {selectedReg.auditRemark && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>审核备注</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedReg.auditRemark}</div>
                  </div>
                )}
                {selectedReg.remark && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>备注</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{selectedReg.remark}</div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

