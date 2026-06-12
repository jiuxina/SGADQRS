import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Search,
  Plus,
  Settings,
  Archive,
  Trash2,
} from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { mockCompetitions, mockCategories } from '../data/mockData'

type StatusFilter = 'all' | 'draft' | 'pending' | 'published' | 'ongoing' | 'ended' | 'rejected'

const statusLabels: Record<string, string> = {
  all: '全部',
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  ongoing: '进行中',
  ended: '已结束',
  rejected: '已驳回',
}

const statusBadgeClass: Record<string, string> = {
  draft: 'pending',
  pending: 'reviewing',
  published: 'pass',
  ongoing: 'reviewing',
  ended: 'pass',
  rejected: 'fail',
}

const statusDisplayText: Record<string, string> = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  ongoing: '进行中',
  ended: '已结束',
  rejected: '已驳回',
}

// Simulate "my" competitions — filter by publisherName '王建国'
const myCompetitions = mockCompetitions.filter((c) => c.publisherName === '王建国')

function getCategoryName(categoryId: string) {
  return mockCategories.find((c) => c.id === categoryId)?.name ?? '未知'
}

export default function TeacherCompetitions() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const totalCount = myCompetitions.length
  const ongoingCount = myCompetitions.filter((c) => c.status === 'ongoing').length
  const pendingCount = myCompetitions.filter((c) => c.status === 'pending').length
  const endedCount = myCompetitions.filter((c) => c.status === 'ended').length

  const filtered = myCompetitions.filter((c) => {
    const matchSearch = c.name.includes(searchQuery)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <>
      {/* Top metrics row */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: '我发布的竞赛', value: totalCount },
          { label: '进行中', value: ongoingCount },
          { label: '待审核', value: pendingCount },
          { label: '已结束', value: endedCount },
        ].map((item) => (
          <motion.div key={item.label} className="metric-card" style={{ padding: '16px' }} variants={staggerItem}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {item.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Competition Table */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0', marginTop: '24px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        {/* Table header */}
        <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            竞赛管理
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {filtered.length}项
            </span>
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="search-wrap" style={{ width: '180px' }}>
              <Search strokeWidth={1.5} />
              <input
                className="glass-search"
                placeholder="搜索竞赛名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <button
              className="btn filled-primary"
              onClick={() => navigate('/teacher/competitions/create')}
            >
              <Plus size={14} strokeWidth={2} /> 发布新竞赛
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ padding: '0 18px 12px' }}>
          <div className="chip-row">
            {(['all', 'draft', 'pending', 'published', 'ongoing', 'ended', 'rejected'] as StatusFilter[]).map((f) => (
              <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {statusLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th>竞赛名称</th>
              <th>分类</th>
              <th>报名人数</th>
              <th>报名时间</th>
              <th>比赛时间</th>
              <th>状态</th>
              <th style={{ width: '160px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((comp) => (
              <tr key={comp.id}>
                <td style={{ fontWeight: '600' }}>{comp.name}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {getCategoryName(comp.categoryId)}
                </td>
                <td>
                  <span style={{ fontWeight: '700' }}>{comp.registeredCount}</span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginLeft: '4px' }}>人</span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {comp.registrationStart} ~ {comp.registrationEnd}
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {comp.competitionStart} ~ {comp.competitionEnd}
                </td>
                <td>
                  <span className={`glass-badge ${statusBadgeClass[comp.status]}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                    {statusDisplayText[comp.status]}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      className="text-btn blue"
                      onClick={() => navigate('/teacher/competitions/create')}
                      style={{ fontSize: '12px' }}
                    >
                      <Settings size={12} strokeWidth={1.5} style={{ marginRight: '2px' }} />
                      管理
                    </button>
                    {comp.status === 'published' && (
                      <button className="text-btn warning" style={{ fontSize: '12px' }}>
                        <Archive size={12} strokeWidth={1.5} style={{ marginRight: '2px' }} />
                        下架
                      </button>
                    )}
                    {(comp.status === 'draft' || comp.status === 'rejected') && (
                      <button className="text-btn danger" style={{ fontSize: '12px' }}>
                        <Trash2 size={12} strokeWidth={1.5} style={{ marginRight: '2px' }} />
                        删除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px 0' }}>
                  暂无竞赛数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
