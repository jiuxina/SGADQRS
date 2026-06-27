import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Pencil, Send, RotateCcw, Trash2, Pin, X } from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp, panelSlideIn } from '../motion/variants'
import { noticeApi } from '../api'
import type { NoticeItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/Toast'
import { confirmDialog } from '../components/ConfirmDialog'
import { useIsMobile } from '../hooks/useIsMobile'

type FilterType = 'all' | 'notice' | 'announcement' | 'published' | 'draft'

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'notice', label: '通知' },
  { key: 'announcement', label: '公告' },
  { key: 'published', label: '已发布' },
  { key: 'draft', label: '草稿' },
]

export default function AdminNotices() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState<'notice' | 'announcement'>('notice')
  const [notices, setNotices] = useState<NoticeItem[]>([])
  const [, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const isMobile = useIsMobile()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current: 1, size: PAGE_SIZE.LARGE }
      if (filter === 'notice') params.noticeType = 1
      else if (filter === 'announcement') params.noticeType = 2
      const result = await noticeApi.list(params as Parameters<typeof noticeApi.list>[0])
      setNotices(result.records)
    } catch (err) { console.error('加载公告失败:', err) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { loadData() }, [loadData])

  const filtered = notices.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'published') return n.status === 1
    if (filter === 'draft') return n.status === 0
    return true
  })

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    try {
      if (editingId) {
        await noticeApi.update({ id: editingId, noticeTitle: newTitle, noticeContent: newContent, noticeType: newType === 'notice' ? 1 : 2 })
      } else {
        await noticeApi.create({ noticeTitle: newTitle, noticeContent: newContent, noticeType: newType === 'notice' ? 1 : 2 })
      }
      setShowModal(false); setEditingId(null); setNewTitle(''); setNewContent(''); loadData()
    } catch (err) { toast.error(err instanceof Error ? err.message : editingId ? '更新失败' : '创建失败') }
  }

  const handleEdit = (notice: NoticeItem) => {
    setEditingId(notice.id)
    setNewTitle(notice.noticeTitle)
    setNewContent(notice.noticeContent)
    setNewType(notice.noticeType === 1 ? 'notice' : 'announcement')
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({ message: '确定要删除此公告吗？', variant: 'danger', confirmText: '删除' })
    if (!confirmed) return
    try { await noticeApi.delete(id); loadData(); toast.success('删除成功') }
    catch (err) { toast.error(err instanceof Error ? err.message : '删除失败') }
  }

  const handleWithdraw = async (id: number) => {
    const confirmed = await confirmDialog({ message: '确定要撤回此公告吗？撤回后将变为草稿状态。', variant: 'warning', confirmText: '撤回' })
    if (!confirmed) return
    try { await noticeApi.update({ id, status: 0 }); loadData(); toast.success('撤回成功') }
    catch (err) { toast.error(err instanceof Error ? err.message : '撤回失败') }
  }

  const handlePublishDraft = async (id: number) => {
    try { await noticeApi.update({ id, status: 1 }); loadData(); toast.success('发布成功') }
    catch (err) { toast.error(err instanceof Error ? err.message : '发布失败') }
  }

  const sorted = [...filtered].sort((a, b) => {
    if (a.isTop && !b.isTop) return -1
    if (!a.isTop && b.isTop) return 1
    return b.createTime > a.createTime ? 1 : -1
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
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          共 {sorted.length} 条
          {filter !== 'all' && ` (${filterOptions.find((o) => o.key === filter)?.label})`}
        </span>
        <button
          className="btn primary"
          style={{ gap: '6px' }}
          onClick={() => setShowModal(true)}
        >
          <Plus size={14} strokeWidth={2} /> 发布公告
        </button>
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
            </button>
          ))}
        </div>
      </motion.div>

      {/* Notices Table */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={staggerItem}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>发布时间</th>
                  <th style={{ width: '180px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((notice) => (
                  <tr key={notice.id}>
                    <td>
                      {notice.isTop && (
                        <Pin size={13} strokeWidth={1.5} color="var(--warning)" style={{ transform: 'rotate(45deg)' }} />
                      )}
                    </td>
                    <td style={{ fontWeight: '600', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notice.noticeTitle}
                    </td>
                    <td>
                      <span className={`glass-badge ${notice.noticeType === 2 ? 'reviewing' : 'pending'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {notice.noticeType === 1 ? '通知' : '公告'}
                      </span>
                    </td>
                    <td>
                      <span className={`glass-badge ${notice.status === 1 ? 'pass' : 'pending'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {notice.status === 1 ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                      {notice.publishTime || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          onClick={() => handleEdit(notice)}>
                          <Pencil size={11} strokeWidth={1.5} /> 编辑
                        </button>
                        {notice.status === 0 ? (
                          <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}
                            onClick={() => handlePublishDraft(notice.id)}>
                            <Send size={11} strokeWidth={1.5} /> 发布
                          </button>
                        ) : (
                          <button className="text-btn" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--warning)' }}
                            onClick={() => handleWithdraw(notice.id)}>
                            <RotateCcw size={11} strokeWidth={1.5} /> 撤回
                          </button>
                        )}
                        <button className="text-btn" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--danger)' }}
                          onClick={() => handleDelete(notice.id)}>
                          <Trash2 size={11} strokeWidth={1.5} /> 删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      未找到匹配的通知
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Publish Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="glass-card glass-card-vertical glass-card-static"
              style={{ width: isMobile ? 'calc(100vw - 32px)' : '480px', padding: '24px', position: 'relative' }}
              variants={panelSlideIn}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  padding: '4px',
                }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>

              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                发布新通知/公告
              </div>

              {/* Type selector */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>类型</div>
                <div className="chip-row">
                  <button
                    className={`chip ${newType === 'notice' ? 'active' : ''}`}
                    onClick={() => setNewType('notice')}
                  >
                    通知
                  </button>
                  <button
                    className={`chip ${newType === 'announcement' ? 'active' : ''}`}
                    onClick={() => setNewType('announcement')}
                  >
                    公告
                  </button>
                </div>
              </div>

              {/* Title input */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>标题</div>
                <input
                  className="glass-input"
                  placeholder="请输入标题..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Content textarea */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>内容</div>
                <textarea
                  className="glass-input"
                  placeholder="请输入内容..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={5}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn ghost" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button className="btn primary" style={{ gap: '6px' }} onClick={handleCreate}>
                  <Send size={13} strokeWidth={2} /> 发布
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
