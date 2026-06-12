import { useState } from 'react'
import { motion } from 'motion/react'
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import DigitRoller from '../components/DigitRoller'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { mockRegistrations } from '../data/mockData'

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected'

const filterLabels: Record<FilterKey, string> = {
  all: '全部',
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
}

const statusStyle: Record<string, { badge: string; label: string }> = {
  pending: { badge: 'pending', label: '待审核' },
  approved: { badge: 'pass', label: '已通过' },
  rejected: { badge: 'fail', label: '已拒绝' },
}

export default function StudentRegistration() {
  const [filter, setFilter] = useState<FilterKey>('all')

  const stats = {
    total: mockRegistrations.length,
    approved: mockRegistrations.filter((r) => r.status === 'approved').length,
    pending: mockRegistrations.filter((r) => r.status === 'pending').length,
    rejected: mockRegistrations.filter((r) => r.status === 'rejected').length,
  }

  const filtered = mockRegistrations.filter((r) => {
    if (filter === 'all') return true
    return r.status === filter
  })

  return (
    <>
      {/* Summary stats row */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm blue">
              <FileText strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>总报名数</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.total} />
          </div>
        </motion.div>

        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm green">
              <CheckCircle strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已通过</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.approved} />
          </div>
        </motion.div>

        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm amber">
              <Clock strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>待审核</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.pending} />
          </div>
        </motion.div>

        <motion.div className="metric-card" variants={staggerItem} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div className="icon-box sm red">
              <XCircle strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已拒绝</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            <DigitRoller value={stats.rejected} />
          </div>
        </motion.div>
      </motion.div>

      {/* Table section */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0', marginTop: '24px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        {/* Table header */}
        <div
          style={{
            padding: '16px 18px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            报名记录
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {filtered.length}条
            </span>
          </span>
        </div>

        {/* Filter chips */}
        <div style={{ padding: '0 18px 12px' }}>
          <div className="chip-row">
            {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
              <button
                key={key}
                className={`chip ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {filterLabels[key]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th>竞赛名称</th>
              <th>队伍名称</th>
              <th>是否队长</th>
              <th>报名时间</th>
              <th>状态</th>
              <th style={{ width: '140px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((reg) => {
              const st = statusStyle[reg.status]
              return (
                <tr key={reg.id}>
                  <td style={{ fontWeight: '600', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {reg.competitionName}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {reg.teamName ?? <span style={{ color: 'var(--text-tertiary)' }}>--</span>}
                  </td>
                  <td>
                    {reg.isTeamLeader ? (
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>队长</span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>队员</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{reg.registrationTime}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className={`status-dot ${st.badge === 'pass' ? 'pass' : st.badge === 'fail' ? 'fail' : 'pending'}`} />
                      <span className={`glass-badge ${st.badge}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {st.label}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button className="text-btn blue" style={{ fontSize: '12px' }}>
                        查看详情
                      </button>
                      {reg.status === 'pending' && (
                        <button className="text-btn danger" style={{ fontSize: '12px' }}>
                          取消报名
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '50px 20px',
              color: 'var(--text-tertiary)',
              fontSize: '14px',
            }}
          >
            暂无报名记录
          </div>
        )}
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
