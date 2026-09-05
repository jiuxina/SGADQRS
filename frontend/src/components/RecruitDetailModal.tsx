import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Clock, MapPin } from 'lucide-react'
import GlassModal from './GlassModal'
import UserCardMini from './UserCardMini'
import RecruitPostModal from './RecruitPostModal'
import { recruitApi, communityApi, registrationApi } from '../api'
import { toast } from '../components/toastUtils'
import { promptDialog } from '../components/promptDialogUtils'
import { useAuthStore } from '../store/authStore'
import type { RecruitPostItem, TeamItem } from '../api/types'
import { formatDate } from '../utils/format'

interface RecruitDetailModalProps {
  postId: number | null
  onClose: () => void
  /** 数据变化后通知列表刷新 */
  onChanged?: () => void
}

/**
 * 帖子详情 + 发布者资料卡（两步制交互核心）：
 * 未解锁 → 「互看资料」；已解锁 → 招募帖可「申请加入」、求组帖（队长）可「邀请加入」。
 */
export default function RecruitDetailModal({ postId, onClose, onChanged }: RecruitDetailModalProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [post, setPost] = useState<RecruitPostItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [myLeaderTeams, setMyLeaderTeams] = useState<TeamItem[]>([])
  const [inviteTeamId, setInviteTeamId] = useState('')

  const load = async () => {
    if (!postId) return
    setLoading(true)
    try {
      const data = await recruitApi.detail(postId)
      setPost(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '加载失败')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (postId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  // 已解锁且是求组帖：加载我任队长的同竞赛队伍供邀请
  useEffect(() => {
    if (!post || post.type !== 2 || !post.author?.unlocked) return
    registrationApi.teamList({ current: 1, size: 100, competitionId: post.competitionId })
      .then((res) => setMyLeaderTeams(res.records.filter((t) => t.leaderId === user?.id)))
      .catch(() => setMyLeaderTeams([]))
  }, [post, user?.id])

  const isMine = post && user?.id === post.userId

  const sendRequest = async (payload: { type: number; toUserId?: number; postId?: number; teamId?: number; message?: string }, okMsg: string) => {
    setActing(true)
    try {
      await communityApi.createRequest(payload)
      toast.success(okMsg)
      onChanged?.()
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setActing(false)
    }
  }

  const handleUnlock = async () => {
    if (!post) return
    const message = await promptDialog({
      message: '附上一句自我介绍（可选），对方同意后你们将互相解锁完整资料与获奖记录',
      placeholder: '例：你好，我也想参加这个比赛，交换下资料？',
      confirmText: '发送互看请求',
    })
    if (message === null) return
    sendRequest({ type: 1, toUserId: post.userId, message: message || undefined }, '互看请求已发送，等待对方同意')
  }

  const handleApply = async () => {
    if (!post) return
    const message = await promptDialog({
      message: '向队长介绍你自己（可选）',
      placeholder: '例：我是xxx，擅长xxx，曾获xxx',
      confirmText: '发送入队申请',
    })
    if (message === null) return
    sendRequest({ type: 2, postId: post.id, message: message || undefined }, '入队申请已发送，等待队长处理')
  }

  const handleInvite = async () => {
    if (!post || !inviteTeamId) return toast.warning('请选择要邀请对方加入的队伍')
    const message = await promptDialog({
      message: '向对方发出邀请（可选）',
      placeholder: '例：看了你的资料很匹配，来我们队吧！',
      confirmText: '发送邀请',
    })
    if (message === null) return
    sendRequest({ type: 3, postId: post.id, teamId: Number(inviteTeamId), message: message || undefined }, '邀请已发送，等待对方接受')
  }

  const handleClosePost = async () => {
    if (!post) return
    try {
      await recruitApi.close(post.id)
      toast.success('帖子已关闭')
      onChanged?.()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const openProfile = () => {
    if (!post) return
    onClose()
    navigate(`/student/u/${post.userId}`)
  }

  return (
    <>
      <GlassModal open={!!postId && !showEdit} onClose={onClose} title="帖子详情" maxWidth="520px">
        {loading || !post ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>加载中...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px',
                  background: post.type === 1 ? 'rgba(0,122,255,0.12)' : 'rgba(255,149,0,0.14)',
                  color: post.type === 1 ? 'var(--accent)' : '#ff9500',
                }}>
                  {post.type === 1 ? '📢 组队招募' : '🙋 求组'}
                </span>
                {post.status === 0 && (
                  <span className="glass-badge fail" style={{ fontSize: '12px' }}>已关闭</span>
                )}
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{post.competitionName}</span>
              </div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {post.title}
              </div>
            </div>

            {post.content && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {post.content}
              </div>
            )}

            {post.tags && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {post.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                  <span key={t} style={{
                    fontSize: '12px', padding: '3px 10px', borderRadius: '999px',
                    background: 'rgba(0,122,255,0.10)', color: 'var(--accent)', fontWeight: '600',
                  }}>#{t}</span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {post.type === 1 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} strokeWidth={1.5} />
                  {post.team
                    ? `已有 ${post.team.currentMembers}/${post.team.maxMembers ?? '?'} 人${post.team.maxMembers ? ` · 还可加入 ${Math.max(0, post.team.maxMembers - post.team.currentMembers)} 人` : ''}`
                    : ''}
                </span>
              )}
              {post.deadline && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} strokeWidth={1.5} />
                  截止 {formatDate(post.deadline)}
                </span>
              )}
              {post.team?.slogan && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} strokeWidth={1.5} />
                  {post.team.slogan}
                </span>
              )}
            </div>

            {/* 发布者资料卡 */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                {post.type === 1 ? '队长资料' : '求组同学'}
              </div>
              <UserCardMini card={post.author} onOpenProfile={openProfile} />
            </div>

            {/* 操作区 */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {isMine ? (
                <>
                  {post.status === 1 && (
                    <button className="btn ghost danger" onClick={handleClosePost}>关闭帖子</button>
                  )}
                  <button className="btn ghost" onClick={() => setShowEdit(true)}>编辑</button>
                </>
              ) : post.status === 1 && (
                post.author?.unlocked ? (
                  post.type === 1 ? (
                    <button className="btn primary filled-primary" onClick={handleApply} disabled={acting}>
                      {acting ? '发送中...' : '申请加入'}
                    </button>
                  ) : myLeaderTeams.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select className="glass-search" value={inviteTeamId} onChange={(e) => setInviteTeamId(e.target.value)}
                        style={{ width: '180px', marginBottom: 0, fontSize: '12px' }}>
                        <option value="">选择我的队伍</option>
                        {myLeaderTeams.map((t) => (
                          <option key={t.id} value={t.id}>{t.teamName}（{t.members.length} 人）</option>
                        ))}
                      </select>
                      <button className="btn primary filled-primary" onClick={handleInvite} disabled={acting || !inviteTeamId}>
                        {acting ? '发送中...' : '邀请加入'}
                      </button>
                    </div>
                  )
                ) : (
                  <button className="btn primary filled-primary" onClick={handleUnlock} disabled={acting}>
                    {acting ? '发送中...' : '🔓 互看资料'}
                  </button>
                )
              )}
            </div>

            {!isMine && post.status === 1 && post.author && !post.author.unlocked && (
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                对方同意互看后，你可以查看 TA 的完整资料与获奖记录，再决定是否申请/邀请入队
              </div>
            )}
          </div>
        )}
      </GlassModal>

      {post && (
        <RecruitPostModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSaved={() => { load(); onChanged?.() }}
          editPost={post}
        />
      )}
    </>
  )
}
