import { useState } from 'react'
import { motion } from 'motion/react'
import { Search } from 'lucide-react'
import DigitRoller from '../components/DigitRoller'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { mockLogs } from '../data/mockData'

type FilterStatus = 'all' | 'success' | 'fail'

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'success', label: '成功' },
  { key: 'fail', label: '失败' },
]

const methodColorMap: Record<string, string> = {
  GET: '#007AFF',
  POST: '#34C759',
  PUT: '#FF9500',
  DELETE: '#FF3B30',
}

export default function AdminLogs() {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const successCount = mockLogs.filter((l) => l.status === 'success').length
  const failCount = mockLogs.filter((l) => l.status === 'fail').length

  const filtered = mockLogs.filter((log) => {
    const matchSearch =
      !searchQuery ||
      log.username.includes(searchQuery) ||
      log.operation.includes(searchQuery) ||
      log.requestUrl.includes(searchQuery)
    const matchFilter = filter === 'all' || log.status === filter
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
          { label: '总日志数', value: mockLogs.length, footer: '系统操作记录' },
          { label: '成功操作', value: successCount, footer: '执行成功' },
          { label: '失败操作', value: failCount, footer: '执行失败' },
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

      {/* Table container */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        {/* Table header with search and filter */}
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
            操作日志
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {filtered.length}条
            </span>
          </span>
          <div className="search-wrap" style={{ width: '220px' }}>
            <Search strokeWidth={1.5} />
            <input
              className="glass-search"
              placeholder="搜索用户 / 操作 / URL..."
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
                  <th>时间</th>
                  <th>用户</th>
                  <th>操作</th>
                  <th style={{ width: '80px' }}>方法</th>
                  <th>URL</th>
                  <th>IP</th>
                  <th style={{ width: '80px' }}>耗时</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const methodColor = methodColorMap[log.method] || 'var(--text-secondary)'
                  return (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {log.time}
                      </td>
                      <td style={{ fontWeight: '500' }}>{log.username}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{log.operation}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: methodColor,
                            background: `${methodColor}14`,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {log.method}
                        </span>
                      </td>
                      <td
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          maxWidth: '180px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.requestUrl}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'monospace' }}>
                        {log.ipAddress}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: log.spendTime > 500 ? 'var(--warning)' : log.spendTime > 1000 ? 'var(--danger)' : 'var(--text-secondary)',
                          }}
                        >
                          {log.spendTime}ms
                        </span>
                      </td>
                      <td>
                        <span
                          className={`glass-badge ${log.status === 'success' ? 'pass' : 'fail'}`}
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                          {log.status === 'success' ? '成功' : '失败'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      未找到匹配的日志
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
