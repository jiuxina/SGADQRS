import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Users,
  Plus,
  Crown,
  Calendar,
  Hash,
  MessageSquareQuote,
  GraduationCap,
  Handshake,
  Inbox,
  Send,
} from 'lucide-react'
import ListMeta from '../components/ListMeta'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import GlassModal from '../components/GlassModal'
import UserCardMini from '../components/UserCardMini'
import { registrationApi, competitionApi, userApi, communityApi } from '../api'
import { confirmDialog } from '../components/confirmDialogUtils'
import { useAuthStore } from '../store/authStore'
import { toast } from '../components/toastUtils'
import type { TeamItem, CompetitionItem, UserItem, CommunityRequestItem } from '../api/types'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatDate } from '../utils/format'
import { isTeamInnerTab } from '../utils/notification'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import PageTabs, { usePageTab } from '../components/PageTabs'
import StudentRecruitSquare from './StudentRecruitSquare'

const PAGE_TABS = [
  { key: 'teams', label: '我的队伍' },
  { key: 'recruit', label: '招募广场' },
]

const teamStatusLabel: Record<number, string> = {
  0: '组建中',
  1: '待审核',
  2: '已通过',
  3: '已拒绝',
}

const teamStatusClass: Record<number, string> = {
  0: 'pending',
  1: 'reviewing',
  2: 'pass',
  3: 'fail',
}

const reqTypeLabel: Record<number, string> = {
  2: '入队申请',
  3: '入队邀请',
}

const reqStatusLabel: Record<number, string> = {
  0: '待处理',
  1: '已同意',
  2: '已拒绝',
}

const reqStatusClass: Record<number, string> = {
  0: 'pending',
  1: 'pass',
  2: 'fail',
}

type TabKey = 'teams' | 'received2' | 'received3' | 'sent'

