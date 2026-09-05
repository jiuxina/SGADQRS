import { Lock, Unlock, Sparkles } from 'lucide-react'
import { env } from '../config/env'
import type { UserCard } from '../api/types'

export function getAvatarSrc(user: { avatar?: string | null; gender?: number | null; id?: number } | null): string {
  if (user?.avatar) {
    return user.avatar.startsWith('/uploads') ? `${env.apiBaseUrl.replace('/api', '')}${user.avatar}` : user.avatar
  }
  const gender = user?.gender || 3
  const idx = ((user?.id ?? 0) % 20) + 1
  return `/avatar/s${gender}-${idx}.webp`
}

interface UserCardMiniProps {
  card: UserCard | null | undefined
  /** 点击卡片跳转公开主页 */
  onOpenProfile?: () => void
  compact?: boolean
}

/**
 * 社区脱敏资料卡：未解锁只展示昵称/学院/专业/技能/简介摘要，
 * 真实姓名与获奖记录须互看解锁后在公开主页查看。
 */
export default function UserCardMini({ card, onOpenProfile, compact = false }: UserCardMiniProps) {
  if (!card) return null
  const skills = (card.skills || '').split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <div
      onClick={onOpenProfile}
      style={{
        display: 'flex', gap: '10px', alignItems: 'flex-start',
        cursor: onOpenProfile ? 'pointer' : 'default',
        ...(compact ? {} : { padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.45)' }),
      }}
    >
      <img
        src={getAvatarSrc(card)}
        alt="avatar"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarSrc(null) }}
        style={{ width: compact ? 34 : 44, height: compact ? 34 : 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: compact ? '13px' : '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {card.displayName}
          </span>
          {card.unlocked ? (
            <span title="已互看资料" style={{ display: 'inline-flex', color: '#34c759' }}>
              <Unlock size={12} strokeWidth={2} />
            </span>
          ) : (
            <span title="未互看资料" style={{ display: 'inline-flex', color: 'var(--text-tertiary)' }}>
              <Lock size={11} strokeWidth={2} />
            </span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          {[card.deptName, card.majorName, card.className].filter(Boolean).join(' · ') || '暂无院系信息'}
        </div>
        {!compact && skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {skills.slice(0, 6).map((s) => (
              <span key={s} style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                background: 'rgba(0,122,255,0.10)', color: 'var(--accent)', fontWeight: '600',
              }}>
                {s}
              </span>
            ))}
          </div>
        )}
        {!compact && card.bioBrief && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
            <Sparkles size={11} strokeWidth={1.5} style={{ marginTop: 2, flexShrink: 0, color: 'var(--text-tertiary)' }} />
            {card.bioBrief}
          </div>
        )}
      </div>
    </div>
  )
}
