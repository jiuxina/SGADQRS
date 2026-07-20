import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search } from 'lucide-react'
import { TableSkeleton } from '../components/PageSkeleton'
import DigitRoller from '../components/DigitRoller'
import { fadeInList, fadeSlideUp } from '../motion/variants'
import { logApi } from '../api'
import type { LogItem } from '../api/types'
import { useIsMobile } from '../hooks/useIsMobile'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import { toast } from '../components/toastUtils'

type FilterStatus = 'all' | 1 | 0

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 1, label: '成功' },
  { key: 0, label: '失败' },
]

const methodColorMap: Record<string, string> = {
  GET: '#007AFF', POST: '#34C759', PUT: '#FF9500', DELETE: '#FF3B30',
}

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE']

export default function AdminLogs() {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [logs, setLogs] = useState<LogItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const pagination = usePagination()

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const truncate = (str: string | null, max: number) => {
    if (!str) return '-'
    return str.length > max ? str.slice(0, max) + '...' : str
  }

  const fetchData = useCallback(async () => {
    const params: Record<string, unknown> = { current: pagination.current, size: pagination.pageSize }
    if (filter !== 'all') params.level = filter
    if (searchQuery) params.keyword = searchQuery
    if (startDate) params.startDate = startDate + ' 00:00:00'
    if (endDate) params.endDate = endDate + ' 23:59:59'
    if (methodFilter) params.method = methodFilter
    return logApi.list(params as Parameters<typeof logApi.list>[0])
  }, [filter, searchQuery, startDate, endDate, methodFilter, pagination.current, pagination.pageSize])

  useEffect(() => {
    fetchData().then(result => {
      setLogs(result.records)
      setTotal(result.total)
      pagination.setTotal(result.total)
    }).catch(err => {
      toast.error('加载日志失败')
      console.error('加载日志失败:', err)
    }).finally(() => setLoading(false))
  }, [fetchData])

  // 筛选条件变化时重置到第1页
  useEffect(() => { pagination.resetPage() }, [filter, searchQuery, startDate, endDate, methodFilter])

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

        <div style={{ padding: '0 18px 12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="glass-search" style={{ width: '160px', marginBottom: 0 }} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>~</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="glass-search" style={{ width: '160px', marginBottom: 0 }} />
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
            style={{
              height: '32px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
              cursor: 'pointer', minWidth: '100px',
            }}
          >
            <option value="">全部方法</option>
            {httpMethods.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
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
