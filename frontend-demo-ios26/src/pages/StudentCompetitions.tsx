import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  MapPin,
  Users,
  Clock,
  Calendar,
} from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { mockCompetitions, mockCategories } from '../data/mockData'

type StatusFilter = 'all' | 'published' | 'ongoing' | 'ended'

const statusFilterLabels: Record<StatusFilter, string> = {
  all: '全部',
  published: '报名中',
  ongoing: '进行中',
  ended: '已结束',
}

const statusBadgeLabel: Record<string, string> = {
  draft: '草稿',
  pending: '审核中',
  published: '报名中',
  ongoing: '进行中',
  ended: '已结束',
  rejected: '已拒绝',
}

export default function StudentCompetitions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = mockCompetitions.filter((comp) => {
    const matchSearch =
      comp.name.includes(searchQuery) ||
      comp.organizer.includes(searchQuery) ||
      comp.description.includes(searchQuery)
    const matchCategory = categoryFilter === 'all' || comp.categoryId === categoryFilter
    const matchStatus = statusFilter === 'all' || comp.status === statusFilter
    return matchSearch && matchCategory && matchStatus
  })

  const getCategoryName = (categoryId: string) =>
    mockCategories.find((c) => c.id === categoryId)?.name ?? ''

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>
      </motion.div>

      {/* Category filter chips */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }} style={{ marginBottom: '10px' }}>
        <div className="chip-row">
          <button
            className={`chip ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            全部
          </button>
          {mockCategories.map((cat) => (
            <button
              key={cat.id}
              className={`chip ${categoryFilter === cat.id ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Status filter chips */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} style={{ marginBottom: '20px' }}>
        <div className="chip-row">
          {(Object.keys(statusFilterLabels) as StatusFilter[]).map((key) => (
            <button
              key={key}
              className={`chip ${statusFilter === key ? 'active' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              {statusFilterLabels[key]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results count */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.12 }} style={{ marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          共 <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{filtered.length}</span> 个竞赛
        </span>
      </motion.div>

      {/* Competition cards grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${categoryFilter}-${statusFilter}-${searchQuery}`}
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
          {filtered.map((comp) => (
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
                    {comp.name}
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
                      {getCategoryName(comp.categoryId)}
                    </span>
                    <span
                      className={`glass-badge ${comp.status === 'published' ? 'pass' : comp.status === 'ongoing' ? 'reviewing' : 'pending'}`}
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                    >
                      {statusBadgeLabel[comp.status] ?? comp.status}
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
                  {comp.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Users size={12} strokeWidth={1.5} />
                  已报名 {comp.registeredCount}
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
                {comp.status === 'published' && (
                  <button className="btn primary" style={{ flex: 1, height: '32px', fontSize: '12px' }}>
                    立即报名
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
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
