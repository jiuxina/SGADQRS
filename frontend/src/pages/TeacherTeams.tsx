import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, ChevronRight, Download, Crown, Search } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { ListSkeleton, LoadingBar } from '../components/PageSkeleton'
import { fadeSlideUp } from '../motion/variants'
import { registrationApi, competitionApi, exportApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { TeamItem, CompetitionItem } from '../api/types'
import { toast } from '../components/toastUtils'
import { formatDate } from '../utils/format'
import { usePagination } from '../hooks/usePagination'
import { useDebounce } from '../hooks/useDebounce'
import Pagination from '../components/Pagination'

const statusMap: Record<number, { cls: string; label: string }> = {
  0: { cls: 'pending', label: '组建中' },
  1: { cls: 'pending', label: '已提交' },
  2: { cls: 'pass', label: '已通过' },
  3: { cls: 'fail', label: '已拒绝' },
}

type TabType = 'competition' | 'advisor'

/** 教师端：只读查看我发布的竞赛的队伍 / 我指导的队伍（审核由管理员在「队伍审核」完成） */
export default function TeacherTeams() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<TabType>('competition')
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [loading, setLoading] = useState(true)
  const pagination = usePagination()

  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [selectedCompId, setSelectedCompId] = useState<number | undefined>(undefined)
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    if (!user) return
    competitionApi.list({ current: 1, size: 50, publisherId: activeTab === 'competition' ? user.id : undefined })
      .then((res) => setCompetitions(res.records))
      .catch(() => {/* ignore */})
  }, [user, activeTab])

  const fetchData = useCallback(async (competitionId?: number) => {
    if (!user) return null
    const params: { current: number; size: number; competitionId?: number; teacherId?: number; keyword?: string } = {
      current: pagination.current, size: pagination.pageSize,
    }
    if (competitionId) params.competitionId = competitionId
    if (activeTab === 'advisor') params.teacherId = user.id
    if (debouncedSearch) params.keyword = debouncedSearch
    return registrationApi.teamList(params)
  }, [user, activeTab, debouncedSearch, pagination.current, pagination.pageSize])

  useEffect(() => {
    fetchData(selectedCompId).then(result => {
      if (!result) return
      setTeams(result.records)
      pagination.setTotal(result.total)
    }).catch(err => { toast.error('加载团队数据失败'); console.error('加载团队数据失败:', err) })
      .finally(() => setLoading(false))
  }, [fetchData, selectedCompId])

  useEffect(() => { pagination.resetPage() }, [selectedCompId, activeTab, debouncedSearch])
  useEffect(() => { setSelectedCompId(undefined) }, [activeTab])

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
      console.error('导出失败:', e)
      toast.error('导出失败')
    }
  }

  if (loading && teams.length === 0) return <ListSkeleton />

  const isAdvisorTab = activeTab === 'advisor'

  return (
    <>
      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
        {(['competition', 'advisor'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: activeTab === tab ? '600' : '400',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)',
              background: activeTab === tab ? 'var(--bg-secondary)' : 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'competition' ? '竞赛团队' : '指导团队'}
          </button>
        ))}
      </div>

      <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }}
        variants={fadeSlideUp} initial="hidden" animate="visible">

        <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {isAdvisorTab ? '我指导的团队' : '我发布竞赛的团队'} <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>{teams.length} 个团队</span>
          </span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-wrap" style={{ width: '180px' }}>
              <Search strokeWidth={1.5} />
              <input
                className="glass-search"
                placeholder="搜索团队名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
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
              <th>团队名称</th><th>团队口号</th><th>竞赛</th><th>队长</th><th>指导老师</th><th>成员数</th><th>状态</th>
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
                      title={isExpanded ? '收起详情' : '展开详情'}
                    >
                      {isExpanded ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                    </button>
                  </td>
                  <td>
                    <span
                      title="查看队伍详情"
                      onClick={() => navigate(`/teacher/teams/detail/${team.id}`)}
                      style={{ fontWeight: '600', cursor: 'pointer', color: 'var(--accent)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      {team.teamName}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.teamSlogan || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{team.competitionName || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Crown size={12} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
                      {team.leaderName || '-'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{team.teacherName || '-'}</td>
                  <td>{team.members?.length || 0}</td>
                  <td>
                    <span className={`glass-badge ${st.cls}`} style={{ fontSize: '12px', padding: '2px 8px' }}>{st.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {teams.length === 0 && !loading && (
          <EmptyState text={isAdvisorTab ? '暂无指导的团队' : '暂无团队数据'} />
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
                        <th>加入时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.members.map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontWeight: '600' }}>{m.studentName ?? m.studentUsername ?? `用户#${m.studentId}`}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{m.studentUsername ?? '-'}</td>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{formatDate(m.joinTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
