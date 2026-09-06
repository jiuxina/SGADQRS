import { useState, useEffect, useCallback, Component, type ReactNode, type ErrorInfo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  FileText,
  Award,
  Download,
  CheckCircle,
  Megaphone,
  Plus,
} from 'lucide-react'
import { competitionApi, recruitApi } from '../api'
import type { CompetitionItem, RecruitPostItem } from '../api/types'
import { fadeSlideUp } from '../motion/variants'
import { ListSkeleton } from '../components/PageSkeleton'
import EntryModal from '../components/EntryModal'
import CountdownTimer from '../components/CountdownTimer'
import ConfettiEffect from '../components/ConfettiEffect'
import UserCardMini from '../components/UserCardMini'
import RecruitPostModal from '../components/RecruitPostModal'
import RecruitDetailModal from '../components/RecruitDetailModal'
import { formatDate, resolveCoverUrl, formatFileSize } from '../utils/format'
import { useIsMobile } from '../hooks/useIsMobile'
import { getStatusBadge } from '../utils/statusBadge'

// Error Boundary to catch rendering errors
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class CompetitionDetailErrorBoundary extends Component<
  { children: ReactNode; onBack: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onBack: () => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('竞赛详情页面错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
          <p style={{ fontSize: '14px', marginBottom: '12px' }}>页面加载出错</p>
          <p style={{ fontSize: '12px', marginBottom: '12px', color: 'var(--text-tertiary)' }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <button className="btn ghost" onClick={this.props.onBack}>返回列表</button>
        </div>
      )
    }
    return this.props.children
  }
}

