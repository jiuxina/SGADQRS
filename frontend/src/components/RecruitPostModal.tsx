import { useEffect, useState } from 'react'
import GlassModal from './GlassModal'
import { competitionApi, recruitApi, registrationApi } from '../api'
import { toast } from '../components/toastUtils'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem, RecruitPostItem, TeamItem } from '../api/types'

interface RecruitPostModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** 传入则为编辑模式 */
  editPost?: RecruitPostItem | null
  /** 指定竞赛（从竞赛详情页进入时锁定） */
  fixedCompetitionId?: number
}

/**
 * 发布/编辑招募帖：
 * type=1 组队招募（关联我任队长的队伍）
 * type=2 求组（我找队）
 * 均可留联系方式，配合申请/邀请备注快速沟通。
 */
export default function RecruitPostModal({ open, onClose, onSaved, editPost, fixedCompetitionId }: RecruitPostModalProps) {
  const user = useAuthStore((s) => s.user)
  const [type, setType] = useState<1 | 2>(1)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [myTeams, setMyTeams] = useState<TeamItem[]>([])
  const [competitionId, setCompetitionId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [contact, setContact] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    competitionApi.list({ current: 1, size: 100, status: 2 })
      .then((res) => {
        // 报名中/进行中均可组队
        return competitionApi.list({ current: 1, size: 100 }).then((all) => {
          const usable = all.records.filter((c) => c.status === 2 || c.status === 3)
          setCompetitions(usable.length > 0 ? usable : res.records)
        })
      })
      .catch(() => toast.error('加载竞赛失败'))
  }, [open])

  useEffect(() => {
    if (!open) return
    registrationApi.teamList({ current: 1, size: 100 })
      .then((res) => setMyTeams(res.records.filter((t) => t.leaderId === user?.id)))
      .catch(() => setMyTeams([]))
  }, [open, user?.id])

  useEffect(() => {
    if (!open) return
    if (editPost) {
      setType(editPost.type as 1 | 2)
      setCompetitionId(String(editPost.competitionId))
      setTeamId(editPost.teamId ? String(editPost.teamId) : '')
      setTitle(editPost.title)
      setContent(editPost.content || '')
      setTags(editPost.tags || '')
      setContact(editPost.contact || '')
      setDeadline(editPost.deadline ? editPost.deadline.slice(0, 16) : '')
    } else {
      setType(1)
      setCompetitionId(fixedCompetitionId ? String(fixedCompetitionId) : '')
      setTeamId('')
      setTitle('')
      setContent('')
      setTags('')
      setContact('')
      setDeadline('')
    }
  }, [open, editPost, fixedCompetitionId])

  const compTeams = myTeams.filter((t) => String(t.competitionId) === competitionId)

  const noTeamForComp = type === 1 && !editPost && compTeams.length === 0

  const handleSave = async () => {
    if (!competitionId) return toast.warning('请选择竞赛')
    if (!title.trim()) return toast.warning('请填写标题')
    if (noTeamForComp) return toast.warning('你在该竞赛还没有担任队长的队伍，请先创建队伍或改用「我想找队」类型')
    if (type === 1 && !editPost && !teamId) return toast.warning('请选择要关联的队伍')
    setSaving(true)
    try {
      const payload = {
        type,
        competitionId: Number(competitionId),
        title: title.trim(),
        content: content.trim() || undefined,
        tags: tags.trim() || undefined,
        contact: contact.trim() || undefined,
        deadline: deadline ? `${deadline}:00` : undefined,
        teamId: type === 1 && teamId ? Number(teamId) : undefined,
      }
      if (editPost) {
        await recruitApi.update(editPost.id, payload)
        toast.success('帖子已更新')
      } else {
        await recruitApi.create(payload)
        toast.success('发布成功，可在招募广场看到你的帖子')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <GlassModal open={open} onClose={onClose} title={editPost ? '编辑帖子' : '发布组队帖'} maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!editPost && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {([1, 2] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  fontWeight: '600', fontSize: '13px',
                  background: type === t ? 'var(--accent)' : 'rgba(0,122,255,0.08)',
                  color: type === t ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {t === 1 ? '📢 我要招人' : '🙋 我想找队'}
              </button>
            ))}
          </div>
        )}

        <div>
          <label style={labelStyle}>选择竞赛 <span style={{ color: '#ef4444' }}>*</span></label>
          <select className="glass-search" value={competitionId} disabled={!!editPost || !!fixedCompetitionId}
            onChange={(e) => { setCompetitionId(e.target.value); setTeamId('') }} style={{ ...inputStyle }}>
            <option value="">请选择竞赛</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.competitionName}</option>
            ))}
          </select>
        </div>

        {type === 1 && !editPost && compTeams.length === 0 && competitionId && (
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.6, padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            你在所选竞赛下还没有担任队长的队伍 —— 可先到组队中心创建队伍，或改用「我想找队」发帖。
          </div>
        )}

        {type === 1 && !editPost && compTeams.length > 0 && (
          <div>
            <label style={labelStyle}>关联队伍</label>
            <select className="glass-search" value={teamId} onChange={(e) => setTeamId(e.target.value)} style={{ ...inputStyle }}>
              <option value="">请选择要关联的队伍</option>
              {compTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.teamName}（{t.members.length} 人）</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle}>标题 <span style={{ color: '#ef4444' }}>*</span></label>
          <input className="glass-search" placeholder={type === 1 ? '例：数学建模国赛招 2 人（算法/写作）' : '例：求组互联网+队伍，我负责 BP'}
            value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} style={{ ...inputStyle }} />
        </div>

        <div>
          <label style={labelStyle}>详细说明</label>
          <textarea className="glass-search" rows={4}
            placeholder="介绍你的需求/优势：需要什么方向的队友、目标奖项、训练计划等"
            value={content} onChange={(e) => setContent(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div>
          <label style={labelStyle}>组队截止（可选）</label>
          <input type="datetime-local" className="glass-search" value={deadline}
            onChange={(e) => setDeadline(e.target.value)} style={{ ...inputStyle }} />
        </div>

        <div>
          <label style={labelStyle}>方向标签（逗号分隔）</label>
          <input className="glass-search" placeholder="例：算法,Python,论文写作"
            value={tags} onChange={(e) => setTags(e.target.value)} maxLength={255} style={{ ...inputStyle }} />
        </div>

        <div>
          <label style={labelStyle}>联系方式（选填）</label>
          <input className="glass-search" placeholder="微信 / QQ / 邮箱等，方便对方直接联系你"
            value={contact} onChange={(e) => setContact(e.target.value)} maxLength={100} style={{ ...inputStyle }} />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button className="btn ghost" onClick={onClose}>取消</button>
          <button className="btn primary filled-primary" onClick={handleSave} disabled={saving || noTeamForComp}>
            {saving ? '保存中...' : editPost ? '保存修改' : '发布'}
          </button>
        </div>
      </div>
    </GlassModal>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', marginBottom: 0,
}
