import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Check, X, Eye, Calendar, MapPin, Users, Clock } from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp, panelSlideIn } from '../motion/variants'
import { competitionApi } from '../api'
import type { CompetitionItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/Toast'

type FilterStatus = 'all' | 1 | 2 | 3 | 4 | 0 | 5

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 1, label: '待审核' },
  { key: 2, label: '已发布' },
  { key: 3, label: '进行中' },
  { key: 4, label: '已结束' },
  { key: 0, label: '草稿' },
  { key: 5, label: '已驳回' },
]

const statusBadgeMap: Record<number, { cls: string; label: string }> = {
  1: { cls: 'pending', label: '待审核' },
  2: { cls: 'pass', label: '已发布' },
  3: { cls: 'reviewing', label: '进行中' },
  4: { cls: 'fail', label: '已结束' },
  0: { cls: 'pending', label: '草稿' },
  5: { cls: 'fail', label: '已驳回' },
}

export default function AdminCompetitions() {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedComp, setSelectedComp] = useState<CompetitionItem | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current: 1, size: PAGE_SIZE.LARGE }
      if (filter !== 'all') params.status = filter
      if (searchQuery) params.keyword = searchQuery
      const result = await competitionApi.list(params as Parameters<typeof competitionApi.list>[0])
      setCompetitions(result.records)
      setTotal(result.total)
    } catch (err) {
      console.error('加载竞赛数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [filter, searchQuery])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAudit = async (id: number, status: number) => {
    try {
      await competitionApi.audit(id, status)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const pendingCount = competitions.filter((c) => c.status === 1).length

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return dateStr.slice(5, 10)
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
      <motion.div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            共 {total} 项竞赛
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

      <motion.div style={{ marginBottom: '16px' }} variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
        <div className="chip-row">
          {filterOptions.map((opt) => (
            <button key={String(opt.key)} className={`chip ${filter === opt.key ? 'active' : ''}`} onClick={() => setFilter(opt.key)}>
              {opt.label}
              {opt.key === 1 && pendingCount > 0 && (
                <span style={{
                  marginLeft: '6px', background: 'var(--warning)', color: '#fff',
                  borderRadius: '8px', padding: '0 5px', fontSize: '10px', fontWeight: '700',
                }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

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
              {competitions.map((comp) => {
                const badge = statusBadgeMap[comp.status] ?? { cls: 'pending', label: '未知' }
                return (
                  <tr key={comp.id}>
                    <td style={{ fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {comp.competitionName}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{comp.publisherName || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{comp.categoryName || '未分类'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {formatShortDate(comp.registrationStart)} ~ {formatShortDate(comp.registrationEnd)}
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{comp.registrationCount}</span>
                    </td>
                    <td>
                      <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      {comp.status === 1 ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn primary" style={{ padding: '4px 10px', fontSize: '12px', gap: '4px' }}
                            onClick={() => handleAudit(comp.id, 2)}>
                            <Check size={12} strokeWidth={2} /> 通过
                          </button>
                          <button className="btn ghost" style={{ padding: '4px 10px', fontSize: '12px', gap: '4px', color: 'var(--danger)' }}
                            onClick={() => handleAudit(comp.id, 5)}>
                            <X size={12} strokeWidth={2} /> 拒绝
                          </button>
                        </div>
                      ) : (
                        <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setSelectedComp(comp)}>
                          <Eye size={12} strokeWidth={1.5} /> 查看详情
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {competitions.length === 0 && !loading && (
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

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedComp && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedComp(null)}
          >
            <motion.div
              className="glass-card glass-card-vertical glass-card-static"
              style={{ width: '520px', maxHeight: '80vh', overflow: 'auto', padding: '24px', position: 'relative' }}
              variants={panelSlideIn}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedComp(null)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>

              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', paddingRight: '24px' }}>
                {selectedComp.competitionName}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <span className={`glass-badge ${statusBadgeMap[selectedComp.status]?.cls}`} style={{ fontSize: '11px', padding: '3px 10px' }}>
                  {statusBadgeMap[selectedComp.status]?.label}
                </span>
                {selectedComp.categoryName && (
                  <span className="glass-badge" style={{ fontSize: '11px', padding: '3px 10px', background: 'rgba(0,122,255,0.06)' }}>
                    {selectedComp.categoryName}
                  </span>
                )}
              </div>

              {selectedComp.description && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  {selectedComp.description}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Users size={13} strokeWidth={1.5} />
                  主办方：{selectedComp.organizer || '-'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <MapPin size={13} strokeWidth={1.5} />
                  地点：{selectedComp.location || '待定'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Calendar size={13} strokeWidth={1.5} />
                  报名：{formatDate(selectedComp.registrationStart)} ~ {formatDate(selectedComp.registrationEnd)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <Clock size={13} strokeWidth={1.5} />
                  比赛：{formatDate(selectedComp.competitionStart)} ~ {formatDate(selectedComp.competitionEnd)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedComp.registrationCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>已报名</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedComp.maxTeams || '-'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>最大队伍数</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedComp.maxMembers}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>每队人数</div>
                </div>
              </div>

              {selectedComp.rules && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>竞赛规则</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                    {selectedComp.rules}
                  </div>
                </div>
              )}

              {selectedComp.attachments && selectedComp.attachments.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>附件</div>
                  {selectedComp.attachments.map((att) => (
                    <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'block', fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', padding: '4px 0' }}>
                      {att.fileName}
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
