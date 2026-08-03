import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, ChevronRight, Download } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { ListSkeleton, LoadingBar } from '../components/PageSkeleton'
import { fadeSlideUp } from '../motion/variants'
import { registrationApi, competitionApi, exportApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { TeamItem, CompetitionItem, TeamMember } from '../api/types'
import { toast } from '../components/toastUtils'
import { formatDate } from '../utils/format'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import RejectReasonModal from '../components/RejectReasonModal'

const statusMap: Record<number, { cls: string; label: string }> = {
  0: { cls: 'pending', label: '组建中' },
  1: { cls: 'pending', label: '已提交' },
  2: { cls: 'pass', label: '已通过' },
  3: { cls: 'fail', label: '已拒绝' },
}

export default function TeacherTeams() {
  const user = useAuthStore((s) => s.user)
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [loading, setLoading] = useState(true)
  const pagination = usePagination()

  // 竞赛筛选
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [selectedCompId, setSelectedCompId] = useState<number | undefined>(undefined)

  // 展开行
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null)

  // 拒绝原因弹窗
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null)

  // 加载竞赛列表（仅当前教师发布的）
  useEffect(() => {
    if (!user) return
    competitionApi.list({ current: 1, size: 50, publisherId: user.id }).then((res) => {
      setCompetitions(res.records)
    }).catch(() => {/* ignore */})
  }, [user])

  const fetchData = useCallback(async (competitionId?: number) => {
    if (!user) return null
    const params: { current: number; size: number; competitionId?: number } = { current: pagination.current, size: pagination.pageSize }
    if (competitionId) {
      params.competitionId = competitionId
    }
    return registrationApi.teamList(params)
  }, [user, pagination.current, pagination.pageSize])

  const loadData = useCallback(async (competitionId?: number) => {
    setLoading(true)
    try {
      const result = await fetchData(competitionId)
      if (!result) return
      setTeams(result.records)
      pagination.setTotal(result.total)
    } catch (err) { toast.error('加载团队数据失败'); console.error('加载团队数据失败:', err) }
    finally { setLoading(false) }
  }, [fetchData])

  useEffect(() => {
    fetchData(selectedCompId).then(result => {
      if (!result) return
      setTeams(result.records)
      pagination.setTotal(result.total)
    }).catch(err => { toast.error('加载团队数据失败'); console.error('加载团队数据失败:', err) })
      .finally(() => setLoading(false))
  }, [fetchData, selectedCompId])

  // 竞赛切换时重置到第1页
  useEffect(() => { pagination.resetPage() }, [selectedCompId])

  const handleAudit = async (id: number, status: number, auditRemark?: string) => {
    try { await registrationApi.auditTeam(id, status, auditRemark); loadData(selectedCompId); toast.success('操作成功') }
    catch (err) { toast.error(err instanceof Error ? err.message : '操作失败') }
  }

  /** Open reject modal */
  const handleReject = (id: number) => {
    setRejectTargetId(id)
    setRejectModalOpen(true)
  }

  /** Confirm reject with reason */
  const handleRejectConfirm = async (reason: string) => {
    if (rejectTargetId === null) return
    setRejectModalOpen(false)
    await handleAudit(rejectTargetId, 3, reason || undefined)
    setRejectTargetId(null)
  }

  const toggleExpand = (teamId: number) => {
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId))
  }

  const handleExport = async () => {
    try {
      const params: { competitionId?: number } = {}
      if (selectedCompId) params.competitionId = selectedCompId
      await exportApi.teams(params)
      toast.success('导出成功')
    } catch (e) {
      console.error('加载团队数据失败:', e)
      toast.error('导出失败')
    }
  }

  if (loading && teams.length === 0) return <ListSkeleton />

  return (
    <>
      <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }}
        variants={fadeSlideUp} initial="hidden" animate="visible">

        {/* 头部：标题 + 竞赛筛选 + 导出 */}
        <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            团队管理 <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>{teams.length} 个团队</span>
          </span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={selectedCompId ?? ''}
              onChange={(e) => setSelectedCompId(e.target.value ? Number(e.target.value) : undefined)}
              style={{
                height: '32px', fontSize: '12px', padding: '0 28px 0 10px', border: '1px solid var(--border)',
                borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                outline: 'none', cursor: 'pointer', minWidth: '180px',
              }}
            >
              <option value="">全部竞赛</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>{c.competitionName}</option>
              ))}
            </select>
            <button
              className="btn ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
              onClick={handleExport}
            >
              <Download size={14} strokeWidth={1.5} />
              导出
            </button>
          </div>
        </div>

        <LoadingBar visible={loading && teams.length > 0} />
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '32px' }}></th>
              <th>团队名称</th><th>团队口号</th><th>竞赛</th><th>队长</th><th>成员数</th><th>状态</th><th style={{ width: '140px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const st = statusMap[team.status] || statusMap[0]
              const isExpanded = expandedTeamId === team.id
              return (
                <tr key={`tr-${team.id}`}>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => toggleExpand(team.id)}
                      className="icon-btn"
                      title={isExpanded ? '收起成员' : '展开成员'}
                    >
                      {isExpanded ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                    </button>
                  </td>
                  <td style={{ fontWeight: '600' }}>{team.teamName}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.teamSlogan || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{team.competitionName || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{team.leaderName || '-'}</td>
                  <td>{team.members?.length || 0}</td>
                  <td>
                    <span className={`glass-badge ${st.cls}`} style={{ fontSize: '11px', padding: '2px 8px' }}>{st.label}</span>
                  </td>
                  <td>
                    {(team.status === 0 || team.status === 1) ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn ghost" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--accent)' }}
                          onClick={() => handleAudit(team.id, 2)}>通过</button>
                        <button className="btn ghost" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }}
                          onClick={() => handleReject(team.id)}>拒绝</button>
                      </div>
                    ) : <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>-</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {teams.length === 0 && !loading && (
          <EmptyState text="暂无团队数据" />
        )}
      </motion.div>

      <Pagination
        current={pagination.current}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setCurrent}
        onPageSizeChange={pagination.setPageSize}
      />

      {/* 展开的成员详情 */}
      <AnimatePresence>
        {expandedTeamId !== null && (
          <motion.div
            key={`members-${expandedTeamId}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {(() => {
              const team = teams.find((t) => t.id === expandedTeamId)
              if (!team || !team.members?.length) return null
              return (
                <motion.div
                  className="glass-card glass-card-vertical glass-card-static"
                  style={{ padding: '14px 18px', marginTop: '10px' }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '10px' }}>
                    团队成员详情 — {team.teamName}
                  </div>
                  <table className="data-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>姓名</th>
                        <th>学号</th>
                        <th>状态</th>
                        <th>加入时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.members.map((m: TeamMember) => {
                        const memberStatus: Record<number, { cls: string; label: string }> = {
                          0: { cls: 'pending', label: '待确认' },
                          1: { cls: 'pass', label: '已确认' },
                          2: { cls: 'fail', label: '已拒绝' },
                        }
                        const ms = memberStatus[m.status] || memberStatus[0]
                        return (
                          <tr key={m.id}>
                            <td style={{ fontWeight: '600' }}>{m.studentName ?? m.studentUsername ?? `用户#${m.studentId}`}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{m.studentUsername ?? '-'}</td>
                            <td>
                              <span className={`glass-badge ${ms.cls}`} style={{ fontSize: '10px', padding: '1px 6px' }}>{ms.label}</span>
                            </td>
                            <td style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{formatDate(m.joinTime)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </motion.div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <RejectReasonModal
        open={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectTargetId(null) }}
        onConfirm={handleRejectConfirm}
      />
    </>
  )
}
