import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { Search } from 'lucide-react'
import { TableSkeleton } from '../components/PageSkeleton'
import DigitRoller from '../components/DigitRoller'
import { fadeInList, fadeSlideUp } from '../motion/variants'
import GlassModal from '../components/GlassModal'
import { userApi, deptApi, fileApi } from '../api'
import type { UserItem, DeptItem, MajorItem, ClassItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { toast } from '../components/Toast'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatDate } from '../utils/format'

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
  const [editForm, setEditForm] = useState({ realName: '', deptId: '', gender: '0', majorId: '', classId: '', avatar: '' })
  const [depts, setDepts] = useState<DeptItem[]>([])
  const [majors, setMajors] = useState<MajorItem[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const isMobile = useIsMobile()

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

  useEffect(() => {
    if (editForm.deptId) {
      deptApi.majors(Number(editForm.deptId)).then(setMajors).catch(() => setMajors([]))
    } else {
      setMajors([])
    }
  }, [editForm.deptId])

  useEffect(() => {
    if (editForm.majorId) {
      deptApi.classes(Number(editForm.majorId)).then(setClasses).catch(() => setClasses([]))
    } else {
      setClasses([])
    }
  }, [editForm.majorId])

  const openEditModal = (user: UserItem) => {
    setEditingUser(user)
    setEditForm({
      realName: user.realName || '',
      deptId: user.deptId != null ? String(user.deptId) : '',
      gender: String(user.gender ?? 0),
      majorId: user.majorId != null ? String(user.majorId) : '',
      classId: user.classId != null ? String(user.classId) : '',
      avatar: user.avatar || '',
    })
  }

  const handleSave = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      await userApi.update({
        id: editingUser.id,
        realName: editForm.realName,
        deptId: editForm.deptId ? Number(editForm.deptId) : null,
        gender: Number(editForm.gender),
        majorId: editForm.majorId ? Number(editForm.majorId) : null,
        classId: editForm.classId ? Number(editForm.classId) : null,
        avatar: editForm.avatar || null,
      })
      setEditingUser(null)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await fileApi.upload(file)
      setEditForm((f) => ({ ...f, avatar: url }))
    } catch {
      toast.error('头像上传失败')
    } finally {
      setUploading(false)
    }
  }

  const studentCount = users.filter((u) => u.userType === 1).length
  const teacherCount = users.filter((u) => u.userType === 2).length

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
          { label: '总用户数', value: total, footer: '系统注册用户' },
          { label: '学生数', value: studentCount, footer: '在校学生账号' },
          { label: '教师数', value: teacherCount, footer: '教师账号' },
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

        <motion.div variants={fadeInList} initial="hidden" animate="visible">
          <div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>真实姓名</th>
                  <th>角色</th>
                  <th>所属院系</th>
                  <th>性别</th>
                  <th>专业</th>
                  <th>班级</th>
                  <th>最后登录</th>
                  <th style={{ width: '80px' }}>操作</th>
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
                    <td style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{formatDate((user as unknown as Record<string, unknown>).lastLoginTime as string ?? null)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="text-btn blue" style={{ fontSize: '12px' }}
                          onClick={() => openEditModal(user)}>
                          编辑
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
          </div>
        </motion.div>
      </motion.div>

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
                  <select
                    className="glass-input"
                    value={editForm.deptId}
                    onChange={(e) => setEditForm((f) => ({ ...f, deptId: e.target.value, majorId: '', classId: '' }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="">未分配</option>
                    {depts.map((d) => (
                      <option key={d.id} value={d.id}>{d.deptName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>专业</label>
                  <select
                    className="glass-input"
                    value={editForm.majorId}
                    onChange={(e) => setEditForm((f) => ({ ...f, majorId: e.target.value, classId: '' }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    disabled={!editForm.deptId}
                  >
                    <option value="">{editForm.deptId ? '未选择' : '请先选择院系'}</option>
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>{m.majorName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>班级</label>
                  <select
                    className="glass-input"
                    value={editForm.classId}
                    onChange={(e) => setEditForm((f) => ({ ...f, classId: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    disabled={!editForm.majorId}
                  >
                    <option value="">{editForm.majorId ? '未选择' : '请先选择专业'}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.className}</option>
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
      </GlassModal>

    </>
  )
}
