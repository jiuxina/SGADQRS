import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  X,
} from 'lucide-react'
import DigitRoller from '../components/DigitRoller'
import { staggerContainer, staggerItem, fadeSlideUp, panelSlideIn } from '../motion/variants'
import { registrationApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { RegistrationItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/Toast'
import { confirmDialog } from '../components/ConfirmDialog'

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

export default function StudentRegistration() {
  const user = useAuthStore((s) => s.user)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReg, setSelectedReg] = useState<RegistrationItem | null>(null)

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
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm blue"><FileText strokeWidth={1.5} /></div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>总报名数</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.total} />
          </div>
        </motion.div>
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm green"><CheckCircle strokeWidth={1.5} /></div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已通过</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.approved} />
          </div>
        </motion.div>
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm amber"><Clock strokeWidth={1.5} /></div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>待审核</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.pending} />
          </div>
        </motion.div>
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm red"><XCircle strokeWidth={1.5} /></div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已拒绝</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.rejected} />
          </div>
        </motion.div>
      </motion.div>

      {/* Table section */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0', marginTop: '24px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            报名记录
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {registrations.length}条
            </span>
          </span>
        </div>

        <div style={{ padding: '0 18px 12px' }}>
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
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>竞赛名称</th>
              <th>队伍名称</th>
              <th>是否队长</th>
              <th>报名时间</th>
              <th>状态</th>
              <th style={{ width: '140px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((reg) => {
              const st = statusMap[reg.status] || statusMap[0]
              return (
                <tr key={reg.id}>
                  <td style={{ fontWeight: '600', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {reg.competitionName || '-'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {reg.teamName ?? <span style={{ color: 'var(--text-tertiary)' }}>--</span>}
                  </td>
                  <td>
                    {reg.isTeamLeader === 1 ? (
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>队长</span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>队员</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{formatDate(reg.createTime)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className={`status-dot ${st.badge === 'pass' ? 'pass' : st.badge === 'fail' ? 'fail' : 'pending'}`} />
                      <span className={`glass-badge ${st.badge}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {st.label}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button className="text-btn blue" style={{ fontSize: '12px' }} onClick={() => setSelectedReg(reg)}>查看详情</button>
                      {reg.status === 0 && (
                        <button className="text-btn danger" style={{ fontSize: '12px' }} onClick={() => handleCancel(reg.id)}>
                          取消报名
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {registrations.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            暂无报名记录
          </div>
        )}
      </motion.div>

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
              style={{ width: '420px', padding: '24px', position: 'relative' }}
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

