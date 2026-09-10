import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Megaphone, Plus, Users, Clock } from 'lucide-react'
import ListMeta from '../components/ListMeta'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import Pagination from '../components/Pagination'
import UserCardMini from '../components/UserCardMini'
import RecruitPostModal from '../components/RecruitPostModal'
import RecruitDetailModal from '../components/RecruitDetailModal'
import { recruitApi, competitionApi } from '../api'
import type { CompetitionItem, RecruitPostItem } from '../api/types'
import { useIsMobile } from '../hooks/useIsMobile'
import { usePagination } from '../hooks/usePagination'
import { formatDate } from '../utils/format'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'

/**
 * 招募广场：按竞赛浏览组队招募/求组帖（含发布者联系方式），
 * 点击进入详情后直接申请/邀请入队，可附备注快速沟通。
 */
export default function StudentRecruitSquare() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const pagination = usePagination()

  const [posts, setPosts] = useState<RecruitPostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])

  const [filterComp, setFilterComp] = useState<number | ''>('')
  const [filterType, setFilterType] = useState<number | ''>('')
  const [keyword, setKeyword] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await recruitApi.list({
        current: pagination.current,
        size: pagination.pageSize,
        competitionId: filterComp || undefined,
        type: filterType === '' ? undefined : filterType,
        status: 1,
        keyword: keyword.trim() || undefined,
      })
      setPosts(res.records)
      setTotal(res.total)
      pagination.setTotal(res.total)
    } catch {
      // request 层已提示错误
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, filterComp, filterType, keyword])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    competitionApi.list({ current: 1, size: 100 })
      .then((res) => setCompetitions(res.records.filter((c) => c.status === 2 || c.status === 3)))
      .catch(() => setCompetitions([]))
  }, [])

  const openProfile = (userId: number) => navigate(`/student/u/${userId}`)

  return (
    <>
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '12px', flexWrap: 'wrap', gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ width: '180px' }}>
            <input
              className="glass-search"
              placeholder="搜索帖子/标签..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); pagination.setCurrent(1) }}
            />
          </div>
          <select
            className="glass-search"
            value={filterComp}
            onChange={(e) => { setFilterComp(e.target.value ? Number(e.target.value) : ''); pagination.setCurrent(1) }}
            style={{ width: 'auto', minWidth: '140px', marginBottom: 0 }}
          >
            <option value="">全部竞赛</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.competitionName}</option>
            ))}
          </select>
        </div>
        <button
          className="btn primary filled-primary"
          style={{ height: '34px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setShowCreate(true)}
        >
          <Plus size={15} strokeWidth={2} />
          发布组队帖
        </button>
      </motion.div>

      {/* 类型 Tab */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <ListMeta count={total} unit="条" prefix="共" />
        <span style={{ flex: 1 }} />
        {([
          { v: '', label: '全部' },
          { v: 1, label: '📢 组队招募' },
          { v: 2, label: '🙋 求组' },
        ] as { v: number | ''; label: string }[]).map((t) => (
          <button
            key={String(t.v)}
            onClick={() => { setFilterType(t.v); pagination.setCurrent(1) }}
            style={{
              padding: '6px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: '600',
              background: filterType === t.v ? 'var(--accent)' : 'rgba(0,122,255,0.08)',
              color: filterType === t.v ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && posts.length === 0 ? (
        <ListSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`recruit-${filterComp}-${filterType}-${pagination.current}`}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '12px',
            }}
          >
            {posts.map((post) => (
              <motion.div
                key={post.id}
                variants={staggerItem}
                className="glass-card glass-card-vertical glass-card-static"
                style={{ padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}
                onClick={() => setDetailId(post.id)}
                whileHover={{ y: -3 }}
              >
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px',
                    background: post.type === 1 ? 'rgba(0,122,255,0.12)' : 'rgba(255,149,0,0.14)',
                    color: post.type === 1 ? 'var(--accent)' : '#ff9500',
                  }}>
                    {post.type === 1 ? '📢 招募' : '🙋 求组'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.competitionName}
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.title}
                </div>

                {post.content && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.content}
                  </div>
                )}

                {post.tags && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {post.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4).map((t) => (
                      <span key={t} style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                        background: 'rgba(0,122,255,0.08)', color: 'var(--accent)', fontWeight: '600',
                      }}>#{t}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                  {post.type === 1 && post.team && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Users size={11} strokeWidth={1.5} />
                      已有 {post.team.currentMembers} 人
                    </span>
                  )}
                  {post.deadline && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} strokeWidth={1.5} />
                      {formatDate(post.deadline)}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px' }}
                  onClick={(e) => { e.stopPropagation(); openProfile(post.userId) }}>
                  <UserCardMini card={post.author} compact />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <Pagination
        current={pagination.current}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setCurrent}
        onPageSizeChange={pagination.setPageSize}
      />

      {posts.length === 0 && !loading && (
        <EmptyState icon={Megaphone} text="还没有组队帖，发布第一条招募让队友找到你吧" />
      )}

      <RecruitPostModal open={showCreate} onClose={() => setShowCreate(false)} onSaved={load} />
      <RecruitDetailModal postId={detailId} onClose={() => setDetailId(null)} onChanged={load} />
    </>
  )
}
