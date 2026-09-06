import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Trophy, Lock, Medal, Trophy as TrophyIcon, User } from 'lucide-react'
import { ListSkeleton } from '../components/PageSkeleton'
import { getAvatarSrc } from '../components/UserCardMini'
import { userApi, communityApi } from '../api'
import { toast } from '../components/toastUtils'
import { promptDialog } from '../components/promptDialogUtils'
import { useAuthStore } from '../store/authStore'
import type { PublicProfile } from '../api/types'
import { formatDate } from '../utils/format'

const awardLevelLabel: Record<number, string> = {
  1: '特等奖', 2: '一等奖', 3: '二等奖', 4: '三等奖', 5: '优秀奖',
}

const awardLevelColor: Record<number, string> = {
  1: '#ffd60a', 2: '#c9a86a', 3: '#a8b8c8', 4: '#b07a4a', 5: '#98a1ad',
}

/**
 * TA 的主页：未解锁 → 脱敏卡 + 互看请求按钮；
 * 已解锁 → 完整资料 + 获奖记录时间线（作为是否同队的参考）。
 */
export default function UserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await userApi.publicProfile(Number(id))
      setProfile(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleUnlock = async () => {
    if (!profile) return
    const message = await promptDialog({
      message: '附上一句自我介绍（可选），对方同意后你们将互相解锁完整资料与获奖记录',
      placeholder: '例：你好，想和你组队参加比赛，交换下资料？',
      confirmText: '发送互看请求',
    })
    if (message === null) return
    setSending(true)
    try {
      await communityApi.createRequest({ type: 1, toUserId: profile.id, message: message || undefined })
      toast.success('互看请求已发送，等待对方同意')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发送失败')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <ListSkeleton />
  if (!profile) return null

  const isSelf = user?.id === profile.id
  const skills = (profile.skills || '').split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      {/* 头部资料卡 */}
      <div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <img
            src={getAvatarSrc(profile)}
            alt="avatar"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarSrc(null) }}
            style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {profile.unlocked ? (profile.realName || profile.displayName) : profile.displayName}
              </span>
              {profile.nickname && profile.unlocked && (
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>@{profile.nickname}</span>
              )}
              <span className={`glass-badge ${profile.unlocked ? 'pass' : 'pending'}`} style={{ fontSize: '12px' }}>
                {profile.unlocked ? '已互看资料' : '资料未解锁'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              {[profile.deptName, profile.majorName, profile.className].filter(Boolean).join(' · ') || '暂无院系信息'}
              {profile.unlocked && profile.username && ` · @${profile.username}`}
            </div>
            {profile.unlocked && profile.bio && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.7 }}>
                {profile.bio}
              </div>
            )}
            {!profile.unlocked && profile.bioBrief && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>
                {profile.bioBrief}
              </div>
            )}
            {skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                {skills.map((s) => (
                  <span key={s} style={{
                    fontSize: '12px', padding: '3px 10px', borderRadius: '999px',
                    background: 'rgba(0,122,255,0.10)', color: 'var(--accent)', fontWeight: '600',
                  }}>{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 操作 */}
        {!isSelf && !profile.unlocked && user?.role === 'student' && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn primary filled-primary" onClick={handleUnlock} disabled={sending}>
              {sending ? '发送中...' : '🔓 发起互看请求'}
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              对方同意后可查看完整资料与获奖记录
            </span>
          </div>
        )}
      </div>

      {/* 解锁后：参赛统计 + 获奖记录 */}
      {profile.unlocked ? (
        <>
          {profile.stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: '参赛次数', value: profile.stats.totalParticipations, icon: Trophy },
                { label: '获奖次数', value: profile.stats.totalAwards, icon: Medal },
                { label: '获奖率', value: profile.stats.totalParticipations > 0
                  ? `${Math.round((profile.stats.totalAwards / profile.stats.totalParticipations) * 100)}%` : '-', icon: TrophyIcon },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="glass-card glass-card-vertical glass-card-static" style={{ padding: '12px', textAlign: 'center' }}>
                  <Icon size={16} strokeWidth={1.6} style={{ color: 'var(--accent)', marginBottom: 6 }} />
                  <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Trophy size={15} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>获奖记录</span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>（已发布的成绩）</span>
            </div>
            {(profile.awards?.length ?? 0) === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
                暂无获奖记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {profile.awards!.map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                    borderRadius: '12px', background: 'rgba(255,255,255,0.45)',
                  }}>
                    <span style={{
                      width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${awardLevelColor[a.awardLevel ?? 5] ?? '#98a1ad'}22`,
                      color: awardLevelColor[a.awardLevel ?? 5] ?? '#98a1ad',
                    }}>
                      <Medal size={18} strokeWidth={1.8} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {a.awardName || awardLevelLabel[a.awardLevel ?? 5] || '获奖'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {a.competitionName || '未知竞赛'}
                        {a.ranking ? ` · 第 ${a.ranking} 名` : ''}
                        {a.publishTime ? ` · ${formatDate(a.publishTime)}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '16px', textAlign: 'center' }}>
          <Lock size={26} strokeWidth={1.4} style={{ color: 'var(--text-tertiary)', marginBottom: '10px' }} />
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            获奖记录与完整资料已锁定
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px', lineHeight: 1.6 }}>
            双方互看同意后即可查看，用于参考是否组队
          </div>
        </div>
      )}

      {isSelf && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button className="btn ghost" onClick={() => navigate('/profile')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} strokeWidth={1.5} /> 编辑我的资料
          </button>
        </div>
      )}
    </motion.div>
  )
}
