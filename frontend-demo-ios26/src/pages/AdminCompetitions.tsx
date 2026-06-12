import { useState } from 'react'
import { motion } from 'motion/react'
import { Search, Check, X, Eye } from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { mockCompetitions, mockCategories } from '../data/mockData'

type FilterStatus = 'all' | 'pending' | 'published' | 'ongoing' | 'ended' | 'draft' | 'rejected'

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'published', label: '已发布' },
  { key: 'ongoing', label: '进行中' },
  { key: 'ended', label: '已结束' },
  { key: 'draft', label: '草稿' },
  { key: 'rejected', label: '已驳回' },
]

const statusBadgeMap: Record<string, { cls: string; label: string }> = {
  pending: { cls: 'pending', label: '待审核' },
  published: { cls: 'pass', label: '已发布' },
  ongoing: { cls: 'reviewing', label: '进行中' },
  ended: { cls: 'fail', label: '已结束' },
  draft: { cls: 'pending', label: '草稿' },
  rejected: { cls: 'fail', label: '已驳回' },
}

export default function AdminCompetitions() {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const pendingCount = mockCompetitions.filter((c) => c.status === 'pending').length

  const categoryMap = Object.fromEntries(mockCategories.map((cat) => [cat.id, cat.name]))

  const filtered = mockCompetitions.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.name.includes(searchQuery) ||
      c.publisherName.includes(searchQuery) ||
      c.organizer.includes(searchQuery)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <>
      {/* Header row */}
      <motion.div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            共 {filtered.length} 项竞赛
            {pendingCount > 0 && (
              <span style={{ color: 'var(--warning)', fontWeight: '600', marginLeft: '12px' }}>
                {pendingCount} 项待审核
              </span>
            )}
          </span>
        </div>
        <div className="search-wrap" style={{ width: '220px' }}>
          <Search strokeWidth={1.5} />
          <input
            className="glass-search"
            placeholder="搜索竞赛名称 / 发布者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>
      </motion.div>

      {/* Filter chips */}
      <motion.div
        style={{ marginBottom: '16px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.05 }}
      >
        <div className="chip-row">
          {filterOptions.map((opt) => (
            <button key={opt.key} className={`chip ${filter === opt.key ? 'active' : ''}`} onClick={() => setFilter(opt.key)}>
              {opt.label}
              {opt.key === 'pending' && pendingCount > 0 && (
                <span
                  style={{
                    marginLeft: '6px',
                    background: 'var(--warning)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '0 5px',
                    fontSize: '10px',
                    fontWeight: '700',
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <table className="data-table">
            <thead>
              <tr>
                <th>竞赛名称</th>
                <th>发布者</th>
                <th>分类</th>
                <th>报名时间</th>
                <th>报名人数</th>
                <th>状态</th>
                <th style={{ width: '140px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((comp) => {
                const badge = statusBadgeMap[comp.status] ?? { cls: 'pending', label: comp.status }
                return (
                  <tr key={comp.id}>
                    <td style={{ fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {comp.name}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{comp.publisherName}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {categoryMap[comp.categoryId] ?? '未分类'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {comp.registrationStart.slice(5)} ~ {comp.registrationEnd.slice(5)}
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{comp.registeredCount}</span>
                    </td>
                    <td>
                      <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      {comp.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn primary" style={{ padding: '4px 10px', fontSize: '12px', gap: '4px' }}>
                            <Check size={12} strokeWidth={2} /> 通过
                          </button>
                          <button className="btn ghost" style={{ padding: '4px 10px', fontSize: '12px', gap: '4px', color: 'var(--danger)' }}>
                            <X size={12} strokeWidth={2} /> 拒绝
                          </button>
                        </div>
                      ) : (
                        <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={12} strokeWidth={1.5} /> 查看详情
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    未找到匹配的竞赛
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
