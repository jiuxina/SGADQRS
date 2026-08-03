import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Plus, Download, Trash2, Ban } from 'lucide-react'
import { TableSkeleton, LoadingBar } from '../components/PageSkeleton'
import DigitRoller from '../components/DigitRoller'
import { fadeInList, fadeSlideUp } from '../motion/variants'
import GlassModal from '../components/GlassModal'
import { userApi, fileApi, exportApi } from '../api'
import type { UserItem, UserStats } from '../api/types'
import { toast } from '../components/toastUtils'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatDate } from '../utils/format'
import { confirmDialog } from '../components/confirmDialogUtils'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'

type FilterType = 'all' | 1 | 2 | 3

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 1, label: '学生' },
  { key: 2, label: '教师' },
  { key: 3, label: '管理员' },
]

const roleLabelMap: Record<number, string> = { 1: '学生', 2: '教师', 3: '管理员' }

interface CreateForm {
  username: string
  password: string
  realName: string
  userType: number
  deptName: string
  majorName: string
  className: string
  gender: string
}

const defaultCreateForm: CreateForm = {
  username: '',
  password: '',
  realName: '',
  userType: 1,
  deptName: '',
  majorName: '',
  className: '',
  gender: '0',
}

export default function AdminUsers() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pagination = usePagination()
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [editForm, setEditForm] = useState({ realName: '', deptName: '', gender: '0', majorName: '', className: '', avatar: '', userType: 1 })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const isMobile = useIsMobile()

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(defaultCreateForm)
  const [creating, setCreating] = useState(false)
  const [stats, setStats] = useState<UserStats>({ totalCount: 0, studentCount: 0, teacherCount: 0, adminCount: 0 })

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const isAllSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id))
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Clear selection when data changes
  useEffect(() => { setSelectedIds(new Set()) }, [users])

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const confirmed = await confirmDialog({ message: `确定要删除选中的 ${ids.length} 个用户吗？此操作不可撤销。`, variant: 'danger' })
    if (!confirmed) return
    try {
      await userApi.batchDelete(ids)
      setSelectedIds(new Set())
      loadData()
      toast.success(`成功删除 ${ids.length} 个用户`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '批量删除失败')
    }
  }

  const handleBatchDisable = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const confirmed = await confirmDialog({ message: `确定要禁用选中的 ${ids.length} 个用户吗？`, variant: 'warning' })
    if (!confirmed) return
    try {
      await userApi.batchDisable(ids)
      setSelectedIds(new Set())
      loadData()
      toast.success(`成功禁用 ${ids.length} 个用户`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '批量禁用失败')
    }
  }

  const fetchData = useCallback(async () => {
    const params: Record<string, unknown> = { current: pagination.current, size: pagination.pageSize }
    if (filter !== 'all') params.userType = filter
    if (debouncedSearch) params.keyword = debouncedSearch
    return userApi.list(params as Parameters<typeof userApi.list>[0])
  }, [filter, debouncedSearch, pagination.current, pagination.pageSize])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchData()
      setUsers(result.records)
      setTotal(result.total)
      pagination.setTotal(result.total)
    } catch (err) {
      toast.error('加载用户数据失败')
      console.error('加载用户数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchData])

  useEffect(() => {
    fetchData().then(result => {
      setUsers(result.records)
      setTotal(result.total)
      pagination.setTotal(result.total)
    }).catch(err => {
      toast.error('加载用户数据失败')
      console.error('加载用户数据失败:', err)
    }).finally(() => setLoading(false))
  }, [fetchData])

  // 筛选条件变化时重置到第1页
  useEffect(() => { pagination.resetPage() }, [filter, debouncedSearch])

  // 获取全系统用户统计
  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await userApi.stats()
        setStats(result)
      } catch (err) {
        console.error('加载用户统计失败:', err)
        toast.error('加载用户统计失败，请刷新页面重试')
        // 设置默认值，避免页面显示异常
        setStats({ totalCount: 0, studentCount: 0, teacherCount: 0, adminCount: 0 })
      }
    }
    loadStats()
  }, [])

  const openEditModal = (user: UserItem) => {
    setEditingUser(user)
    setEditForm({
      realName: user.realName || '',
      deptName: user.deptName || '',
      gender: String(user.gender ?? 0),
      majorName: user.majorName || '',
      className: user.className || '',
      avatar: user.avatar || '',
      userType: user.userType,
    })
  }

  const handleSave = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      await userApi.update({
        id: editingUser.id,
        realName: editForm.realName,
        deptName: editForm.deptName,
        gender: Number(editForm.gender),
        majorName: editForm.majorName,
        className: editForm.className,
        avatar: editForm.avatar || null,
        userType: editForm.userType,
      })
      setEditingUser(null)
      loadData()
      toast.success('保存成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!createForm.username.trim()) {
      toast.error('请输入用户名')
      return
    }
    if (!createForm.password.trim()) {
      toast.error('请输入密码')
      return
    }
    if (!createForm.realName.trim()) {
      toast.error('请输入真实姓名')
      return
    }
    setCreating(true)
    try {
      await userApi.create({
        username: createForm.username,
        password: createForm.password,
        realName: createForm.realName,
        userType: createForm.userType,
        gender: Number(createForm.gender),
        deptName: createForm.deptName,
        majorName: createForm.majorName,
        className: createForm.className,
      })
      setShowCreateModal(false)
      setCreateForm(defaultCreateForm)
      loadData()
      toast.success('创建成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (user: UserItem) => {
    const deleteConfirmed = await confirmDialog({ message: `确定要删除用户 "${user.realName}" 吗？此操作不可撤销。`, variant: 'danger' })
    if (!deleteConfirmed) return
    try {
      await userApi.delete(user.id)
      loadData()
      toast.success('删除成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleToggleStatus = async (user: UserItem) => {
    const newStatus = user.status === 1 ? 0 : 1
    const action = newStatus === 1 ? '启用' : '禁用'
    const toggleConfirmed = await confirmDialog({ message: `确定要${action}用户 "${user.realName}" 吗？`, variant: 'warning' })
    if (!toggleConfirmed) return
    try {
      await userApi.toggleStatus(user.id, newStatus)
      loadData()
      toast.success(`${action}成功`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${action}失败`)
    }
  }

  const handleResetPassword = async (user: UserItem) => {
    const resetConfirmed = await confirmDialog({ message: `确定要重置用户 "${user.realName}" 的密码吗？`, variant: 'warning' })
    if (!resetConfirmed) return
    try {
      await userApi.resetPassword(user.id)
      toast.success('密码重置成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '重置失败')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await fileApi.upload(file)
      setEditForm((f) => ({ ...f, avatar: result.url }))
    } catch (e) {
      console.error('更新用户状态失败:', e)
      toast.error('头像上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params: { userType?: number; keyword?: string } = {}
      if (filter !== 'all') params.userType = filter as number
      if (debouncedSearch) params.keyword = debouncedSearch
      await exportApi.users(params)
      toast.success('导出成功')
    } catch (e) {
      console.error('删除用户失败:', e)
      toast.error('导出失败')
    }
  }

  if (loading && users.length === 0) {
    return <TableSkeleton />
  }

  return (
    <>
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}
        variants={fadeInList}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: '总用户数', value: stats.totalCount, footer: '系统注册用户' },
          { label: '学生数', value: stats.studentCount, footer: '在校学生账号' },
          { label: '教师数', value: stats.teacherCount, footer: '教师账号' },
        ].map((item) => (
          <div key={item.label} className="metric-card" style={{ padding: '16px' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
            <div className="metric-card-value">
              <DigitRoller value={item.value} />
            </div>
            <div className="metric-card-footer">{item.footer}</div>
          </div>
        ))}
      </motion.div>

      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            用户列表
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {total}人
            </span>
          </span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="search-wrap" style={{ width: '220px' }}>
              <Search strokeWidth={1.5} />
              <input
                className="glass-search"
                placeholder="搜索姓名 / 用户名 / 院系..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <button
              className="btn ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
              onClick={handleExport}
            >
              <Download size={14} strokeWidth={1.5} />
              导出
            </button>
            <button
              className="btn primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={14} strokeWidth={2} />
              新增用户
            </button>
          </div>
        </div>

        <div style={{ padding: '0 18px 12px' }}>
          <div className="chip-row">
            {filterOptions.map((opt) => (
              <button key={String(opt.key)} className={`chip ${filter === opt.key ? 'active' : ''}`} onClick={() => setFilter(opt.key)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border)', background: 'rgba(0,122,255,0.06)' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>
                  已选择 {selectedIds.size} 项
                </span>
                <button
                  className="text-btn orange"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleBatchDisable}
                >
                  <Ban size={12} strokeWidth={1.5} /> 批量禁用
                </button>
                <button
                  className="text-btn red"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleBatchDelete}
                >
                  <Trash2 size={12} strokeWidth={1.5} /> 批量删除
                </button>
                <button
                  className="text-btn blue"
                  style={{ fontSize: '12px', marginLeft: 'auto' }}
                  onClick={() => setSelectedIds(new Set())}
                >
                  取消选择
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={fadeInList} initial="hidden" animate="visible">
          <LoadingBar visible={loading && users.length > 0} />
          <div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => { if (el) el.indeterminate = isIndeterminate }}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>用户名</th>
                  <th>真实姓名</th>
                  <th>角色</th>
                  <th>所属院系</th>
                  <th>性别</th>
                  <th>专业</th>
                  <th>班级</th>
                  <th>状态</th>
                  <th>最后登录</th>
                  <th style={{ width: '140px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ opacity: user.status === 0 ? 0.6 : 1 }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                      />
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {user.username}
                    </td>
                    <td style={{ fontWeight: '600' }}>{user.realName}</td>
                    <td>
                      <span
                        className={`glass-badge ${user.userType === 3 ? 'reviewing' : user.userType === 2 ? 'pass' : 'pending'}`}
                        style={{ fontSize: '11px', padding: '2px 8px' }}
                      >
                        {roleLabelMap[user.userType]}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{user.deptName || '-'}</td>
                    <td>
                      <span
                        className={`glass-badge ${user.gender === 1 ? 'pass' : user.gender === 2 ? 'pending' : ''}`}
                        style={{ fontSize: '11px', padding: '2px 8px' }}
                      >
                        {user.gender === 1 ? '男' : user.gender === 2 ? '女' : '-'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{user.majorName || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{user.className || '-'}</td>
                    <td>
                      <span
                        className={`glass-badge ${user.status === 1 ? 'pass' : 'reviewing'}`}
                        style={{ fontSize: '11px', padding: '2px 8px' }}
                      >
                        {user.status === 1 ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{formatDate((user as unknown as Record<string, unknown>).lastLoginTime as string ?? null)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <button className="text-btn blue" style={{ fontSize: '12px' }}
                          onClick={() => openEditModal(user)}>
                          编辑
                        </button>
                        <button
                          className={`text-btn ${user.status === 1 ? 'orange' : 'green'}`}
                          style={{ fontSize: '12px' }}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.status === 1 ? '禁用' : '启用'}
                        </button>
                        <button className="text-btn red" style={{ fontSize: '12px' }}
                          onClick={() => handleDelete(user)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      未找到匹配的用户
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

      {/* Create User Modal */}
      <GlassModal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="新增用户">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              用户名 <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              className="glass-input"
              value={createForm.username}
              onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="请输入用户名"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              密码 <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              className="glass-input"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="请输入密码"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              真实姓名 <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              className="glass-input"
              value={createForm.realName}
              onChange={(e) => setCreateForm((f) => ({ ...f, realName: e.target.value }))}
              placeholder="请输入真实姓名"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>角色</label>
            <select
              className="glass-input"
              value={createForm.userType}
              onChange={(e) => setCreateForm((f) => ({ ...f, userType: Number(e.target.value) }))}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value={1}>学生</option>
              <option value={2}>教师</option>
              <option value={3}>管理员</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>性别</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[{ value: '1', label: '男' }, { value: '2', label: '女' }, { value: '0', label: '未知' }].map((opt) => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <input
                    type="radio"
                    name="createGender"
                    value={opt.value}
                    checked={createForm.gender === opt.value}
                    onChange={(e) => setCreateForm((f) => ({ ...f, gender: e.target.value }))}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>所属院系</label>
            <input
              className="glass-input"
              type="text"
              value={createForm.deptName}
              onChange={(e) => setCreateForm((f) => ({ ...f, deptName: e.target.value }))}
              placeholder="请输入院系名称"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>专业</label>
            <input
              className="glass-input"
              type="text"
              value={createForm.majorName}
              onChange={(e) => setCreateForm((f) => ({ ...f, majorName: e.target.value }))}
              placeholder="请输入专业名称"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>班级</label>
            <input
              className="glass-input"
              type="text"
              value={createForm.className}
              onChange={(e) => setCreateForm((f) => ({ ...f, className: e.target.value }))}
              placeholder="请输入班级名称"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn ghost" onClick={() => setShowCreateModal(false)}>取消</button>
          <button className="btn ghost" onClick={handleCreate} disabled={creating} style={{ color: 'var(--accent)' }}>
            {creating ? '创建中...' : '创建'}
          </button>
        </div>
      </GlassModal>

      {/* Edit Modal */}
      <GlassModal open={!!editingUser} onClose={() => setEditingUser(null)} title="编辑用户">

              <div style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                  {editingUser?.username}
                </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>真实姓名</label>
                  <input
                    className="glass-input"
                    value={editForm.realName}
                    onChange={(e) => setEditForm((f) => ({ ...f, realName: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>角色</label>
                  <select
                    className="glass-input"
                    value={editForm.userType}
                    onChange={(e) => setEditForm((f) => ({ ...f, userType: Number(e.target.value) }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value={1}>学生</option>
                    <option value={2}>教师</option>
                    <option value={3}>管理员</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>性别</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {[{ value: '1', label: '男' }, { value: '2', label: '女' }, { value: '0', label: '未知' }].map((opt) => (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
                        <input
                          type="radio"
                          name="gender"
                          value={opt.value}
                          checked={editForm.gender === opt.value}
                          onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>头像</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {editForm.avatar && (
                      <img
                        src={editForm.avatar}
                        alt="头像预览"
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                      />
                    )}
                    <label className="btn primary" style={{ cursor: 'pointer', fontSize: '12px', margin: 0 }}>
                      {uploading ? '上传中...' : '上传头像'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{ display: 'none' }}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>所属院系</label>
                  <input
                    className="glass-input"
                    type="text"
                    value={editForm.deptName}
                    onChange={(e) => setEditForm((f) => ({ ...f, deptName: e.target.value }))}
                    placeholder="请输入院系名称"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>专业</label>
                  <input
                    className="glass-input"
                    type="text"
                    value={editForm.majorName}
                    onChange={(e) => setEditForm((f) => ({ ...f, majorName: e.target.value }))}
                    placeholder="请输入专业名称"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>班级</label>
                  <input
                    className="glass-input"
                    type="text"
                    value={editForm.className}
                    onChange={(e) => setEditForm((f) => ({ ...f, className: e.target.value }))}
                    placeholder="请输入班级名称"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                {editingUser && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                    <button
                      className="btn ghost"
                      style={{ fontSize: '12px', color: 'var(--warning)' }}
                      onClick={() => handleResetPassword(editingUser)}
                    >
                      重置密码
                    </button>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                      密码将被重置为默认密码
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn ghost" onClick={() => setEditingUser(null)}>取消</button>
                <button className="btn ghost" onClick={handleSave} disabled={saving} style={{ color: 'var(--accent)' }}>
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
      </GlassModal>

    </>
  )
}
