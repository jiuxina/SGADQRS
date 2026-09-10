import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { ListSkeleton, LoadingBar } from '../components/PageSkeleton'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import EntryModal from '../components/EntryModal'
import { competitionApi } from '../api'
import type { CompetitionItem } from '../api/types'
import CountdownTimer from '../components/CountdownTimer'
import ConfettiEffect from '../components/ConfettiEffect'
import { PAGE_SIZE } from '../config/constants'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatDate, resolveCoverUrl } from '../utils/format'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import { toast } from '../components/toastUtils'
import { getStatusBadge } from '../utils/statusBadge'

type StatusFilter = 'all' | 2 | 3 | 4

const statusFilterLabels: Record<string, string> = {
  all: '全部',
  2: '报名中',
  3: '进行中',
  4: '已结束',
}

export default function StudentCompetitions() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const pagination = usePagination({ defaultPageSize: PAGE_SIZE.DEFAULT })

  // 特效状态
  const [showConfetti, setShowConfetti] = useState(false)
  const navigate = useNavigate()
  const [registeringComp, setRegisteringComp] = useState<CompetitionItem | null>(null)
  const isMobile = useIsMobile()
  const [searchParams] = useSearchParams()

  // 顶栏搜索跳转带来的 ?search= 同步到页内搜索框（与 Admin/Teacher 竞赛页同构）
  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearchQuery(q)
  }, [searchParams])

  const fetchData = useCallback(async () => {
    const params: Record<string, unknown> = { current: pagination.current, size: pagination.pageSize, status: 2 }
    if (debouncedSearch) params.keyword = debouncedSearch
    if (statusFilter !== 'all') params.status = statusFilter
    else params.status = undefined // 显示所有已发布的
    return competitionApi.list(params as Parameters<typeof competitionApi.list>[0])
  }, [pagination.current, pagination.pageSize, debouncedSearch, statusFilter])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const compResult = await fetchData()
      setCompetitions(compResult.records)
      setTotal(compResult.total)
      pagination.setTotal(compResult.total)
    } catch (err) {
      toast.error('加载竞赛数据失败')
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
      toast.error('加载竞赛数据失败')
      console.error('加载竞赛数据失败:', err)
    }).finally(() => setLoading(false))
  }, [fetchData])

  // 筛选条件变化时重置到第1页
  useEffect(() => { pagination.resetPage() }, [debouncedSearch, statusFilter])

  if (loading && competitions.length === 0) {
    return <ListSkeleton />
  }

  return (
    <>
      {/* Search bar */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" style={{ marginBottom: '12px' }}>
        <div className="search-wrap" style={{ maxWidth: '100%' }}>
          <Search strokeWidth={1.5} />
          <input
            className="glass-search"
            placeholder="搜索竞赛名称、主办方或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.12 }} style={{ marginBottom: '12px' }}>
        <ListMeta count={total} unit="个" />
      </motion.div>

      {/* Competition cards grid */}
      <LoadingBar visible={loading && competitions.length > 0} />
      <AnimatePresence mode="wait">
        <motion.div
          key={`${statusFilter}`}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          {competitions.map((comp) => (
            <motion.div
              key={comp.id}
              variants={staggerItem}
              className="glass-card glass-card-vertical"
              title="查看竞赛详情"
              onClick={() => navigate(`/student/competitions/${comp.id}`)}
              style={{ padding: '12px', cursor: 'pointer' }}
            >
              {/* Cover Image */}
              {resolveCoverUrl(comp.coverImage) ? (
                <img
                  src={resolveCoverUrl(comp.coverImage)!}
                  alt={comp.competitionName}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  style={{
                    width: '100%', aspectRatio: '16/9', objectFit: 'cover',
                    borderRadius: '12px', marginBottom: '12px',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%', aspectRatio: '16/9', borderRadius: '12px', marginBottom: '12px',
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
                      style={{ fontSize: '12px', padding: '2px 8px' }}
                    >
                      {getStatusBadge(comp.status, 'student-competition').label}
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
                  参赛队伍 {comp.registrationCount} 队
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
                <button className="btn ghost" style={{ flex: 1, height: '32px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); navigate(`/student/competitions/${comp.id}`) }}>
                  查看详情
                </button>
                {comp.status === 2 && (
                  comp.hasRegistered ? (
                    <button className="btn ghost" style={{ flex: 1, height: '32px', fontSize: '12px', color: 'var(--text-tertiary)' }} disabled>
                      已参赛
                    </button>
                  ) : (
<button className="btn ghost" style={{ flex: 1, height: '32px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); setRegisteringComp(comp) }}>
                        去组队 / 报名
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

      {/* 参赛组队模态框 */}
      <EntryModal
        open={!!registeringComp}
        onClose={() => setRegisteringComp(null)}
        competition={registeringComp ? { id: registeringComp.id, competitionName: registeringComp.competitionName, maxMembers: registeringComp.maxMembers } : null}
        onSuccess={() => {
          setShowConfetti(true)
          setRegisteringComp(null)
          loadData()
        }}
      />
    </>
  )
}
