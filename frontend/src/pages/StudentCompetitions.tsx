import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  MapPin,
  Users,
  Clock,
  Calendar,
} from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { competitionApi, registrationApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem, CompetitionCategory } from '../api/types'

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
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [categories, setCategories] = useState<CompetitionCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current, size: 20, status: 2 }
      if (searchQuery) params.keyword = searchQuery
      if (categoryFilter !== 'all') params.categoryId = categoryFilter
      if (statusFilter !== 'all') params.status = statusFilter
      else params.status = undefined // 显示所有已发布的

      const [compResult, catResult] = await Promise.all([
        competitionApi.list(params as Parameters<typeof competitionApi.list>[0]),
        competitionApi.categories(),
      ])
      setCompetitions(compResult.records)
      setTotal(compResult.total)
      setCategories(catResult)
    } catch (err) {
      console.error('加载竞赛数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [current, searchQuery, categoryFilter, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRegister = async (comp: CompetitionItem) => {
    if (!user) return
    try {
      await registrationApi.register({ competitionId: comp.id, contactPhone: user.phone || '' })
      alert('报名成功！')
      loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '报名失败')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  if (loading && competitions.length === 0) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>
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
            onChange={(e) => { setSearchQuery(e.target.value); setCurrent(1) }}
            style={{ marginBottom: 0 }}
          />
        </div>
      </motion.div>

      {/* Category filter chips */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }} style={{ marginBottom: '10px' }}>
        <div className="chip-row">
          <button
            className={`chip ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setCategoryFilter('all'); setCurrent(1) }}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`chip ${categoryFilter === cat.id ? 'active' : ''}`}
              onClick={() => { setCategoryFilter(cat.id); setCurrent(1) }}
            >
              {cat.categoryName}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Status filter chips */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} style={{ marginBottom: '20px' }}>
        <div className="chip-row">
          {(Object.keys(statusFilterLabels) as string[]).map((key) => (
            <button
              key={key}
              className={`chip ${statusFilter === (key === 'all' ? 'all' : Number(key)) ? 'active' : ''}`}
              onClick={() => { setStatusFilter(key === 'all' ? 'all' : Number(key) as StatusFilter); setCurrent(1) }}
            >
              {statusFilterLabels[key]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results count */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.12 }} style={{ marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          共 <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{total}</span> 个竞赛
        </span>
      </motion.div>

      {/* Competition cards grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${categoryFilter}-${statusFilter}`}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          {competitions.map((comp) => (
            <motion.div
              key={comp.id}
              variants={staggerItem}
              className="glass-card glass-card-vertical"
              style={{ padding: '18px' }}
            >
              {/* Top: Name + badges */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.35, flex: 1 }}>
                    {comp.competitionName}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <span
                      className="glass-badge"
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: 'rgba(0,122,255,0.06)',
                        borderRadius: '6px',
                      }}
                    >
                      {comp.categoryName}
                    </span>
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

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button className="btn ghost" style={{ flex: 1, height: '32px', fontSize: '12px' }}>
                  查看详情
                </button>
                {comp.status === 2 && (
                  comp.hasRegistered ? (
                    <button className="btn ghost" style={{ flex: 1, height: '32px', fontSize: '12px', color: 'var(--text-tertiary)' }} disabled>
                      已报名
                    </button>
                  ) : (
                    <button className="btn primary" style={{ flex: 1, height: '32px', fontSize: '12px' }} onClick={() => handleRegister(comp)}>
                      立即报名
                    </button>
                  )
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {competitions.length === 0 && !loading && (
        <motion.div
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-tertiary)',
            fontSize: '14px',
          }}
        >
          暂无符合条件的竞赛
        </motion.div>
      )}

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