function StudentCompetitionDetailInner() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [comp, setComp] = useState<CompetitionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  // 组队招募
  const [recruitPosts, setRecruitPosts] = useState<RecruitPostItem[]>([])
  const [showRecruitModal, setShowRecruitModal] = useState(false)
  const [recruitDetailId, setRecruitDetailId] = useState<number | null>(null)

  // Effects
  const [showConfetti, setShowConfetti] = useState(false)

  const loadRecruitPosts = useCallback(async () => {
    if (!id) return
    try {
      const res = await recruitApi.list({ current: 1, size: 20, competitionId: Number(id), status: 1 })
      setRecruitPosts(res.records)
    } catch {
      setRecruitPosts([])
    }
  }, [id])

  const loadCompetition = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setError('无效的竞赛ID')
      return
    }
    const numId = Number(id)
    if (isNaN(numId) || numId <= 0) {
      setLoading(false)
      setError('无效的竞赛ID')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await competitionApi.getById(numId)
      if (!data) {
        setError('竞赛不存在')
      } else {
        // Parse JSON string fields if needed
        if (typeof data.awards === 'string') {
          try { data.awards = JSON.parse(data.awards) } catch { data.awards = null }
        }
        if (typeof data.attachments === 'string') {
          try { data.attachments = JSON.parse(data.attachments) } catch { data.attachments = [] }
        }
        setComp(data)
      }
    } catch (err) {
      console.error('加载竞赛详情失败:', err)
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCompetition()
    loadRecruitPosts()
  }, [loadCompetition, loadRecruitPosts])

  if (loading) {
    return (
      <>
        <PageHeader onBack={() => navigate('/student/competitions')} />
        <ListSkeleton />
      </>
    )
  }

  if (error || !comp) {
    return (
      <>
        <PageHeader onBack={() => navigate('/student/competitions')} />
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
          <p style={{ fontSize: '14px', marginBottom: '12px' }}>{error || '竞赛不存在'}</p>
          <button className="btn ghost" onClick={() => navigate('/student/competitions')}>返回列表</button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Header */}
      <PageHeader onBack={() => navigate('/student/competitions')} />

      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Cover + Title Header */}
        {resolveCoverUrl(comp.coverImage) ? (
          <div style={{
            display: 'flex', gap: '16px', marginBottom: '16px',
            alignItems: isMobile ? 'stretch' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <div style={{
              width: isMobile ? '100%' : '320px', flexShrink: 0,
              aspectRatio: '16/9', borderRadius: '14px',
              overflow: 'hidden',
            }}>
              <img
                src={resolveCoverUrl(comp.coverImage)!}
                alt={comp.competitionName}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                  {comp.competitionName}
                </h1>
                <span className={`glass-badge ${getStatusBadge(comp.status, 'student-competition').cls}`} style={{ fontSize: '12px', padding: '3px 10px' }}>
                  {getStatusBadge(comp.status, 'student-competition').label}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                主办方：{comp.organizer}
              </div>
              {comp.publisherName && (
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  发布者：{comp.publisherName}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                {comp.competitionName}
              </h1>
              <span className={`glass-badge ${getStatusBadge(comp.status, 'student-competition').cls}`} style={{ fontSize: '12px', padding: '3px 10px' }}>
                {getStatusBadge(comp.status, 'student-competition').label}
              </span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
              主办方：{comp.organizer}
            </div>
            {comp.publisherName && (
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                发布者：{comp.publisherName}
              </div>
            )}
          </div>
        )}

        {/* Countdown - only for registering status */}
        {comp.status === 2 && !comp.hasRegistered && (
          <div style={{ marginBottom: '16px' }}>
            <CountdownTimer deadline={comp.registrationEnd} startDate={comp.registrationStart} />
          </div>
        )}

        {/* Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '12px', marginBottom: '16px',
        }}>
          <InfoCard icon={<Calendar size={16} strokeWidth={1.5} />} label="组队时间" value={`${formatDate(comp.registrationStart)} ~ ${formatDate(comp.registrationEnd)}`} />
          <InfoCard icon={<Clock size={16} strokeWidth={1.5} />} label="比赛时间" value={`${formatDate(comp.competitionStart)} ~ ${formatDate(comp.competitionEnd)}`} />
          <InfoCard icon={<MapPin size={16} strokeWidth={1.5} />} label="比赛地点" value={comp.location || '待定'} />
          <InfoCard icon={<Users size={16} strokeWidth={1.5} />} label="参赛情况" value={`参赛队伍 ${comp.registrationCount} 队，每队 ${comp.maxMembers} 人`} />
        </div>

        {/* Description */}
        {comp.description && (
          <Section title="竞赛简介" icon={<FileText size={16} strokeWidth={1.5} />}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {comp.description}
            </div>
          </Section>
        )}

        {/* Rules */}
        {comp.rules && (
          <Section title="竞赛规则" icon={<FileText size={16} strokeWidth={1.5} />}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {comp.rules}
            </div>
          </Section>
        )}

        {/* Awards */}
        {comp.awards && comp.awards.length > 0 && (
          <Section title="奖项设置" icon={<Award size={16} strokeWidth={1.5} />}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {comp.awards
                .sort((a, b) => a.level - b.level)
                .map((award, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '10px',
                    background: award.level === 1 ? 'rgba(251,191,36,0.12)' :
                                award.level === 2 ? 'rgba(156,163,175,0.12)' :
                                'rgba(99,102,241,0.08)',
                    border: '1px solid var(--border-color)',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {award.name}
                    </span>
                  </div>
                ))}
            </div>
          </Section>
        )}

        {/* 组队招募 */}
        <Section
          title="组队招募"
          icon={<Megaphone size={16} strokeWidth={1.5} />}
          action={
            <button
              className="btn ghost"
              style={{ height: '28px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setShowRecruitModal(true)}
            >
              <Plus size={13} strokeWidth={2} />
              发布
            </button>
          }
        >
          {recruitPosts.length === 0 ? (
            <div style={{
              padding: '12px', borderRadius: '12px', textAlign: 'center',
              background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)',
              fontSize: '12px', color: 'var(--text-tertiary)',
            }}>
              该竞赛下还没有组队帖 —— 发布一条招募，或去招募广场看看求组的同学
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recruitPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setRecruitDetailId(post.id)}
                  style={{
                    display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 12px',
                    borderRadius: '12px', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)', cursor: 'pointer', flexWrap: 'wrap',
                  }}
                >
                  <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', flexShrink: 0,
                    background: post.type === 1 ? 'rgba(0,122,255,0.12)' : 'rgba(255,149,0,0.14)',
                    color: post.type === 1 ? 'var(--accent)' : '#ff9500',
                  }}>
                    {post.type === 1 ? '📢 招募' : '🙋 求组'}
                  </span>
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{post.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {post.type === 1 && post.team ? `已有 ${post.team.currentMembers} 人 · ` : ''}
                      {post.deadline ? `截止 ${formatDate(post.deadline)}` : ''}
                    </div>
                  </div>
                  <div style={{ width: '190px', flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); setRecruitDetailId(post.id) }}>
                    <UserCardMini card={post.author} compact />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Attachments */}
        {comp.attachments && comp.attachments.length > 0 && (
          <Section title="竞赛附件" icon={<Download size={16} strokeWidth={1.5} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {comp.attachments.map((att) => (
                <a
                  key={att.fileUrl}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '10px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    textDecoration: 'none', fontSize: '13px', color: 'var(--text-primary)',
                    transition: 'background 0.2s',
                  }}
                >
                  <FileText size={16} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.fileName}</span>
                  {att.fileType && <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', flexShrink: 0 }}>{att.fileType}</span>}
                  {att.fileSize > 0 && <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', flexShrink: 0 }}>{formatFileSize(att.fileSize)}</span>}
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Registration Status */}
        {comp.hasRegistered && (
          <Section title="报名状态" icon={<CheckCircle size={16} strokeWidth={1.5} />}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 18px', borderRadius: '12px',
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
            }}>
              <CheckCircle size={18} strokeWidth={1.5} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                你已在该竞赛的参赛队伍中
              </span>
            </div>
          </Section>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', marginBottom: '40px', justifyContent: 'center' }}>
          <button
            className="btn ghost"
            style={{ height: '40px', fontSize: '14px', padding: '0 24px' }}
            onClick={() => navigate('/student/competitions')}
          >
            返回列表
          </button>
          {comp.status === 2 && !comp.hasRegistered && (
            <button
              className="btn ghost"
              style={{ height: '40px', fontSize: '14px', padding: '0 24px' }}
              onClick={() => setShowRegisterModal(true)}
            >
              去组队 / 报名
            </button>
          )}
        </div>
      </motion.div>

      {/* Entry Modal */}
      <EntryModal
        open={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        competition={comp ? { id: comp.id, competitionName: comp.competitionName, maxMembers: comp.maxMembers } : null}
        onSuccess={() => {
          setShowConfetti(true)
          setShowRegisterModal(false)
          loadCompetition()
        }}
      />

      {/* 组队招募弹窗 */}
      <RecruitPostModal
        open={showRecruitModal}
        onClose={() => setShowRecruitModal(false)}
        onSaved={loadRecruitPosts}
        fixedCompetitionId={comp?.id}
      />
      <RecruitDetailModal
        postId={recruitDetailId}
        onClose={() => setRecruitDetailId(null)}
        onChanged={loadRecruitPosts}
      />

      {/* Effects */}
      <ConfettiEffect show={showConfetti} onComplete={() => setShowConfetti(false)} duration={3000} />
    </>
  )
}

/** Page header with back button */
function PageHeader({ onBack }: { onBack: () => void }) {
  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" style={{ marginBottom: '14px' }}>
      <button
        onClick={onBack}
        className="icon-btn"
        style={{
          display: 'flex', gap: '6px',
          fontSize: '13px', padding: '4px 0',
        }}
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        返回竞赛列表
      </button>
    </motion.div>
  )
}

/** Info card component */
function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '14px 16px', borderRadius: '12px',
      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
    }}>
      <div style={{ color: 'var(--text-tertiary)', marginTop: '2px' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500', lineHeight: 1.4 }}>{value}</div>
      </div>
    </div>
  )
}

/** Section wrapper */
function Section({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '12px', paddingBottom: '10px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, flex: 1 }}>{title}</h2>
        {action}
      </div>
      {children}
    </motion.div>
  )
}

export default function StudentCompetitionDetail() {
  const navigate = useNavigate()
  return (
    <CompetitionDetailErrorBoundary onBack={() => navigate('/student/competitions')}>
      <StudentCompetitionDetailInner />
    </CompetitionDetailErrorBoundary>
  )
}
