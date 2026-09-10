import { useState, useEffect, useCallback, type ReactElement } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import { Plus, Pencil, Send, RotateCcw, Trash2, Pin, X, Link, Search } from 'lucide-react'
import ListMeta from '../components/ListMeta'
import { formatDateTime } from '../utils/format'
import { fadeInList, fadeSlideUp, panelSlideIn } from '../motion/variants'
import { noticeApi } from '../api'
import type { NoticeItem } from '../api/types'
import { toast } from '../components/toastUtils'
import { confirmDialog } from '../components/confirmDialogUtils'
import { useIsMobile } from '../hooks/useIsMobile'
import { useDebounce } from '../hooks/useDebounce'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import { LoadingBar } from '../components/PageSkeleton'
import PageTabs, { usePageTab } from '../components/PageTabs'

type NoticeTab = 'all' | 'notice' | 'announcement'
type StatusFilter = 'all' | 1 | 0

const NOTICE_TABS: { key: NoticeTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'notice', label: '通知' },
  { key: 'announcement', label: '公告' },
]

const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部状态' },
  { key: 1, label: '已发布' },
  { key: 0, label: '草稿' },
]

/* ── Rich Text Editor ── */
function RichTextEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: { class: 'ProseMirror-editor' },
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href ?? ''
    const url = window.prompt('输入链接地址', prev)
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const btn = (label: string | ReactElement, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      style={{
        width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary)',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 2, padding: '6px 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary, #f5f5f5)', flexWrap: 'wrap' }}>
        {btn('<b>B</b>', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
        {btn('<i>I</i>', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
        <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        {btn('UL', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run())}
        {btn('OL', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run())}
        <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        {btn(<Link size={13} />, editor.isActive('link'), setLink)}
      </div>
      {/* Editor body */}
      <div style={{ padding: '8px 12px', minHeight: 140 }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

/* ── Page Component ── */
export default function AdminNotices() {
  const [noticeTab, setNoticeTab] = usePageTab(NOTICE_TABS)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState<'notice' | 'announcement'>('notice')
  const [notices, setNotices] = useState<NoticeItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const isMobile = useIsMobile()
  const pagination = usePagination()

  const buildParams = useCallback(() => {
    const params: Record<string, unknown> = { current: pagination.current, size: pagination.pageSize }
    if (noticeTab === 'notice') params.noticeType = 1
    else if (noticeTab === 'announcement') params.noticeType = 2
    if (statusFilter !== 'all') params.status = statusFilter
    if (debouncedSearch) params.keyword = debouncedSearch
    return params
  }, [noticeTab, statusFilter, pagination.current, pagination.pageSize, debouncedSearch])

  const fetchData = useCallback(async () => {
    const params = buildParams()
    return noticeApi.list(params as Parameters<typeof noticeApi.list>[0])
  }, [buildParams])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchData()
      setNotices(result.records)
      setTotal(result.total)
      pagination.setTotal(result.total)
    } catch (err) { toast.error('加载公告失败'); console.error('加载公告失败:', err) }
    finally { setLoading(false) }
  }, [fetchData])

  useEffect(() => {
    fetchData().then(result => {
      setNotices(result.records)
      setTotal(result.total)
      pagination.setTotal(result.total)
    }).catch(err => { toast.error('加载公告失败'); console.error('加载公告失败:', err) }).finally(() => setLoading(false))
  }, [fetchData])

  // 筛选条件变化时重置到第1页
  useEffect(() => { pagination.resetPage() }, [noticeTab, statusFilter, debouncedSearch])

  const handleSave = async (status: 0 | 1 = 1) => {
    if (!newTitle.trim()) return
    try {
      if (editingId) {
        await noticeApi.update({ id: editingId, noticeTitle: newTitle, noticeContent: newContent, noticeType: newType === 'notice' ? 1 : 2, status })
      } else {
        await noticeApi.create({ noticeTitle: newTitle, noticeContent: newContent, noticeType: newType === 'notice' ? 1 : 2, status })
      }
      setShowModal(false); setEditingId(null); setNewTitle(''); setNewContent(''); loadData()
      toast.success(status === 0 ? '草稿已保存' : (editingId ? '更新成功' : '发布成功'))
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

  const handleToggleTop = async (id: number, currentIsTop: number) => {
    try {
      await noticeApi.toggleTop(id)
      toast.success(currentIsTop === 1 ? '已取消置顶' : '已置顶')
      loadData()
    } catch (err) { toast.error(err instanceof Error ? err.message : '操作失败') }
  }

  // 筛选已在服务端完成，直接使用
  const filtered = notices

  const sorted = [...filtered].sort((a, b) => {
    if (a.isTop && !b.isTop) return -1
    if (!a.isTop && b.isTop) return 1
    return b.createTime > a.createTime ? 1 : -1
  })

  return (
    <>
      <style>{`
        .ProseMirror-editor { outline: none; min-height: 120px; font-size: 13px; line-height: 1.6; color: var(--text-primary); }
        .ProseMirror-editor p { margin: 0 0 6px; }
        .ProseMirror-editor p:last-child { margin-bottom: 0; }
        .ProseMirror-editor ul,
        .ProseMirror-editor ol { padding-left: 1.4em; margin: 0 0 6px; }
        .ProseMirror-editor li { margin-bottom: 2px; }
        .ProseMirror-editor a { color: var(--accent, #3b82f6); text-decoration: underline; cursor: pointer; }
        .ProseMirror-editor [contenteditable="false"] { cursor: default; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-tertiary, #aaa);
          pointer-events: none;
          height: 0;
        }
      `}</style>
      {/* Header row */}
      <motion.div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <ListMeta count={total} />
        {(noticeTab !== 'all' || statusFilter !== 'all') && (
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            ({[
              NOTICE_TABS.find((o) => o.key === noticeTab)?.label,
              statusFilter !== 'all' ? statusOptions.find((o) => o.key === statusFilter)?.label : null,
            ].filter(Boolean).join(' · ')})
          </span>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="search-wrap" style={{ width: '220px' }}>
            <Search strokeWidth={1.5} />
            <input
              className="glass-search"
              placeholder="搜索通知标题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <button
            className="btn primary"
            style={{ gap: '6px' }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} strokeWidth={2} /> 发布公告
          </button>
        </div>
      </motion.div>

      {/* Filter chips */}
      <motion.div
        style={{ marginBottom: '12px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.05 }}
      >
        <PageTabs tabs={NOTICE_TABS} active={noticeTab} onChange={setNoticeTab} />
        <div className="chip-row">
          {statusOptions.map((opt) => (
            <button key={String(opt.key)} className={`chip ${statusFilter === opt.key ? 'active' : ''}`} onClick={() => setStatusFilter(opt.key)}>
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
        <motion.div variants={fadeInList} initial="hidden" animate="visible">
          <LoadingBar visible={loading && notices.length > 0} />
          <div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>发布时间</th>
                  <th style={{ width: '240px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((notice) => (
                  <tr key={notice.id}>
                    <td>
                      {notice.isTop === 1 && (
                        <Pin size={13} strokeWidth={1.5} color="var(--warning)" style={{ transform: 'rotate(45deg)' }} />
                      )}
                    </td>
                    <td style={{ fontWeight: '600', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notice.noticeTitle}
                    </td>
                    <td>
                      <span className={`glass-badge ${notice.noticeType === 2 ? 'reviewing' : 'pending'}`} style={{ fontSize: '12px', padding: '2px 8px' }}>
                        {notice.noticeType === 1 ? '通知' : '公告'}
                      </span>
                    </td>
                    <td>
                      <span className={`glass-badge ${notice.status === 1 ? 'pass' : 'pending'}`} style={{ fontSize: '12px', padding: '2px 8px' }}>
                        {notice.status === 1 ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                      {formatDateTime(notice.publishTime || notice.createTime)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          onClick={() => handleEdit(notice)}>
                          <Pencil size={11} strokeWidth={1.5} /> 编辑
                        </button>
                        <button className="text-btn" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px', color: notice.isTop === 1 ? 'var(--warning)' : 'var(--text-tertiary)' }}
                          onClick={() => handleToggleTop(notice.id, notice.isTop)}>
                          <Pin size={11} strokeWidth={1.5} /> {notice.isTop === 1 ? '取消置顶' : '置顶'}
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
          </div>
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
              style={{ width: isMobile ? 'calc(100vw - 32px)' : '480px', padding: '16px', position: 'relative' }}
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

              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
                {editingId ? '编辑通知/公告' : '发布新通知/公告'}
              </div>

              {/* Type selector */}
              <div style={{ marginBottom: '12px' }}>
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
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>标题</div>
                <input
                  className="glass-input"
                  placeholder="请输入标题..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Content — rich text editor */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>内容</div>
                <RichTextEditor
                  key={editingId ?? 'new'}
                  content={newContent}
                  onChange={setNewContent}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn ghost" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button className="btn ghost" style={{ gap: '6px' }} onClick={() => handleSave(0)}>
                  <RotateCcw size={13} strokeWidth={2} /> 保存草稿
                </button>
                <button className="btn ghost" style={{ gap: '6px', color: 'var(--accent)' }} onClick={() => handleSave(1)}>
                  <Send size={13} strokeWidth={2} /> {editingId ? '更新发布' : '发布'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}