export default function StudentTeams() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [urlTab, setPageTab] = usePageTab(PAGE_TABS)
  // URL 带 ?tab=received2/received3/sent 时直达内层请求标签(供消息中心/铃铛跳转)
  const pageTab = isTeamInnerTab(urlTab) ? 'teams' : urlTab
  const [tab, setTab] = useState<TabKey>(() => (isTeamInnerTab(urlTab) ? (urlTab as TabKey) : 'teams'))
  // 站内导航(组件不重新挂载)时同步 URL → 内层标签
  useEffect(() => {
    if (isTeamInnerTab(urlTab)) setTab(urlTab as TabKey)
  }, [urlTab])

  // ===== 我的队伍 =====
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const pagination = usePagination()

  // 创建团队
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createCompId, setCreateCompId] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamSlogan, setTeamSlogan] = useState('')
  const [creating, setCreating] = useState(false)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [loadingCompetitions, setLoadingCompetitions] = useState(false)

  // 指导老师
  const [teachers, setTeachers] = useState<UserItem[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  // ===== 请求列表 =====
  const [requests, setRequests] = useState<CommunityRequestItem[]>([])
  const [reqLoading, setReqLoading] = useState(false)
  const [reqTotal, setReqTotal] = useState(0)
  const [reqPage, setReqPage] = useState(1)
  const reqPageSize = 10
  const [actingId, setActingId] = useState<number | null>(null)

  // 更换指导老师
  const [teacherModalTeam, setTeacherModalTeam] = useState<TeamItem | null>(null)
  const [teacherSelection, setTeacherSelection] = useState('')
  const [changingTeacher, setChangingTeacher] = useState(false)

  const isMobile = useIsMobile()

  // 创建接口只接受 已发布(2)/进行中(3) 且未过报名截止的竞赛，下拉只列可报名项，避免选到必然报错
  const joinableComps = competitions.filter((c) => {
    if (c.status !== 2 && c.status !== 3) return false
    if (c.registrationEnd && new Date(c.registrationEnd) < new Date()) return false
    return true
  })

  const loadTeams = useCallback(async () => {
    setLoading(true)
    try {
      const result = await registrationApi.teamList({ current: pagination.current, size: pagination.pageSize })
      setTeams(result.records)
      setTotal(result.total)
      pagination.setTotal(result.total)
    } catch (err) {
      toast.error('加载团队数据失败')
      console.error('加载团队数据失败:', err)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize])

  const reqType = tab === 'received2' ? 2 : tab === 'received3' ? 3 : undefined
  const reqBox: 'received' | 'sent' = tab === 'sent' ? 'sent' : 'received'

  const loadRequests = useCallback(async () => {
    setReqLoading(true)
    try {
      const params = { current: reqPage, size: reqPageSize, type: reqType, status: undefined }
      const result = reqBox === 'received'
        ? await communityApi.received(params)
        : await communityApi.sent(params)
      setRequests(result.records)
      setReqTotal(result.total)
    } catch {
      // request 层已提示
    } finally {
      setReqLoading(false)
    }
  }, [reqBox, reqType, reqPage])

  useEffect(() => {
    if (tab === 'teams') loadTeams()
    else loadRequests()
  }, [tab, loadTeams, loadRequests])

  // 打开创建模态框时加载竞赛列表和教师列表
  useEffect(() => {
    if (!showCreateModal) return
    setLoadingCompetitions(true)
    Promise.all([
      competitionApi.list({ current: 1, size: 100 }),
      userApi.list({ current: 1, size: 100, userType: 2 }),
    ])
      .then(([compResult, teacherResult]) => {
        setCompetitions(compResult.records)
        setTeachers(teacherResult.records)
      })
      .catch(err => {
        toast.error('加载数据失败')
        console.error('加载数据失败:', err)
      })
      .finally(() => setLoadingCompetitions(false))
  }, [showCreateModal])

  const handleCreate = async () => {
    if (!createCompId) {
      toast.warning('请选择竞赛')
      return
    }
    if (!joinableComps.some((c) => c.id === Number(createCompId))) {
      toast.warning('该竞赛当前不可报名，请重新选择')
      setCreateCompId('')
      return
    }
    if (!teamName.trim()) {
      toast.warning('请输入团队名称')
      return
    }
    setCreating(true)
    try {
      await registrationApi.createTeam({
        competitionId: Number(createCompId),
        teamName: teamName.trim(),
        teamSlogan: teamSlogan.trim() || undefined,
        teacherId: selectedTeacherId ? Number(selectedTeacherId) : undefined,
      })
      toast.success('团队创建成功，去招募广场发帖招人吧')
      setShowCreateModal(false)
      setCreateCompId('')
      setTeamName('')
      setTeamSlogan('')
      setSelectedTeacherId('')
      loadTeams()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  const handleReq = async (req: CommunityRequestItem, status: 1 | 2) => {
    setActingId(req.id)
    try {
      await communityApi.handle(req.id, status)
      toast.success(status === 1 ? '已同意' : '已拒绝')
      loadRequests()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setActingId(null)
    }
  }

  const openProfile = (userId: number) => navigate(`/student/u/${userId}`)

  const handleSubmitTeam = async (team: TeamItem) => {
    setActingId(team.id)
    try {
      await registrationApi.submitTeam(team.id)
      toast.success('已提交审核，等待管理员处理')
      loadTeams()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setActingId(null)
    }
  }

  const openTeacherModal = async (team: TeamItem) => {
    setTeacherModalTeam(team)
    setTeacherSelection(team.teacherId ? String(team.teacherId) : '')
    try {
      const res = await userApi.list({ current: 1, size: 100, userType: 2 })
      setTeachers(res.records)
    } catch {
      setTeachers([])
    }
  }

  const handleDisband = async (team: TeamItem) => {
    const confirmed = await confirmDialog({
      message: `确定要解散队伍「${team.teamName}」吗？队员与关联招募帖将一并下架，此操作不可撤销。`,
      variant: 'danger',
      confirmText: '解散',
    })
    if (!confirmed) return
    try {
      await registrationApi.disbandTeam(team.id)
      toast.success('队伍已解散')
      loadTeams()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '解散失败')
    }
  }

  const handleChangeTeacher = async () => {
    if (!teacherModalTeam) return
    setChangingTeacher(true)
    try {
      await registrationApi.changeTeacher(teacherModalTeam.id, teacherSelection ? Number(teacherSelection) : null)
      toast.success('指导老师已更新')
      setTeacherModalTeam(null)
      loadTeams()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setChangingTeacher(false)
    }
  }

  const tabs: { key: TabKey; label: string; icon: typeof Users }[] = [
    { key: 'teams', label: '我的队伍', icon: Users },
    { key: 'received2', label: '收到的申请', icon: Inbox },
    { key: 'received3', label: '收到的邀请', icon: Handshake },
    { key: 'sent', label: '我发出的', icon: Send },
  ]

  return (
    <>
      {/* 页面级标签：我的队伍 / 招募广场 */}
      <PageTabs
        tabs={PAGE_TABS}
        active={pageTab}
        onChange={(k) => { setPageTab(k); if (k === 'teams') setTab('teams') }}
      />

      {pageTab === 'recruit' && <StudentRecruitSquare />}

      {pageTab === 'teams' && (
      <>
      {/* Tabs */}
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}
      >
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setReqPage(1); pagination.setCurrent(1) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600',
                background: tab === t.key ? 'var(--accent)' : 'rgba(0,122,255,0.08)',
                color: tab === t.key ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <Icon size={14} strokeWidth={1.8} />
              {t.label}
            </button>
          )
        })}
      </motion.div>

      {tab === 'teams' ? (
        <>
          {/* Header actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <ListMeta count={total} unit="个" prefix="共" />
            <button
              className="btn ghost"
              style={{ height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={14} strokeWidth={1.5} />
              创建团队
            </button>
          </div>

          {loading && teams.length === 0 ? (
            <ListSkeleton />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="team-list"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                  gap: '12px',
                }}
              >
                {teams.map((team) => (
                  <motion.div
                    key={team.id}
                    variants={staggerItem}
                    className="glass-card glass-card-vertical"
                    title="查看队伍详情"
                    onClick={() => navigate(`/student/teams/detail/${team.id}`)}
                    style={{ padding: '12px', cursor: 'pointer' }}
                  >
                    {/* Team header */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.35, flex: 1 }}>
                          {team.teamName}
                        </span>
                        <span
                          className={`glass-badge ${teamStatusClass[team.status] ?? 'pending'}`}
                          style={{ fontSize: '12px', padding: '2px 8px' }}
                        >
                          {teamStatusLabel[team.status] ?? '未知'}
                        </span>
                      </div>

                      {team.competitionName && (
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                          竞赛：{team.competitionName}
                        </div>
                      )}

                      {team.teamSlogan && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          <MessageSquareQuote size={12} strokeWidth={1.5} />
                          {team.teamSlogan}
                        </div>
                      )}

                      {user?.id === team.leaderId && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {(team.status === 0 || team.status === 3) && (
                            <button
                              className="btn primary filled-primary"
                              style={{ height: '26px', fontSize: '12px', padding: '0 10px' }}
                              disabled={actingId === team.id}
                              onClick={(e) => { e.stopPropagation(); handleSubmitTeam(team) }}
                            >
                              {actingId === team.id ? '提交中...' : team.status === 3 ? '重新提交审核' : '提交审核'}
                            </button>
                          )}
                          {/* 后端 changeTeacher 仅允许 组建中(0)/已拒绝(3)，按钮同口径前置隐藏 */}
                          {(team.status === 0 || team.status === 3) && (
                            <button
                              className="btn ghost"
                              style={{ height: '26px', fontSize: '12px', padding: '0 10px' }}
                              onClick={(e) => { e.stopPropagation(); openTeacherModal(team) }}
                            >
                              指导老师
                            </button>
                          )}
                          {(team.status === 0 || team.status === 1 || team.status === 3) && (
                            <button
                              className="btn ghost"
                              style={{ height: '26px', fontSize: '12px', padding: '0 10px', color: 'var(--danger)' }}
                              onClick={(e) => { e.stopPropagation(); handleDisband(team) }}
                            >
                              解散队伍
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Team meta */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        <Hash size={12} strokeWidth={1.5} />
                        团队ID：{team.id}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        <Crown size={12} strokeWidth={1.5} />
                        队长：{team.leaderName ?? `用户#${team.leaderId}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        <GraduationCap size={12} strokeWidth={1.5} />
                        指导老师：{team.teacherName ?? '未指定'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        <Users size={12} strokeWidth={1.5} />
                        成员 {team.members.length} 人
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        <Calendar size={12} strokeWidth={1.5} />
                        创建于 {formatDate(team.createTime)}
                      </div>
                    </div>

                    {/* Members list */}
                    {team.members.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px', fontWeight: '600' }}>
                          团队成员
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {team.members.map((m) => (
                            <div
                              key={m.id}
                              title="查看个人主页"
                              onClick={(e) => { e.stopPropagation(); if (m.studentId) openProfile(m.studentId) }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '12px',
                                padding: '4px 6px',
                                margin: '0 -6px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,122,255,0.06)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                                {m.studentId === team.leaderId && (
                                  <Crown size={11} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
                                )}
                                <span>{m.studentName ?? m.studentUsername ?? `用户#${m.studentId}`}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          <Pagination
            current={pagination.current}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={pagination.setCurrent}
            onPageSizeChange={pagination.setPageSize}
          />

          {teams.length === 0 && !loading && (
            <EmptyState icon={Users} text="还没有队伍：创建队伍，或去招募广场申请加入别人的队伍" />
          )}

          {/* 创建团队模态框 */}
          <GlassModal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建团队" maxWidth="400px">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    选择竞赛 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="glass-search"
                    value={createCompId}
                    onChange={(e) => setCreateCompId(e.target.value)}
                    disabled={loadingCompetitions}
                    style={{ width: '100%', marginBottom: 0 }}
                  >
                    <option value="">
                      {loadingCompetitions ? '加载中...' : (joinableComps.length > 0 ? '请选择要参加的竞赛' : '暂无可报名的竞赛')}
                    </option>
                    {joinableComps.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.competitionName}{comp.maxMembers === 1 ? '（个人赛，创建即报名）' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    团队名称 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    className="glass-search"
                    placeholder="给团队起个响亮的名字"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    maxLength={50}
                    style={{ width: '100%', marginBottom: 0 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    团队口号
                  </label>
                  <input
                    className="glass-search"
                    placeholder="可选，展示团队风采"
                    value={teamSlogan}
                    onChange={(e) => setTeamSlogan(e.target.value)}
                    maxLength={100}
                    style={{ width: '100%', marginBottom: 0 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    指导老师
                  </label>
                  <select
                    className="glass-search"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    disabled={loadingCompetitions}
                    style={{ width: '100%', marginBottom: 0 }}
                  >
                    <option value="">不指定（可选）</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.realName}{t.deptName ? ` - ${t.deptName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button className="btn ghost" onClick={() => setShowCreateModal(false)}>取消</button>
                <button className="btn ghost" onClick={handleCreate} disabled={creating}>
                  {creating ? '创建中...' : '确认创建'}
                </button>
              </div>
            </div>
          </GlassModal>
        </>
      ) : (
        /* ===== 请求列表 ===== */
        <>
          {reqLoading && requests.length === 0 ? (
            <ListSkeleton />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${tab}-${reqPage}`}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '760px' }}
              >
                {requests.map((req) => {
                  const other = reqBox === 'received' ? req.fromUser : req.toUser
                  const canHandle = reqBox === 'received' && req.status === 0
                  return (
                    <motion.div
                      key={req.id}
                      variants={staggerItem}
                      className="glass-card glass-card-vertical glass-card-static"
                      style={{ padding: '12px', gap: 0 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="glass-badge pending" style={{ fontSize: '12px' }}>
                            {reqTypeLabel[req.type]}
                          </span>
                          <span className={`glass-badge ${reqStatusClass[req.status] ?? 'pending'}`} style={{ fontSize: '12px' }}>
                            {reqStatusLabel[req.status]}
                          </span>
                          {req.teamName && (
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                              「{req.teamName}」{req.competitionName ? ` · ${req.competitionName}` : ''}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-quaternary, #bbb)' }}>
                          {formatDate(req.createTime)}
                        </span>
                      </div>

                      <UserCardMini card={other} onOpenProfile={() => other && openProfile(other.id)} />

                      {req.message && (
                        <div style={{
                          marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)',
                          padding: '10px 12px', borderRadius: '12px', background: 'rgba(0,122,255,0.05)',
                          lineHeight: 1.6,
                        }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-tertiary)' }}>备注：</span>
                          “{req.message}”
                        </div>
                      )}
                      {req.postTitle && (
                        <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          关联帖子：{req.postTitle}
                        </div>
                      )}

                      {canHandle && (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                          <button
                            className="btn ghost danger"
                            style={{ height: '30px', fontSize: '12px' }}
                            disabled={actingId === req.id}
                            onClick={() => handleReq(req, 2)}
                          >
                            拒绝
                          </button>
                          <button
                            className="btn primary filled-primary"
                            style={{ height: '30px', fontSize: '12px' }}
                            disabled={actingId === req.id}
                            onClick={() => handleReq(req, 1)}
                          >
                            {actingId === req.id ? '处理中...' : '同意'}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          )}

          <Pagination
            current={reqPage}
            totalPages={Math.max(1, Math.ceil(reqTotal / reqPageSize))}
            pageSize={reqPageSize}
            total={reqTotal}
            onPageChange={setReqPage}
            onPageSizeChange={() => {}}
          />

          {requests.length === 0 && !reqLoading && (
            <EmptyState icon={Inbox} text={
              tab === 'sent' ? '还没有发出过请求' : '暂无待处理请求'
            } />
          )}
        </>
      )}
      </>
      )}
          {/* 指导老师弹窗 */}
      <GlassModal open={!!teacherModalTeam} onClose={() => setTeacherModalTeam(null)} title="指定指导老师" maxWidth="380px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            「{teacherModalTeam?.teamName}」· 老师只查看不审批
          </div>
          <select
            className="glass-search"
            value={teacherSelection}
            onChange={(e) => setTeacherSelection(e.target.value)}
            style={{ width: '100%', marginBottom: 0 }}
          >
            <option value="">不指定</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.realName}{t.deptName ? ` - ${t.deptName}` : ''}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={() => setTeacherModalTeam(null)}>取消</button>
            <button className="btn primary filled-primary" onClick={handleChangeTeacher} disabled={changingTeacher}>
              {changingTeacher ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </GlassModal>
    </>
  )
}
