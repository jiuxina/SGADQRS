import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Trophy,
  Download,
  Users,
  Calendar,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import { fadeInList, fadeSlideUp } from '../motion/variants'
import { resultApi, exportApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { ResultItem } from '../api/types'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatDate } from '../utils/format'
import { toast } from '../components/toastUtils'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'

export default function StudentGrades() {
  const user = useAuthStore((s) => s.user)
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const pagination = usePagination()

  const fetchData = useCallback(async () => {
    if (!user) return null
    return resultApi.list({ current: pagination.current, size: pagination.pageSize, studentId: user.id, isPublished: 1 })
  }, [user, pagination.current, pagination.pageSize])

  useEffect(() => {
    fetchData().then(result => {
      if (!result) return
      setResults(result.records)
      pagination.setTotal(result.total)
    }).catch(err => {
      toast.error('加载成绩数据失败')
      console.error('加载成绩数据失败:', err)
    }).finally(() => setLoading(false))
  }, [fetchData])

  const handleExportTranscript = async () => {
    try {
      await exportApi.studentTranscript()
      toast.success('成绩单导出成功')
    } catch (e) {
      console.error('加载成绩失败:', e)
      toast.error('导出失败')
    }
  }

  if (loading && results.length === 0) {
    return <ListSkeleton />
  }

  return (
    <>
      {/* Section header */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }} style={{ marginTop: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
          成绩明细
          <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
            {results.length}条
          </span>
        </span>
        {results.length > 0 && (
          <button
            className="btn ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
            onClick={handleExportTranscript}
          >
            <Download size={14} strokeWidth={1.5} />
            导出成绩单
          </button>
        )}
      </motion.div>

      {/* Results cards grid */}
      <motion.div
        variants={fadeInList}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '12px',
        }}
      >
        {results.map((result) => {
          return (
            <div
              key={result.id}
              className="glass-card glass-card-vertical glass-card-static"
              style={{ padding: '12px', cursor: 'pointer' }}
              onClick={() => navigate(`/student/competitions/${result.competitionId}`)}
            >
              {/* Top: Name + status badge */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.35, flex: 1 }}>
                    {result.competitionName || '-'}
                  </span>
                  {result.isPublished === 1 ? (
                    <span className="glass-badge pass" style={{ fontSize: '12px', padding: '2px 8px', flexShrink: 0 }}>已发布</span>
                  ) : (
                    <span className="glass-badge pending" style={{ fontSize: '12px', padding: '2px 8px', flexShrink: 0 }}>待公布</span>
                  )}
                </div>
              </div>

              {/* Score + Ranking highlight */}
              {(result.score !== null || result.ranking !== null) && (
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.02)',
                }}>
                  {result.score !== null && (
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>分数</div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {result.score}
                      </div>
                    </div>
                  )}
                  {result.ranking !== null && (
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>排名</div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {result.ranking}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Award highlight */}
              {result.awardName && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  marginBottom: '12px',
                }}>
                  <Trophy size={14} strokeWidth={1.8} color="#d97706" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#d97706' }}>
                    {result.awardName}
                  </span>
                </div>
              )}

              {/* Meta info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Users size={12} strokeWidth={1.5} />
                  队伍：{result.teamName || <span style={{ color: 'var(--text-tertiary)' }}>个人参赛</span>}
                </div>
                {result.remark && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    备注：{result.remark}
                  </div>
                )}
                {result.publishTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <Calendar size={12} strokeWidth={1.5} />
                    发布时间：{formatDate(result.publishTime)}
                  </div>
                )}
              </div>

              {/* Status indicator */}
              {result.isPublished === 1 ? (
                <div style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--success, #10b981)',
                  padding: '6px 0',
                  marginTop: 'auto',
                  fontWeight: '500',
                }}>
                  已发布
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  padding: '6px 0',
                  marginTop: 'auto',
                }}>
                  成绩待公布
                </div>
              )}
            </div>
          )
        })}
      </motion.div>

      <Pagination
        current={pagination.current}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setCurrent}
        onPageSizeChange={pagination.setPageSize}
      />

      {results.length === 0 && !loading && (
        <EmptyState text="暂无成绩记录" />
      )}

    </>
  )
}
