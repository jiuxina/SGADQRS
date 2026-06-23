import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, ToggleLeft, ToggleRight, Pencil, X } from 'lucide-react'
import DigitRoller from '../components/DigitRoller'
import { staggerContainer, staggerItem, fadeSlideUp, panelSlideIn } from '../motion/variants'
import { userApi, deptApi } from '../api'
import type { UserItem, DeptItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/Toast'

type FilterType = 'all' | 1 | 2 | 3

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 1, label: '学生' },
  { key: 2, label: '教师' },
  { key: 3, label: '管理员' },
]

const roleLabelMap: Record<number, string> = { 1: '学生', 2: '教师', 3: '管理员' }

export default function AdminUsers() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [editForm, setEditForm] = useState({ realName: '', phone: '', email: '', deptId: '' })
  const [depts, setDepts] = useState<DeptItem[]>([])
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current: 1, size: PAGE_SIZE.LARGE }
      if (filter !== 'all') params.userType = filter
      if (searchQuery) params.keyword = searchQuery
      const result = await userApi.list(params as Parameters<typeof userApi.list>[0])
      setUsers(result.records)
      setTotal(result.total)
    } catch (err) {
      console.error('加载用户数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [filter, searchQuery])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    deptApi.list().then(setDepts).catch(() => {})
  }, [])

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    try {
      await userApi.updateStatus(id, currentStatus === 1 ? 0 : 1)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const openEditModal = (user: UserItem) => {
    setEditingUser(user)
    setEditForm({
      realName: user.realName || '',
      phone: user.phone || '',
      email: user.email || '',
      deptId: user.deptId != null ? String(user.deptId) : '',
    })
  }

  const handleSave = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      await userApi.update({
        id: editingUser.id,
        realName: editForm.realName,
        phone: editForm.phone || null,
        email: editForm.email || null,
        deptId: editForm.deptId ? Number(editForm.deptId) : null,
      })
      setEditingUser(null)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const studentCount = users.filter((u) => u.userType === 1).length
  const teacherCount = users.filter((u) => u.userType === 2).length

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  if (loading && users.length === 0) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>
  }

  return (
    <>
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: '总用户数', value: total, footer: '系统注册用户' },
          { label: '学生数', value: studentCount, footer: '在校学生账号' },
          { label: '教师数', value: teacherCount, footer: '教师账号' },
        ].map((item) => (
          <motion.div key={item.label} className="metric-card" style={{ padding: '16px' }} variants={staggerItem}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
            <div className="metric-card-value">
              <DigitRoller value={item.value} />
            </div>
            <div className="metric-card-footer">{item.footer}</div>
          </motion.div>
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

        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={staggerItem}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>真实姓名</th>
                  <th>角色</th>
                  <th>所属院系</th>
                  <th>手机号</th>
                  <th>邮箱</th>
                  <th>状态</th>
                  <th>最后登录</th>
                  <th style={{ width: '140px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
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
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{user.phone || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{user.email || '-'}</td>
                    <td>
                      {user.status === 1 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--success)' }}>
                          <span className="status-dot pass" />正常
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--danger)' }}>
                          <span className="status-dot fail" />已禁用
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{formatDate(user.lastLoginTime ?? null)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn ghost"
                          style={{
                            padding: '4px 8px', fontSize: '12px', gap: '3px',
                            color: user.status === 1 ? 'var(--danger)' : 'var(--success)',
                          }}
                          onClick={() => handleToggleStatus(user.id, user.status)}
                        >
                          {user.status === 1 ? <ToggleRight size={13} strokeWidth={1.5} /> : <ToggleLeft size={13} strokeWidth={1.5} />}
                          {user.status === 1 ? '禁用' : '启用'}
                        </button>
                        <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          onClick={() => openEditModal(user)}>
                          <Pencil size={11} strokeWidth={1.5} /> 编辑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      未找到匹配的用户
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              className="glass-card glass-card-vertical glass-card-static"
              style={{ width: '440px', padding: '24px', position: 'relative' }}
              variants={panelSlideIn}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setEditingUser(null)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>

              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                编辑用户
                <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                  {editingUser.username}
                </span>
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
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>手机号</label>
                  <input
                    className="glass-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="请输入手机号"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>邮箱</label>
                  <input
                    className="glass-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="请输入邮箱"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>所属院系</label>
                  <select
                    className="glass-input"
                    value={editForm.deptId}
                    onChange={(e) => setEditForm((f) => ({ ...f, deptId: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="">未分配</option>
                    {depts.map((d) => (
                      <option key={d.id} value={d.id}>{d.deptName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn ghost" onClick={() => setEditingUser(null)}>取消</button>
                <button className="btn primary" onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '保存'}
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
