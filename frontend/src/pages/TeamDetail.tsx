import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  Calendar,
  Crown,
  GraduationCap,
  Hash,
  MessageSquareQuote,
  Trophy,
  Users,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import GlassModal from '../components/GlassModal'
import { registrationApi, competitionApi, userApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { toast } from '../components/toastUtils'
import { confirmDialog } from '../components/confirmDialogUtils'
import { getStatusBadge } from '../utils/statusBadge'
import { formatDate } from '../utils/format'
import { getAvatarSrc } from '../components/UserCardMini'
import { fadeSlideUp } from '../motion/variants'
import type { TeamItem, CompetitionItem, UserItem } from '../api/types'

const hoverBg = 'rgba(0,122,255,0.06)'

/**
 * 队伍详情子页（学生/教师/管理员共用）：
 * 展示队伍完整信息与成员名单，成员可点进个人主页；
 * 队长可在此提交审核、指定指导老师、解散队伍。
 */
export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? 'student'
  const teamId = Number(id)

  const [team, setTeam] = useState<TeamItem | null>(null)
  const [comp, setComp] = useState<CompetitionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [acting, setActing] = useState(false)

  // 更换指导老师
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [teacherSelection, setTeacherSelection] = useState('')
  const [teacherOptions, setTeacherOptions] = useState<UserItem[]>([])
  const [changingTeacher, setChangingTeacher] = useState(false)

  const loadTeam = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    try {
      const data = await registrationApi.teamDetail(teamId)
      setTeam(data)
      setNotFound(false)
      if (data.competitionId) {
        competitionApi.getById(data.competitionId).then(setComp).catch(() => {})
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => { loadTeam() }, [loadTeam])

  const compBase = role === 'teacher' ? '/teacher/competitions' : role === 'admin' ? '/admin/competitions' : '/student/competitions'
  const backPath = role === 'teacher' ? '/teacher/teams' : role === 'admin' ? '/admin/competitions?tab=teams' : '/student/teams'
  const openProfile = (userId: number) => navigate(`/student/u/${userId}`)

  const isLeader = !!team && !!user && team.leaderId === user.id

  const handleSubmit = async () => {
    if (!team) return
    setActing(true)
    try {
      await registrationApi.submitTeam(team.id)
      toast.success('已提交审核，等待管理员处理')
      loadTeam()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setActing(false)
    }
  }

  const handleDisband = async () => {
    if (!team) return
    const confirmed = await confirmDialog({
      message: `确定要解散队伍「${team.teamName}」吗？队员与关联招募帖将一并下架，此操作不可撤销。`,
      variant: 'danger',
      confirmText: '解散',
    })
    if (!confirmed) return
    try {
      await registrationApi.disbandTeam(team.id)
      toast.success('队伍已解散')
      navigate(backPath)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '解散失败')
    }
  }

  const openTeacherModal = async () => {
    if (!team) return
    setShowTeacherModal(true)
    setTeacherSelection(team.teacherId ? String(team.teacherId) : '')
    try {
      const res = await userApi.list({ current: 1, size: 100, userType: 2 })
      setTeacherOptions(res.records)
    } catch {
      setTeacherOptions([])
    }
  }

  const handleChangeTeacher = async () => {
    if (!team) return
    setChangingTeacher(true)
    try {
      await registrationApi.changeTeacher(team.id, teacherSelection ? Number(teacherSelection) : null)
      toast.success('指导老师已更新')
      setShowTeacherModal(false)
      loadTeam()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setChangingTeacher(false)
    }
  }

  if (loading) return <ListSkeleton />
  if (notFound || !team) return <EmptyState text="队伍不存在或无权查看" icon={Users} />

  const badge = getStatusBadge(team.status, 'team')
  const memberCount = team.members?.length ?? 0

  return (
    <>
      {/* 返回行 */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" style={{ marginBottom: '12px' }}>
        <button
          className="btn ghost"
          style={{ height: '32px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          onClick={() => navigate(backPath)}
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          返回
        </button>
      </motion.div>

      {/* 队伍概要 */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        style={{ padding: '16px', marginBottom: '12px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.35 }}>
            {team.teamName}
          </span>
          <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '12px', padding: '3px 10px' }}>
            {badge.label}
          </span>
        </div>

        {team.teamSlogan && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            <MessageSquareQuote size={13} strokeWidth={1.5} />
            {team.teamSlogan}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px 16px' }}>
          <InfoRow icon={<Trophy size={13} strokeWidth={1.5} />} label="参赛竞赛">
            {team.competitionName ? (
              <span
                title="查看竞赛详情"
                onClick={() => navigate(`${compBase}/${team.competitionId}`)}
                style={{ cursor: 'pointer', color: 'var(--accent)' }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                {team.competitionName}
              </span>
            ) : '-'}
          </InfoRow>
          <InfoRow icon={<Crown size={13} strokeWidth={1.5} />} label="队长">
            <span
              title="查看个人主页"
              onClick={() => openProfile(team.leaderId)}
              style={{ cursor: 'pointer', color: 'var(--accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              {team.leaderName ?? `用户#${team.leaderId}`}
            </span>
          </InfoRow>
          <InfoRow icon={<GraduationCap size={13} strokeWidth={1.5} />} label="指导老师">
            {team.teacherId ? (
              <span
                title="查看个人主页"
                onClick={() => openProfile(team.teacherId!)}
                style={{ cursor: 'pointer', color: 'var(--accent)' }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                {team.teacherName ?? `用户#${team.teacherId}`}
              </span>
            ) : '未指定'}
          </InfoRow>
          <InfoRow icon={<Hash size={13} strokeWidth={1.5} />} label="团队ID">#{team.id}</InfoRow>
          <InfoRow icon={<Calendar size={13} strokeWidth={1.5} />} label="创建时间">{formatDate(team.createTime)}</InfoRow>
          <InfoRow icon={<Users size={13} strokeWidth={1.5} />} label="成员人数">
            {memberCount}{comp?.maxMembers ? ` / 上限 ${comp.maxMembers} 人` : ''}
          </InfoRow>
        </div>

        {isLeader && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
            {(team.status === 0 || team.status === 3) && (
              <button
                className="btn primary filled-primary"
                style={{ height: '30px', fontSize: '12px' }}
                disabled={acting}
                onClick={handleSubmit}
              >
                {acting ? '提交中...' : team.status === 3 ? '重新提交审核' : '提交审核'}
              </button>
            )}
            <button className="btn ghost" style={{ height: '30px', fontSize: '12px' }} onClick={openTeacherModal}>
              指导老师
            </button>
            {(team.status === 0 || team.status === 1 || team.status === 3) && (
              <button
                className="btn ghost"
                style={{ height: '30px', fontSize: '12px', color: 'var(--danger)' }}
                onClick={handleDisband}
              >
                解散队伍
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* 成员名单 */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        style={{ padding: '16px' }}
      >
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
          团队成员（{memberCount}）
        </div>
        {memberCount === 0 ? (
          <EmptyState text="暂无成员" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {team.members.map((m) => {
              const name = m.studentName ?? m.studentUsername ?? `用户#${m.studentId}`
              return (
                <div
                  key={m.id}
                  title="查看个人主页"
                  onClick={() => openProfile(m.studentId)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '10px', cursor: 'pointer',
                  }}
                >
                  <img
                    src={getAvatarSrc({ id: m.studentId })}
                    alt={name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarSrc(null) }}
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {m.studentId === team.leaderId && <Crown size={12} strokeWidth={1.5} style={{ color: '#f59e0b' }} />}
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{name}</span>
                      {m.studentId === team.leaderId && (
                        <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>队长</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      学号 {m.studentUsername ?? '-'}
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {formatDate(m.joinTime)} 加入
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* 指导老师模态框 */}
      <GlassModal open={showTeacherModal} onClose={() => setShowTeacherModal(false)} title="指定指导老师" maxWidth="360px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <select
            className="glass-search"
            value={teacherSelection}
            onChange={(e) => setTeacherSelection(e.target.value)}
            style={{ width: '100%', marginBottom: 0 }}
          >
            <option value="">不指定（取消当前老师）</option>
            {teacherOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.realName}{t.deptName ? ` - ${t.deptName}` : ''}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={() => setShowTeacherModal(false)}>取消</button>
            <button className="btn ghost" onClick={handleChangeTeacher} disabled={changingTeacher}>
              {changingTeacher ? '保存中...' : '确认'}
            </button>
          </div>
        </div>
      </GlassModal>
    </>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
      <span style={{ display: 'inline-flex', color: 'var(--text-tertiary)', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>{label}：</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
    </div>
  )
}
