import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, UserCheck, UserX } from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp, panelSlideIn } from '../motion/variants'
import { competitionApi, registrationApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem, RegistrationItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/Toast'
import { confirmDialog } from '../components/ConfirmDialog'
import { useIsMobile } from '../hooks/useIsMobile'

const statusBadgeMap: Record<number, { cls: string; label: string }> = {
  0: { cls: 'pending', label: '草稿' },
  1: { cls: 'pending', label: '待审核' },
  2: { cls: 'pass', label: '已发布' },
  3: { cls: 'reviewing', label: '进行中' },
  4: { cls: 'fail', label: '已结束' },
  5: { cls: 'fail', label: '已驳回' },
}

const regStatusMap: Record<number, { cls: string; label: string }> = {
  0: { cls: 'pending', label: '待审核' },
  1: { cls: 'pass', label: '已通过' },
  2: { cls: 'fail', label: '已拒绝' },
}

export default function TeacherCompetitions() {
  const user = useAuthStore((s) => s.user)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all')
  const [managingComp, setManagingComp] = useState<CompetitionItem | null>(null)
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([])
  const [regLoading, setRegLoading] = useState(false)
  const isMobile = useIsMobile()

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current: 1, size: PAGE_SIZE.LARGE, publisherId: user.id }
      if (statusFilter !== 'all') params.status = statusFilter
      const result = await competitionApi.list(params as Parameters<typeof competitionApi.list>[0])
      setCompetitions(result.records)
    } catch (err) { console.error('加载竞赛失败:', err) }
    finally { setLoading(false) }
  }, [user, statusFilter])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({ message: '确定要删除此竞赛吗？', variant: 'danger', confirmText: '删除' })
    if (!confirmed) return
    try { await competitionApi.delete(id); loadData(); toast.success('删除成功') }
    catch (err) { toast.error(err instanceof Error ? err.message : '删除失败') }
  }

  const openManage = async (comp: CompetitionItem) => {
    setManagingComp(comp)
    setRegLoading(true)
    try {
      const result = await registrationApi.list({ current: 1, size: PAGE_SIZE.LARGE, competitionId: comp.id })
      setRegistrations(result.records)
    } catch (err) {
      console.error('加载报名列表失败:', err)
      setRegistrations([])
    } finally {
      setRegLoading(false)
    }
  }

  const handleAuditReg = async (id: number, status: number) => {
    try {
      await registrationApi.audit(id, { status })
      if (managingComp) {
        const result = await registrationApi.list({ current: 1, size: PAGE_SIZE.LARGE, competitionId: managingComp.id })
        setRegistrations(result.records)
      }
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '审核失败')
    }
  }

  const formatShortDate = (dateStr: string) => dateStr ? dateStr.slice(5, 10) : '-'

  if (loading && competitions.length === 0) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>

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
                <th>竞赛名称</th><th>分类</th><th>报名时间</th><th>报名人数</th><th>状态</th><th style={{ width: '120px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((comp) => {
                const badge = statusBadgeMap[comp.status] || statusBadgeMap[0]
                return (
                  <tr key={comp.id}>
                    <td style={{ fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {comp.competitionName}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{comp.categoryName || '-'}</td>
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
                        <button className="text-btn" style={{ fontSize: '12px', color: 'var(--danger)' }} onClick={() => handleDelete(comp.id)}>删除</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {competitions.length === 0 && !loading && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>暂无竞赛</td></tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </motion.div>

      {/* Manage Modal */}
      <AnimatePresence>
        {managingComp && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setManagingComp(null)}
          >
            <motion.div
              className="glass-card glass-card-vertical glass-card-static"
              style={{ width: isMobile ? 'calc(100vw - 32px)' : '600px', maxHeight: '80vh', overflow: 'auto', padding: '24px', position: 'relative' }}
              variants={panelSlideIn}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setManagingComp(null)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>

              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', paddingRight: '24px' }}>
                {managingComp.competitionName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
                报名管理 · 共 {registrations.length} 条报名记录
              </div>

              {regLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>加载中...</div>
              ) : registrations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>暂无报名记录</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>学生姓名</th>
                      <th>队伍</th>
                      <th>联系电话</th>
                      <th>报名时间</th>
                      <th>状态</th>
                      <th style={{ width: '130px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => {
                      const badge = regStatusMap[reg.status] || regStatusMap[0]
                      return (
                        <tr key={reg.id}>
                          <td style={{ fontWeight: '600' }}>{reg.studentName || '-'}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                            {reg.teamName || <span style={{ color: 'var(--text-tertiary)' }}>个人</span>}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{reg.contactPhone || '-'}</td>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{reg.createTime?.slice(0, 10) || '-'}</td>
                          <td>
                            <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                              {badge.label}
                            </span>
                          </td>
                          <td>
                            {reg.status === 0 ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="text-btn blue" style={{ fontSize: '11px' }}
                                  onClick={() => handleAuditReg(reg.id, 1)}>
                                  通过
                                </button>
                                <button className="text-btn danger" style={{ fontSize: '11px' }}
                                  onClick={() => handleAuditReg(reg.id, 2)}>
                                  拒绝
                                </button>
                              </div>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
