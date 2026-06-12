import { useState } from 'react'
import { motion } from 'motion/react'
import { Search, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import DigitRoller from '../components/DigitRoller'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { mockUsers } from '../data/mockData'

type FilterType = 'all' | 'student' | 'teacher' | 'admin'

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'student', label: '学生' },
  { key: 'teacher', label: '教师' },
  { key: 'admin', label: '管理员' },
]

const roleLabelMap: Record<string, string> = {
  student: '学生',
  teacher: '教师',
  admin: '管理员',
}

export default function AdminUsers() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const studentCount = mockUsers.filter((u) => u.userType === 'student').length
  const teacherCount = mockUsers.filter((u) => u.userType === 'teacher').length

  const filtered = mockUsers.filter((u) => {
    const matchSearch =
      !searchQuery ||
      u.realName.includes(searchQuery) ||
      u.username.includes(searchQuery) ||
      u.deptName.includes(searchQuery)
    const matchFilter = filter === 'all' || u.userType === filter
    return matchSearch && matchFilter
  })

  return (
    <>
      {/* Top Metrics Row */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: '总用户数', value: mockUsers.length, footer: '系统注册用户' },
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

      {/* Filter + Search row */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <div
          style={{
            padding: '16px 18px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            用户列表
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {filtered.length}人
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

        {/* Filter chips */}
        <div style={{ padding: '0 18px 12px' }}>
          <div className="chip-row">
            {filterOptions.map((opt) => (
              <button key={opt.key} className={`chip ${filter === opt.key ? 'active' : ''}`} onClick={() => setFilter(opt.key)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
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
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {user.username}
                    </td>
                    <td style={{ fontWeight: '600' }}>{user.realName}</td>
                    <td>
                      <span
                        className={`glass-badge ${user.userType === 'admin' ? 'reviewing' : user.userType === 'teacher' ? 'pass' : 'pending'}`}
                        style={{ fontSize: '11px', padding: '2px 8px' }}
                      >
                        {roleLabelMap[user.userType]}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{user.deptName}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{user.phone}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{user.email}</td>
                    <td>
                      {user.status === 'active' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--success)' }}>
                          <span className="status-dot pass" />
                          正常
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--danger)' }}>
                          <span className="status-dot fail" />
                          已禁用
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{user.lastLogin}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn ghost"
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            gap: '3px',
                            color: user.status === 'active' ? 'var(--danger)' : 'var(--success)',
                          }}
                        >
                          {user.status === 'active' ? (
                            <ToggleRight size={13} strokeWidth={1.5} />
                          ) : (
                            <ToggleLeft size={13} strokeWidth={1.5} />
                          )}
                          {user.status === 'active' ? '禁用' : '启用'}
                        </button>
                        <button className="text-btn blue" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Pencil size={11} strokeWidth={1.5} /> 编辑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
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

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
