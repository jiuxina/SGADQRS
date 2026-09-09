import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ClipboardList, Crown, Download, CheckCircle, XCircle, Search } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { TableSkeleton } from '../components/PageSkeleton'
import Pagination from '../components/Pagination'
import { registrationApi, competitionApi, exportApi } from '../api'
import { toast } from '../components/toastUtils'
import { promptDialog } from '../components/promptDialogUtils'
import type { CompetitionItem, TeamItem } from '../api/types'
import { formatDate } from '../utils/format'
import { useDebounce } from '../hooks/useDebounce'
import { fadeSlideUp } from '../motion/variants'

const statusList = [
  { value: undefined as number | undefined, label: '全部' },
  { value: 0, label: '组建中' },
  { value: 1, label: '待审核' },
  { value: 2, label: '已通过' },
  { value: 3, label: '已拒绝' },
]

const statusMeta: Record<number, { label: string; cls: string }> = {
  0: { label: '组建中', cls: 'pending' },
  1: { label: '待审核', cls: 'reviewing' },
  2: { label: '已通过', cls: 'pass' },
  3: { label: '已拒绝', cls: 'fail' },
}

/** 队伍审核：管理员审核各竞赛的参赛队伍（报名与队伍合一后的唯一审批入口） */
export default function AdminTeams({ presetCompetitionId }: { presetCompetitionId?: number }) {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [compFilter, setCompFilter] = useState<number | ''>(presetCompetitionId ?? '')
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
  const [actingId, setActingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await registrationApi.teamList({
        current,
        size: pageSize,
        competitionId: compFilter || undefined,
        status: statusFilter,
        keyword: debouncedSearch || undefined,
      })
      setTeams(res.records)
      setTotal(res.total)
    } catch {
      // request 层已提示
    } finally {
      setLoading(false)
    }
  }, [current, pageSize, compFilter, statusFilter, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  // 搜索词变化时回到第 1 页
  useEffect(() => { setCurrent(1) }, [debouncedSearch])

  useEffect(() => {
    competitionApi.list({ current: 1, size: 100 })
      .then((res) => setCompetitions(res.records))
      .catch(() => setCompetitions([]))
  }, [])

  const handleAudit = async (team: TeamItem, status: number) => {
    let auditRemark: string | undefined
    if (status === 3) {
      const reason = await promptDialog({
        message: `拒绝队伍「${team.teamName}」的原因（将通知全体成员）`,
        placeholder: '例：队伍信息不完整',
        confirmText: '确认拒绝',
      })
      if (reason === null) return
      auditRemark = reason || undefined
    }
    setActingId(team.id)
    try {
      await registrationApi.auditTeam(team.id, status, auditRemark)
      toast.success(status === 2 ? '已通过，已通知全体成员' : '已拒绝，已通知全体成员')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setActingId(null)
    }
  }

  const handleExport = async () => {
    try {
      await exportApi.teams({ competitionId: compFilter || undefined, status: statusFilter })
      toast.success('导出成功')
    } catch {
      toast.error('导出失败')
    }
  }

  return (
    <>
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ width: '180px' }}>
            <Search strokeWidth={1.5} />
            <input
              className="glass-search"
              placeholder="搜索队伍名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          {!presetCompetitionId && (
          <select
            className="glass-search"
            value={compFilter}
            onChange={(e) => { setCompFilter(e.target.value ? Number(e.target.value) : ''); setCurrent(1) }}
            style={{ width: 'auto', minWidth: '160px', marginBottom: 0 }}
          >
            <option value="">全部竞赛</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.competitionName}</option>
            ))}
          </select>
          )}
          {statusList.map((s) => (
            <button
              key={s.label}
              onClick={() => { setStatusFilter(s.value); setCurrent(1) }}
              style={{
                padding: '6px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600',
                background: statusFilter === s.value ? 'var(--accent)' : 'rgba(0,122,255,0.08)',
                color: statusFilter === s.value ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          className="btn ghost"
          style={{ height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
          onClick={handleExport}
        >
          <Download size={14} strokeWidth={1.5} />
          导出
        </button>
      </motion.div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={`teams-${current}-${compFilter}-${statusFilter}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card glass-card-static" style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>竞赛</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>队伍</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>队长</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>指导老师</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>成员</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>创建时间</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>状态</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', width: '160px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => {
                    const meta = statusMeta[team.status] ?? statusMeta[0]
                    return (
                      <tr key={team.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 12px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {team.competitionName || '-'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div
                            title="查看队伍详情"
                            onClick={() => navigate(`/admin/competitions/team/${team.id}`)}
                            style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--accent)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            {team.teamName}
                          </div>
                          {team.teamSlogan && (
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{team.teamSlogan}</div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Crown size={12} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
                            {team.leaderName ?? `#${team.leaderId}`}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-tertiary)' }}>
                          {team.teacherName ?? '未指定'}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                          {team.members.length} 人
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                          {formatDate(team.createTime)}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span className={`glass-badge ${meta.cls}`} style={{ fontSize: '12px' }}>{meta.label}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {team.status === 1 ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn ghost"
                                style={{ height: '28px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: '#34c759' }}
                                disabled={actingId === team.id}
                                onClick={() => handleAudit(team, 2)}
                              >
                                <CheckCircle size={13} strokeWidth={1.8} /> 通过
                              </button>
                              <button
                                className="btn ghost danger"
                                style={{ height: '28px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                disabled={actingId === team.id}
                                onClick={() => handleAudit(team, 3)}
                              >
                                <XCircle size={13} strokeWidth={1.8} /> 拒绝
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-quaternary, #bbb)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <Pagination
        current={current}
        totalPages={Math.max(1, Math.ceil(total / pageSize))}
        pageSize={pageSize}
        total={total}
        onPageChange={setCurrent}
        onPageSizeChange={(s) => { setPageSize(s); setCurrent(1) }}
      />

      {teams.length === 0 && !loading && (
        <EmptyState icon={ClipboardList} text="暂无参赛队伍" />
      )}
    </>
  )
}
