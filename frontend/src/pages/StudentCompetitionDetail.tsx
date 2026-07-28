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
} from 'lucide-react'
import { competitionApi, registrationApi, fileApi } from '../api'
import EmptyState from '../components/EmptyState'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem, TeamItem } from '../api/types'
import { fadeSlideUp } from '../motion/variants'
import { ListSkeleton } from '../components/PageSkeleton'
import GlassModal from '../components/GlassModal'
import CountdownTimer from '../components/CountdownTimer'
import ConfettiEffect from '../components/ConfettiEffect'
import FailureEffect from '../components/FailureEffect'
import { formatDate, resolveCoverUrl, formatFileSize } from '../utils/format'
import { useIsMobile } from '../hooks/useIsMobile'
import { toast } from '../components/toastUtils'
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
          <p style={{ fontSize: '12px', marginBottom: '16px', color: 'var(--text-tertiary)' }}>
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
  const user = useAuthStore((s) => s.user)
  const isMobile = useIsMobile()

  const [comp, setComp] = useState<CompetitionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [contactPhone, setContactPhone] = useState('')
  const [remark, setRemark] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [isTeamRegistration, setIsTeamRegistration] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [teamList, setTeamList] = useState<TeamItem[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)

  // Effects
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFailure, setShowFailure] = useState(false)
  const [failureMessage, setFailureMessage] = useState('')

  const phoneRegex = /^1[3-9]\d{9}$/
  const phoneError = contactPhone.length > 0 && !phoneRegex.test(contactPhone) ? '请输入正确的手机号' : ''

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
  }, [loadCompetition])

  const loadTeamList = async (competitionId: number) => {
    setTeamsLoading(true)
    try {
      const res = await registrationApi.teamList({ competitionId, current: 1, size: 50 })
      setTeamList(res.records)
    } catch (err) {
      toast.error('加载团队列表失败')
      console.error('加载团队列表失败:', err)
    } finally {
      setTeamsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await fileApi.upload(file)
      setAttachmentUrl(res.url)
    } catch (err) {
      toast.error('上传附件失败')
      console.error('上传附件失败:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleRegister = async () => {
    if (!comp || !user) return
    if (contactPhone && !phoneRegex.test(contactPhone)) return
    try {
      await registrationApi.register({
        competitionId: comp.id,
        contactPhone,
        teamId: isTeamRegistration ? selectedTeamId ?? undefined : undefined,
        remark: remark || undefined,
        attachmentUrl: attachmentUrl || undefined,
      })
      setShowConfetti(true)
      setContactPhone('')
      setRemark('')
      setAttachmentUrl('')
      setIsTeamRegistration(false)
      setSelectedTeamId(null)
      setTeamList([])
      setShowRegisterModal(false)
      loadCompetition()
    } catch (err) {
      setFailureMessage(err instanceof Error ? err.message : '报名失败')
      setShowFailure(true)
    }
  }

  const openRegisterModal = () => {
    setContactPhone('')
    setRemark('')
    setAttachmentUrl('')
    setIsTeamRegistration(false)
    setSelectedTeamId(null)
    setTeamList([])
    setShowRegisterModal(true)
  }

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
        {/* Cover Image */}
        {resolveCoverUrl(comp.coverImage) && (
          <div style={{
            width: '100%', aspectRatio: '16/9', borderRadius: '16px',
            overflow: 'hidden', marginBottom: '24px', position: 'relative',
          }}>
            <img
              src={resolveCoverUrl(comp.coverImage)!}
              alt={comp.competitionName}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)',
            }} />
          </div>
        )}

        {/* Title & Status */}
        <div style={{ marginBottom: '24px' }}>
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

        {/* Countdown - only for registering status */}
        {comp.status === 2 && !comp.hasRegistered && (
          <div style={{ marginBottom: '24px' }}>
            <CountdownTimer deadline={comp.registrationEnd} startDate={comp.registrationStart} />
          </div>
        )}

        {/* Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '16px', marginBottom: '24px',
        }}>
          <InfoCard icon={<Calendar size={16} strokeWidth={1.5} />} label="报名时间" value={`${formatDate(comp.registrationStart)} ~ ${formatDate(comp.registrationEnd)}`} />
          <InfoCard icon={<Clock size={16} strokeWidth={1.5} />} label="比赛时间" value={`${formatDate(comp.competitionStart)} ~ ${formatDate(comp.competitionEnd)}`} />
          <InfoCard icon={<MapPin size={16} strokeWidth={1.5} />} label="比赛地点" value={comp.location || '待定'} />
          <InfoCard icon={<Users size={16} strokeWidth={1.5} />} label="报名情况" value={`已报名 ${comp.registrationCount}${comp.maxTeams ? ` / ${comp.maxTeams} 队` : ' 人'}，每队 ${comp.maxMembers} 人`} />
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
                你已报名此竞赛
              </span>
            </div>
          </Section>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', marginBottom: '40px', justifyContent: 'center' }}>
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
              onClick={openRegisterModal}
            >
              立即报名
            </button>
          )}
        </div>
      </motion.div>

      {/* Registration Modal */}
      <GlassModal open={showRegisterModal} onClose={() => setShowRegisterModal(false)} title="确认报名" maxWidth="420px">
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          {comp.competitionName}
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={isTeamRegistration}
              onChange={(e) => {
                setIsTeamRegistration(e.target.checked)
                setSelectedTeamId(null)
                if (e.target.checked) loadTeamList(comp.id)
              }}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
            />
            以团队身份报名
          </label>
        </div>
        {isTeamRegistration && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>选择团队</label>
            {teamsLoading ? (
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '8px 0' }}>加载中...</div>
            ) : teamList.length === 0 ? (
              <EmptyState text="暂无可用团队，请先创建团队" />
            ) : (
              <select
                value={selectedTeamId ?? ''}
                onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                }}
              >
                <option value="">请选择团队</option>
                {teamList.map((team) => (
                  <option key={team.id} value={team.id}>{team.teamName}</option>
                ))}
              </select>
            )}
          </div>
        )}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>联系电话</label>
          <input
            type="tel"
            className="glass-search"
            placeholder="请输入联系电话"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            style={{ width: '100%', marginBottom: 0, borderColor: phoneError ? 'var(--danger, #ef4444)' : undefined }}
          />
          {phoneError && (
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{phoneError}</div>
          )}
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>参赛备注</label>
          <textarea
            className="glass-search"
            placeholder="选填，填写参赛备注信息"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            style={{ width: '100%', marginBottom: 0, resize: 'vertical', fontFamily: 'inherit', paddingTop: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>附件材料</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="file"
              id="detail-registration-file-input"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.png"
            />
            <button
              className="btn ghost"
              type="button"
              style={{ height: '32px', fontSize: '12px' }}
              onClick={() => document.getElementById('detail-registration-file-input')?.click()}
              disabled={uploading}
            >
              {uploading ? '上传中...' : '选择文件'}
            </button>
            {attachmentUrl && (
              <span style={{ fontSize: '12px', color: 'var(--accent)' }}>已上传</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={() => setShowRegisterModal(false)}>取消</button>
          <button className="btn ghost" onClick={handleRegister}>确认报名</button>
        </div>
      </GlassModal>

      {/* Effects */}
      <ConfettiEffect show={showConfetti} onComplete={() => setShowConfetti(false)} duration={3000} />
      <FailureEffect show={showFailure} message={failureMessage} onComplete={() => setShowFailure(false)} duration={2500} />
    </>
  )
}

/** Page header with back button */
function PageHeader({ onBack }: { onBack: () => void }) {
  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" style={{ marginBottom: '20px' }}>
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
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '14px', paddingBottom: '10px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
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
