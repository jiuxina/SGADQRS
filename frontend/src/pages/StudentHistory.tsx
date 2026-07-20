import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Trophy,
  Calendar,
  Users,
  FileText,
  Award,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Timer,
  BarChart3,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import { staggerContainer, staggerItem } from '../motion/variants'
import { registrationApi, resultApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { RegistrationItem, ResultItem } from '../api/types'
import { RegistrationStatus, REGISTRATION_STATUS_LABEL } from '../config/constants'
import { formatDate } from '../utils/format'
import { useIsMobile } from '../hooks/useIsMobile'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import { toast } from '../components/toastUtils'

// ===== Types =====

interface TimelineEntry {
  competitionId: number
  competitionName: string
  registration?: RegistrationItem
  result?: ResultItem
}

type LifecycleStage = 'registered' | 'approved' | 'rejected' | 'participating' | 'scored' | 'awarded'

// ===== Helpers =====

function getStage(entry: TimelineEntry): LifecycleStage {
  if (entry.result?.awardLevel) return 'awarded'
  if (entry.result?.score !== null && entry.result?.score !== undefined) return 'scored'
  if (entry.registration?.status === RegistrationStatus.APPROVED) return 'approved'
  if (entry.registration?.status === RegistrationStatus.REJECTED) return 'rejected'
  return 'registered'
}

function getStageLabel(stage: LifecycleStage): string {
  switch (stage) {
    case 'registered': return '已报名'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    case 'participating': return '参赛中'
    case 'scored': return '已有成绩'
    case 'awarded': return '已获奖'
  }
}

function getStageIcon(stage: LifecycleStage) {
  switch (stage) {
    case 'registered': return FileText
    case 'approved': return CheckCircle2
    case 'rejected': return XCircle
    case 'participating': return Timer
    case 'scored': return BarChart3
    case 'awarded': return Trophy
  }
}

function getStageColor(stage: LifecycleStage): string {
  switch (stage) {
    case 'registered': return 'var(--text-tertiary)'
    case 'approved': return '#16a34a'
    case 'rejected': return '#dc2626'
    case 'participating': return '#2563eb'
    case 'scored': return 'var(--accent)'
    case 'awarded': return '#d97706'
  }
}

/** Get the most recent date for sorting */
function getEntryDate(entry: TimelineEntry): string {
  const dates = [
    entry.result?.publishTime,
    entry.result?.createTime,
    entry.registration?.auditTime,
    entry.registration?.createTime,
  ].filter(Boolean) as string[]
  return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || ''
}

// ===== Sub-components =====

function StageTimeline({ stage }: { stage: LifecycleStage }) {
  const stages: LifecycleStage[] = ['registered', 'approved', 'scored', 'awarded']
  const currentIdx = stages.indexOf(stage === 'rejected' ? 'registered' : stage)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '10px 0' }}>
      {stages.map((s, i) => {
        const active = i <= currentIdx && stage !== 'rejected'
        const Icon = getStageIcon(s)
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? getStageColor(s) : 'rgba(0,0,0,0.06)',
                transition: 'background 0.2s',
              }}
            >
              <Icon size={11} strokeWidth={2} color={active ? '#fff' : 'var(--text-tertiary)'} />
            </div>
            {i < stages.length - 1 && (
              <div
                style={{
                  width: '20px',
                  height: '2px',
                  borderRadius: '1px',
                  background: i < currentIdx && stage !== 'rejected' ? getStageColor(s) : 'rgba(0,0,0,0.08)',
                  transition: 'background 0.2s',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function renderStageIcon(stage: LifecycleStage, size: number, strokeWidth: number, color: string) {
  const Icon = getStageIcon(stage)
  return <Icon size={size} strokeWidth={strokeWidth} color={color} />
}

function TimelineCard({ entry }: { entry: TimelineEntry }) {
  const [expanded, setExpanded] = useState(false)
  const stage = getStage(entry)
  const stageColor = getStageColor(stage)

  return (
    <motion.div
      variants={staggerItem}
      className="glass-card glass-card-vertical glass-card-static"
      style={{ padding: '16px', cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            {renderStageIcon(stage, 14, 2, stageColor)}
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.35 }}>
              {entry.competitionName || '-'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: stageColor, fontWeight: '600' }}>
            {getStageLabel(stage)}
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} strokeWidth={1.5} color="var(--text-tertiary)" />
        </motion.div>
      </div>

      {/* Lifecycle progress bar */}
      <StageTimeline stage={stage} />

      {/* Quick summary */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
        {entry.registration?.createTime && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Calendar size={11} strokeWidth={1.5} />
            报名 {formatDate(entry.registration.createTime)}
          </span>
        )}
        {entry.result?.score !== null && entry.result?.score !== undefined && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <BarChart3 size={11} strokeWidth={1.5} />
            {entry.result.score}分
          </span>
        )}
        {entry.result?.awardName && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#d97706' }}>
            <Trophy size={11} strokeWidth={1.5} />
            {entry.result.awardName}
          </span>
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '10px', paddingTop: '10px' }}>
              {/* Registration details */}
              {entry.registration && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    报名信息
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <span>状态：{REGISTRATION_STATUS_LABEL[entry.registration.status as RegistrationStatus] || '未知'}</span>
                    {entry.registration.teamName && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Users size={11} strokeWidth={1.5} />
                        团队：{entry.registration.teamName}
                      </span>
                    )}
                    {entry.registration.remark && <span>备注：{entry.registration.remark}</span>}
                    {entry.registration.auditTime && <span>审核时间：{formatDate(entry.registration.auditTime)}</span>}
                  </div>
                </div>
              )}

              {/* Result details */}
              {entry.result && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    成绩信息
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {entry.result.score !== null && <span>分数：{entry.result.score}</span>}
                    {entry.result.ranking !== null && <span>排名：第{entry.result.ranking}名</span>}
                    {entry.result.awardName && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#d97706' }}>
                        <Award size={11} strokeWidth={1.5} />
                        {entry.result.awardName}
                      </span>
                    )}
                    {entry.result.publishTime && <span>发布时间：{formatDate(entry.result.publishTime)}</span>}
                    {entry.result.remark && <span>备注：{entry.result.remark}</span>}
                  </div>
                </div>
              )}

              {/* No result yet */}
              {!entry.result && entry.registration?.status === RegistrationStatus.APPROVED && (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  成绩尚未公布
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ===== Main Component =====

export default function StudentHistory() {
  const user = useAuthStore((s) => s.user)
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([])
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const pagination = usePagination()

  const fetchData = useCallback(async () => {
    if (!user) return null
    const [regRes, resultRes] = await Promise.all([
      registrationApi.list({ current: 1, size: 200, studentId: user.id }),
      resultApi.list({ current: 1, size: 200, studentId: user.id }),
    ])
    return { registrations: regRes.records, results: resultRes.records }
  }, [user])

  useEffect(() => {
    fetchData().then(data => {
      if (!data) return
      setRegistrations(data.registrations)
      setResults(data.results)
    }).catch(err => {
      toast.error('加载历史数据失败')
      console.error('加载历史数据失败:', err)
    }).finally(() => setLoading(false))
  }, [fetchData])

  // Merge registrations and results into timeline entries
  const timelineEntries = useMemo(() => {
    const entryMap = new Map<number, TimelineEntry>()

    // Add registrations
    for (const reg of registrations) {
      const cid = reg.competitionId
      if (!entryMap.has(cid)) {
        entryMap.set(cid, {
          competitionId: cid,
          competitionName: reg.competitionName || `竞赛#${cid}`,
          registration: reg,
        })
      } else {
        entryMap.get(cid)!.registration = reg
      }
    }

    // Add results
    for (const result of results) {
      const cid = result.competitionId
      if (!entryMap.has(cid)) {
        entryMap.set(cid, {
          competitionId: cid,
          competitionName: result.competitionName || `竞赛#${cid}`,
          result,
        })
      } else {
        entryMap.get(cid)!.result = result
      }
    }

    // Sort by most recent activity descending
    return Array.from(entryMap.values()).sort((a, b) => {
      const dateA = getEntryDate(a)
      const dateB = getEntryDate(b)
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
  }, [registrations, results])

  // 更新分页总数
  useEffect(() => {
    pagination.setTotal(timelineEntries.length)
  }, [timelineEntries.length])

  // 客户端分页
  const paginatedEntries = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize
    return timelineEntries.slice(start, start + pagination.pageSize)
  }, [timelineEntries, pagination.current, pagination.pageSize])

  // Stats
  const totalCompetitions = timelineEntries.length
  const awardedCount = timelineEntries.filter((e) => e.result?.awardLevel).length
  const approvedCount = timelineEntries.filter(
    (e) => e.registration?.status === RegistrationStatus.APPROVED
  ).length

  if (loading && timelineEntries.length === 0) {
    return <ListSkeleton />
  }

  return (
    <>
      {/* Summary metric cards */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '10px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem} className="metric-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <FileText size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>参赛总数</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {totalCompetitions}
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="metric-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <CheckCircle2 size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>通过审核</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {approvedCount}
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="metric-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Trophy size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>获奖次数</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {awardedCount}
          </div>
        </motion.div>
      </motion.div>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
        style={{ marginTop: '16px', marginBottom: '14px' }}
      >
        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
          参赛时间线
          <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
            {timelineEntries.length}条
          </span>
        </span>
      </motion.div>

      {/* Timeline list */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {paginatedEntries.map((entry) => (
          <TimelineCard key={entry.competitionId} entry={entry} />
        ))}
      </motion.div>

      <Pagination
        current={pagination.current}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setCurrent}
        onPageSizeChange={pagination.setPageSize}
      />

      {timelineEntries.length === 0 && !loading && (
        <EmptyState text="暂无参赛历史" />
      )}
    </>
  )
}
