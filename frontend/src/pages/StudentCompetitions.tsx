import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  MapPin,
  Users,
  Clock,
  Calendar,
  ImageIcon,
} from 'lucide-react'
import ListMeta from '../components/ListMeta'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import GlassModal from '../components/GlassModal'
import { competitionApi, registrationApi, fileApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem, TeamItem } from '../api/types'
import CountdownTimer from '../components/CountdownTimer'
import ConfettiEffect from '../components/ConfettiEffect'
import FailureEffect from '../components/FailureEffect'
import { PAGE_SIZE } from '../config/constants'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatDate, resolveCoverUrl } from '../utils/format'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'

type StatusFilter = 'all' | 2 | 3 | 4

const statusFilterLabels: Record<string, string> = {
  all: '全部',
  2: '报名中',
  3: '进行中',
  4: '已结束',
}

const statusBadgeLabel: Record<number, string> = {
  0: '草稿',
  1: '审核中',
  2: '报名中',
  3: '进行中',
  4: '已结束',
  5: '已驳回',
}

export default function StudentCompetitions() {
  const user = useAuthStore((s) => s.user)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const pagination = usePagination({ defaultPageSize: PAGE_SIZE.DEFAULT })

  // 特效状态
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFailure, setShowFailure] = useState(false)
  const [failureMessage, setFailureMessage] = useState('')
  const navigate = useNavigate()
  const [registeringComp, setRegisteringComp] = useState<CompetitionItem | null>(null)
  const [contactPhone, setContactPhone] = useState('')
  const [isTeamRegistration, setIsTeamRegistration] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [teamList, setTeamList] = useState<TeamItem[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const isMobile = useIsMobile()
  const [remark, setRemark] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const fetchData = useCallback(async () => {
    const params: Record<string, unknown> = { current: pagination.current, size: pagination.pageSize, status: 2 }
    if (searchQuery) params.keyword = searchQuery
    if (statusFilter !== 'all') params.status = statusFilter
    else params.status = undefined // 显示所有已发布的
    return competitionApi.list(params as Parameters<typeof competitionApi.list>[0])
  }, [pagination.current, pagination.pageSize, searchQuery, statusFilter])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const compResult = await fetchData()
      setCompetitions(compResult.records)
      setTotal(compResult.total)
      pagination.setTotal(compResult.total)
    } catch (err) {
      console.error('加载竞赛数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchData])

  useEffect(() => {
    fetchData().then(compResult => {
      setCompetitions(compResult.records)
      setTotal(compResult.total)
      pagination.setTotal(compResult.total)
    }).catch(err => {
      console.error('加载竞赛数据失败:', err)
    }).finally(() => setLoading(false))
  }, [fetchData])

  // 筛选条件变化时重置到第1页
  useEffect(() => { pagination.resetPage() }, [searchQuery, statusFilter])

  const handleRegister = async (comp: CompetitionItem) => {
    if (!user) return
    if (contactPhone && !phoneRegex.test(contactPhone)) return
    try {
      await registrationApi.register({
        competitionId: comp.id,
        contactPhone,
        teamId: isTeamRegistration ? selectedTeamId ?? undefined : undefined,
        remark: remark || undefined,
        attachmentUrl: attachmentUrl || undefined,
      })
      // 显示庆祝特效
      setShowConfetti(true)
      setContactPhone('')
      setRemark('')
      setAttachmentUrl('')
      setIsTeamRegistration(false)
      setSelectedTeamId(null)
      setTeamList([])
      setRegisteringComp(null)
      loadData()
    } catch (err) {
      // 显示失败特效
      setFailureMessage(err instanceof Error ? err.message : '报名失败')
      setShowFailure(true)
    }
  }

  const loadTeamList = async (competitionId: number) => {
    setTeamsLoading(true)
    try {
      const res = await registrationApi.teamList({ competitionId, current: 1, size: 50 })
      setTeamList(res.records)
    } catch (err) {
      console.error('加载团队列表失败:', err)
    } finally {
      setTeamsLoading(false)
    }
  }

  const phoneRegex = /^1[3-9]\d{9}$/
  const phoneError = contactPhone.length > 0 && !phoneRegex.test(contactPhone) ? '请输入正确的手机号' : ''

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await fileApi.upload(file)
      setAttachmentUrl(res.url)
    } catch (err) {
      console.error('上传附件失败:', err)
    } finally {
      setUploading(false)
    }
  }

  if (loading && competitions.length === 0) {
    return <ListSkeleton />
  }

  return (
    <>
      {/* Search bar */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" style={{ marginBottom: '16px' }}>
        <div className="search-wrap" style={{ maxWidth: '100%' }}>
          <Search strokeWidth={1.5} />
          <input
            className="glass-search"
            placeholder="搜索竞赛名称、主办方或描述..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); pagination.resetPage() }}
            style={{ marginBottom: 0 }}
          />
        </div>
      </motion.div>

      {/* Status filter chips */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} style={{ marginBottom: '12px' }}>
        <div className="chip-row">
          {(Object.keys(statusFilterLabels) as string[]).map((key) => (
            <button
              key={key}
              className={`chip ${statusFilter === (key === 'all' ? 'all' : Number(key)) ? 'active' : ''}`}
              onClick={() => { setStatusFilter(key === 'all' ? 'all' : Number(key) as StatusFilter); pagination.resetPage() }}
            >
              {statusFilterLabels[key]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results count */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.12 }} style={{ marginBottom: '14px' }}>
        <ListMeta count={total} unit="个" />
      </motion.div>

      {/* Competition cards grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${statusFilter}`}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '16px',
          }}
        >
          {competitions.map((comp) => (
            <motion.div
              key={comp.id}
              variants={staggerItem}
              className="glass-card glass-card-vertical glass-card-static"
              style={{ padding: '18px' }}
            >
              {/* Cover Image */}
              {resolveCoverUrl(comp.coverImage) ? (
                <img
                  src={resolveCoverUrl(comp.coverImage)!}
                  alt={comp.competitionName}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  style={{
                    width: '100%', height: '140px', objectFit: 'cover',
                    borderRadius: '12px', marginBottom: '12px',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%', height: '100px', borderRadius: '12px', marginBottom: '12px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.10) 50%, rgba(236,72,153,0.08) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ImageIcon size={28} strokeWidth={1.2} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
                </div>
              )}

              {/* Top: Name + badges */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.35, flex: 1 }}>
                    {comp.competitionName}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <span
                      className={`glass-badge ${comp.status === 2 ? 'pass' : comp.status === 3 ? 'reviewing' : 'pending'}`}
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                    >
                      {statusBadgeLabel[comp.status] ?? '未知'}
                    </span>
                  </div>
                </div>

                {/* Organizer */}
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  主办方：{comp.organizer}
                </div>

                {/* Description truncated */}
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    marginBottom: '10px',
                  }}
                >
                  {comp.description}
                </div>
              </div>

              {/* Meta info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Calendar size={12} strokeWidth={1.5} />
                  报名：{formatDate(comp.registrationStart)} ~ {formatDate(comp.registrationEnd)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <MapPin size={12} strokeWidth={1.5} />
                  {comp.location || '待定'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Users size={12} strokeWidth={1.5} />
                  已报名 {comp.registrationCount}
                  {comp.maxTeams ? ` / ${comp.maxTeams} 队` : ' 人'}
                  <span style={{ marginLeft: '8px' }}>每队 {comp.maxMembers} 人</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Clock size={12} strokeWidth={1.5} />
                  比赛：{formatDate(comp.competitionStart)} ~ {formatDate(comp.competitionEnd)}
                </div>
              </div>

              {/* 倒计时 - 仅报名中的竞赛显示 */}
              {comp.status === 2 && !comp.hasRegistered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ marginBottom: '12px' }}
                >
                  <CountdownTimer
                    deadline={comp.registrationEnd}
                    startDate={comp.registrationStart}
                  />
                </motion.div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button className="btn ghost" style={{ flex: 1, height: '32px', fontSize: '12px' }} onClick={() => navigate(`/student/competitions/${comp.id}`)}>
                  查看详情
                </button>
                {comp.status === 2 && (
                  comp.hasRegistered ? (
                    <button className="btn ghost" style={{ flex: 1, height: '32px', fontSize: '12px', color: 'var(--text-tertiary)' }} disabled>
                      已报名
                    </button>
                  ) : (
<button className="btn ghost" style={{ flex: 1, height: '32px', fontSize: '12px' }} onClick={() => { setRegisteringComp(comp); setContactPhone(''); setRemark(''); setAttachmentUrl(''); setIsTeamRegistration(false); setSelectedTeamId(null); setTeamList([]) }}>
                        立即报名
                      </button>
                  )
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <Pagination
        current={pagination.current}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setCurrent}
        onPageSizeChange={pagination.setPageSize}
      />

      {competitions.length === 0 && !loading && (
        <EmptyState text="暂无符合条件的竞赛" />
      )}

      {/* 庆祝特效 */}
      <ConfettiEffect
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
        duration={3000}
      />

      {/* 失败特效 */}
      <FailureEffect
        show={showFailure}
        message={failureMessage}
        onComplete={() => setShowFailure(false)}
        duration={2500}
      />

      {/* 报名确认模态框 */}
      <GlassModal open={!!registeringComp} onClose={() => { setRegisteringComp(null); setRemark(''); setAttachmentUrl(''); setIsTeamRegistration(false); setSelectedTeamId(null); setTeamList([]) }} title="确认报名" maxWidth="420px">
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {registeringComp?.competitionName}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={isTeamRegistration}
                    onChange={(e) => {
                      setIsTeamRegistration(e.target.checked)
                      setSelectedTeamId(null)
                      if (e.target.checked && registeringComp) {
                        loadTeamList(registeringComp.id)
                      }
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
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '8px 0' }}>暂无可用团队，请先创建团队</div>
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
                    id="registration-file-input"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.png"
                  />
                  <button
                    className="btn ghost"
                    type="button"
                    style={{ height: '32px', fontSize: '12px' }}
                    onClick={() => document.getElementById('registration-file-input')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? '上传中...' : '选择文件'}
                  </button>
                  {attachmentUrl && (
                    <span style={{ fontSize: '12px', color: 'var(--accent)' }}>
                      已上传
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn ghost" onClick={() => { setRegisteringComp(null); setRemark(''); setAttachmentUrl('') }}>取消</button>
                <button className="btn ghost" onClick={() => handleRegister(registeringComp!)}>确认报名</button>
              </div>
      </GlassModal>
    </>
  )
}
