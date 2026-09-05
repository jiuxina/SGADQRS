import { Users, MapPin, Calendar, Clock } from 'lucide-react'
import type { CompetitionItem } from '../api/types'
import { formatDate, resolveCoverUrl, formatFileSize } from '../utils/format'
import { getStatusBadge } from '../utils/statusBadge'
import { useIsMobile } from '../hooks/useIsMobile'

/**
 * 竞赛只读信息面板：封面、名称、状态、简介、时间地点、队伍统计、规则与附件。
 * 教师端与管理端的竞赛详情页「基本信息」标签共用。
 */
export default function CompetitionInfoPanel({ comp }: { comp: CompetitionItem }) {
  const isMobile = useIsMobile()
  const badge = getStatusBadge(comp.status)

  return (
    <>
      {resolveCoverUrl(comp.coverImage) && (
        <img
          src={resolveCoverUrl(comp.coverImage)!}
          alt={comp.competitionName}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          style={{
            width: '100%', height: '180px', objectFit: 'cover',
            borderRadius: '12px', marginBottom: '12px',
          }}
        />
      )}

      <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
        {comp.competitionName}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '12px', padding: '3px 10px' }}>
          {badge.label}
        </span>
      </div>

      {comp.description && (
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          {comp.description}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          <Users size={13} strokeWidth={1.5} />
          主办方：{comp.organizer || '-'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          <MapPin size={13} strokeWidth={1.5} />
          地点：{comp.location || '待定'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          <Calendar size={13} strokeWidth={1.5} />
          报名：{formatDate(comp.registrationStart)} ~ {formatDate(comp.registrationEnd)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          <Clock size={13} strokeWidth={1.5} />
          比赛：{formatDate(comp.competitionStart)} ~ {formatDate(comp.competitionEnd)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
        <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{comp.registrationCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>参赛队伍</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{comp.maxMembers}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>每队人数上限</div>
        </div>
      </div>

      {comp.rules && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>竞赛规则</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
            {comp.rules}
          </div>
        </div>
      )}

      {comp.attachments && comp.attachments.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>附件</div>
          {comp.attachments.map((att) => (
            <a key={att.fileUrl} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', padding: '4px 0' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.fileName}</span>
              {att.fileType && <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', flexShrink: 0 }}>{att.fileType}</span>}
              <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', flexShrink: 0 }}>{formatFileSize(att.fileSize)}</span>
            </a>
          ))}
        </div>
      )}
    </>
  )
}
