import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search } from 'lucide-react'
import { TableSkeleton } from '../components/PageSkeleton'
import DigitRoller from '../components/DigitRoller'
import { fadeInList, fadeSlideUp } from '../motion/variants'
import { logApi } from '../api'
import type { LogItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'
import { useIsMobile } from '../hooks/useIsMobile'

type FilterStatus = 'all' | 1 | 0

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 1, label: '成功' },
  { key: 0, label: '失败' },
]

const methodColorMap: Record<string, string> = {
  GET: '#007AFF', POST: '#34C759', PUT: '#FF9500', DELETE: '#FF3B30',
}

export default function AdminLogs() {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [logs, setLogs] = useState<LogItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const truncate = (str: string | null, max: number) => {
    if (!str) return '-'
    return str.length > max ? str.slice(0, max) + '...' : str
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current: 1, size: PAGE_SIZE.LARGE }
      if (filter !== 'all') params.status = filter
      if (searchQuery) params.username = searchQuery
      const result = await logApi.list(params as Parameters<typeof logApi.list>[0])
      setLogs(result.records)
      setTotal(result.total)
    } catch (err) {
      console.error('加载日志失败:', err)
    } finally {
      setLoading(false)
    }
  }, [filter, searchQuery])

  useEffect(() => { loadData() }, [loadData])

  const successCount = logs.filter((l) => l.status === 1).length
  const failCount = logs.filter((l) => l.status === 0).length

  if (loading && logs.length === 0) return <TableSkeleton />

  return (
    <>
      <motion.div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }} variants={fadeInList} initial="hidden" animate="visible">
        {[
          { label: '总日志数', value: total, footer: '系统操作记录' },
          { label: '成功操作', value: successCount, footer: '执行成功' },
          { label: '失败操作', value: failCount, footer: '执行失败' },
        ].map((item) => (
          <div key={item.label} className="metric-card" style={{ padding: '16px' }}>
            <div style={{ marginBottom: '10px' }}><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span></div>
            <div className="metric-card-value"><DigitRoller value={item.value} /></div>
            <div className="metric-card-footer">{item.footer}</div>
          </div>
        ))}
      </motion.div>

      <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            操作日志 <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>{total}条</span>
          </span>
          <div className="search-wrap" style={{ width: '220px' }}>
            <Search strokeWidth={1.5} />
            <input className="glass-search" placeholder="搜索用户 / 操作 / URL..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: 0 }} />
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
                  <th>时间</th><th>用户</th><th>操作</th><th style={{ width: '80px' }}>方法</th><th>URL</th><th>IP</th><th style={{ width: '80px' }}>耗时</th><th>请求参数</th><th>错误信息</th><th>状态</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const methodColor = methodColorMap[log.method || ''] || 'var(--text-secondary)'
                  const isExpanded = expandedId === log.id
                  return (
                    <AnimatePresence key={log.id} initial={false}>
                      <tr
                        onClick={() => toggleExpand(log.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ color: 'var(--text-tertiary)', fontSize: '12px', whiteSpace: 'nowrap' }}>{log.createTime}</td>
                        <td style={{ fontWeight: '500' }}>{log.username || '-'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{log.operation}</td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: methodColor, background: `${methodColor}14`, padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                            {log.method || '-'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'monospace', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.requestUrl || '-'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'monospace' }}>{log.ipAddress || '-'}</td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: (log.spendTime || 0) > 500 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                            {log.spendTime || 0}ms
                          </span>
                        </td>
                        <td
                          title={log.requestParams || '-'}
                          style={{ color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'monospace', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {truncate(log.requestParams, 50)}
                        </td>
                        <td style={{ color: log.status === 0 ? 'var(--danger)' : 'var(--text-tertiary)', fontSize: '11px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.status === 0 ? (log.errorMsg || '-') : '-'}
                        </td>
                        <td>
                          <span className={`glass-badge ${log.status === 1 ? 'pass' : 'fail'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                            {log.status === 1 ? '成功' : '失败'}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} style={{ padding: 0, border: 'none' }}>
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            >
                              <div className="glass-card glass-card-static" style={{ margin: '4px 0 12px', padding: '16px 20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px 24px', fontSize: '13px' }}>
                                  <div>
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>请求参数</span>
                                    <div style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)', wordBreak: 'break-all', whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'auto' }}>
                                      {log.requestParams || '-'}
                                    </div>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>错误信息</span>
                                    <div style={{ marginTop: '4px', fontSize: '12px', color: log.status === 0 ? 'var(--danger)' : 'var(--text-secondary)', wordBreak: 'break-all', whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'auto' }}>
                                      {log.errorMsg || '-'}
                                    </div>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>请求URL</span>
                                    <div style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                                      {log.requestUrl || '-'}
                                    </div>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>IP地址</span>
                                    <div style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                      {log.ipAddress || '-'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  )
                })}
                {logs.length === 0 && !loading && (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>未找到匹配的日志</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>

    </>
  )
}
