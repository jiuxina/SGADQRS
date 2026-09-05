import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassModal from './GlassModal'
import { registrationApi, userApi } from '../api'
import { toast } from './toastUtils'
import { useAuthStore } from '../store/authStore'
import type { UserItem } from '../api/types'

interface EntryModalProps {
  open: boolean
  onClose: () => void
  competition: { id: number; competitionName: string; maxMembers: number } | null
  onSuccess: () => void
}

/**
 * 参赛组队弹窗（报名与队伍合一）：
 * - 单人赛：一键报名，自动创建 1 人队并直接提交审核；
 * - 团队赛：创建参赛队伍（可指定指导老师），之后去组队中心邀请队友、提交审核。
 */
export default function EntryModal({ open, onClose, competition, onSuccess }: EntryModalProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [teamName, setTeamName] = useState('')
  const [teamSlogan, setTeamSlogan] = useState('')
  const [teachers, setTeachers] = useState<UserItem[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)

  const isSolo = !!competition && competition.maxMembers === 1

  useEffect(() => {
    if (!open) return
    setTeamName('')
    setTeamSlogan('')
    setSelectedTeacherId('')
    if (!isSolo) {
      setLoadingTeachers(true)
      userApi.list({ current: 1, size: 100, userType: 2 })
        .then((res) => setTeachers(res.records))
        .catch(() => setTeachers([]))
        .finally(() => setLoadingTeachers(false))
    }
  }, [open, isSolo])

  if (!competition) return null

  const handleSubmit = async () => {
    const name = isSolo ? (user?.realName || '我的参赛队') : teamName.trim()
    if (!name) {
      toast.warning('请输入队伍名称')
      return
    }
    setSubmitting(true)
    try {
      await registrationApi.createTeam({
        competitionId: competition.id,
        teamName: name.slice(0, 50),
        teamSlogan: teamSlogan.trim() || undefined,
        teacherId: !isSolo && selectedTeacherId ? Number(selectedTeacherId) : undefined,
      })
      if (isSolo) {
        toast.success('报名成功！队伍已自动提交审核')
      } else {
        toast.success('参赛队伍已创建，去组队中心邀请队友并提交审核吧')
      }
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '报名失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GlassModal open={open} onClose={onClose} title={isSolo ? '确认报名' : '创建参赛队伍'} maxWidth="420px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{competition.competitionName}</div>

        {isSolo ? (
          <div style={{
            padding: '10px 12px', borderRadius: '12px', fontSize: '12px', lineHeight: 1.7,
            background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)', color: 'var(--text-secondary)',
          }}>
            这是个人赛：点击确认后将自动以「{user?.realName}」创建 1 人参赛队并提交审核，无需组队。
          </div>
        ) : (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                队伍名称 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                className="glass-search"
                placeholder="给队伍起个响亮的名字"
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
                指导老师（队长可随时更换）
              </label>
              <select
                className="glass-search"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                disabled={loadingTeachers}
                style={{ width: '100%', marginBottom: 0 }}
              >
                <option value="">暂不指定（可选）</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.realName}{t.deptName ? ` - ${t.deptName}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
              创建后可在组队中心邀请队友、发布招募，队长提交审核后由管理员审核。
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onClose}>取消</button>
          <button className="btn primary filled-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : isSolo ? '确认报名' : '创建队伍'}
          </button>
        </div>

        {!isSolo && (
          <button
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer', alignSelf: 'center' }}
            onClick={() => { onClose(); navigate('/student/teams?tab=recruit') }}
          >
            想先找队友？去招募广场发布求组帖 →
          </button>
        )}
      </div>
    </GlassModal>
  )
}
