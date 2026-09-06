import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ImageIcon, Plus } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { ListSkeleton, LoadingBar } from '../components/PageSkeleton'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { competitionApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem } from '../api/types'
import { toast } from '../components/toastUtils'
import { confirmDialog } from '../components/confirmDialogUtils'
import { resolveCoverUrl } from '../utils/format'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import { getStatusBadge } from '../utils/statusBadge'

export default function TeacherCompetitions() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all')
  const pagination = usePagination()
  const fetchData = useCallback(async () => {
    if (!user) return null
    const params: Record<string, unknown> = { current: pagination.current, size: pagination.pageSize, publisherId: user.id }
    if (statusFilter !== 'all') params.status = statusFilter
    return competitionApi.list(params as Parameters<typeof competitionApi.list>[0])
  }, [user, statusFilter, pagination.current, pagination.pageSize])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchData()
      if (!result) return
      setCompetitions(result.records)
      pagination.setTotal(result.total)
    } catch (err) { toast.error('加载竞赛列表失败'); console.error('加载竞赛失败:', err) }
    finally { setLoading(false) }
  }, [fetchData])

  useEffect(() => {
    fetchData().then(result => {
      if (!result) return
      setCompetitions(result.records)
      pagination.setTotal(result.total)
    }).catch(err => { toast.error('加载竞赛列表失败'); console.error('加载竞赛失败:', err) })
      .finally(() => setLoading(false))
  }, [fetchData])

  // 筛选条件变化时重置到第1页
  useEffect(() => { pagination.resetPage() }, [statusFilter])

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({ message: '确定要删除此竞赛吗？', variant: 'danger', confirmText: '删除' })
    if (!confirmed) return
    try { await competitionApi.delete(id); loadData(); toast.success('删除成功') }
    catch (err) { toast.error(err instanceof Error ? err.message : '删除失败') }
  }

  const formatShortDate = (dateStr: string) => dateStr ? dateStr.slice(5, 10) : '-'

  if (loading && competitions.length === 0) return <ListSkeleton />

  return (
    <>
      <motion.div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <div className="chip-row">
          {[{ key: 'all', label: '全部' }, { key: 0, label: '草稿' }, { key: 2, label: '已发布' }, { key: 3, label: '进行中' }, { key: 4, label: '已结束' }].map((opt) => (
            <button key={String(opt.key)} className={`chip ${statusFilter === opt.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(opt.key as number | 'all')}>
              {opt.label}
            </button>
          ))}
        </div>
        <button
          className="btn primary filled-primary"
          style={{ height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
          onClick={() => navigate('/teacher/competitions/create')}
        >
          <Plus size={14} strokeWidth={1.5} />
          发布竞赛
        </button>
      </motion.div>

      <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }}
        variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div variants={staggerItem}>
          <LoadingBar visible={loading && competitions.length > 0} />
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>封面</th><th>竞赛名称</th><th>组队时间</th><th>参赛队伍</th><th>状态</th><th style={{ width: '120px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((comp) => {
                const badge = getStatusBadge(comp.status)
                return (
                  <tr key={comp.id}>
                    <td>
                      {resolveCoverUrl(comp.coverImage) ? (
                        <img
                          src={resolveCoverUrl(comp.coverImage)!}
                          alt=""
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                          style={{ width: '44px', height: '32px', objectFit: 'cover', borderRadius: '6px', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          width: '44px', height: '32px', borderRadius: '6px',
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.10) 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <ImageIcon size={14} strokeWidth={1.2} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {comp.competitionName}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {formatShortDate(comp.registrationStart)} ~ {formatShortDate(comp.registrationEnd)}
                    </td>
                    <td><span style={{ fontWeight: '600' }}>{comp.registrationCount}</span></td>
                    <td>
                      <span className={`glass-badge ${badge.cls}`} style={{ fontSize: '12px', padding: '2px 8px' }}>{badge.label}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="text-btn blue" style={{ fontSize: '12px' }} onClick={() => navigate(`/teacher/competitions/${comp.id}`)}>管理</button>
                        <button className="text-btn" style={{ fontSize: '12px', color: 'var(--accent)' }} onClick={() => navigate(`/teacher/competitions/${comp.id}/edit`)}>编辑</button>
                        <button className="text-btn" style={{ fontSize: '12px', color: 'var(--danger)' }} onClick={() => handleDelete(comp.id)}>删除</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {competitions.length === 0 && !loading && (
                <tr><td colSpan={7}><EmptyState text="暂无竞赛" /></td></tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </motion.div>

      <Pagination
        current={pagination.current}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setCurrent}
        onPageSizeChange={pagination.setPageSize}
      />

    </>
  )
}
