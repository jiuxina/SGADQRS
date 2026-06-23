import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Bell,
  Trophy,
  UserCheck,
  BarChart3,
  Settings,
  CheckCheck,
  ChevronRight,
} from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp, expandCollapse } from '../motion/variants'
import { messageApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { MessageItem } from '../api/types'
import { PAGE_SIZE } from '../config/constants'

type FilterKey = 'all' | 1 | 2 | 3 | 4

const filterLabels: Record<string, string> = {
  all: '全部',
  1: '系统通知',
  2: '竞赛通知',
  3: '报名通知',
  4: '成绩通知',
}

const typeIconMap: Record<number, typeof Bell> = {
  1: Settings,
  2: Trophy,
  3: UserCheck,
  4: BarChart3,
}

const typeColorBg: Record<number, string> = {
  1: 'rgba(142,142,147,0.08)',
  2: 'rgba(0,122,255,0.08)',
  3: 'rgba(52,199,89,0.08)',
  4: 'rgba(175,82,222,0.08)',
}

const typeColorFg: Record<number, string> = {
  1: 'var(--gray-1)',
  2: 'var(--accent)',
  3: 'var(--success)',
  4: '#AF52DE',
}

export default function StudentMessages() {
  const user = useAuthStore((s) => s.user)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const params: Record<string, unknown> = { current: 1, size: PAGE_SIZE.LARGE }
      if (filter !== 'all') params.messageType = filter
      const result = await messageApi.list(params as Parameters<typeof messageApi.list>[0])
      setMessages(result.records)
    } catch (err) {
      console.error('加载消息失败:', err)
    } finally {
      setLoading(false)
    }
  }, [user, filter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const unreadCount = messages.filter((m) => m.isRead === 0).length

  const markAllAsRead = async () => {
    try {
      await messageApi.markAllRead()
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: 1 })))
    } catch (err) {
      console.error('标记全部已读失败:', err)
    }
  }

  const handleToggleExpand = async (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
    const msg = messages.find((m) => m.id === id)
    if (msg && msg.isRead === 0) {
      try {
        await messageApi.markRead(id)
        setMessages((prev) => prev.map((m) => m.id === id ? { ...m, isRead: 1 } : m))
      } catch { /* ignore */ }
    }
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) {
      return timeStr.split(' ')[1] ?? timeStr
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    }
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  if (loading && messages.length === 0) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>
  }

  return (
    <>
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>消息中心</span>
          {unreadCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '20px', height: '20px', borderRadius: '10px', background: 'var(--danger)',
              color: '#fff', fontSize: '11px', fontWeight: '700', padding: '0 6px',
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="text-btn blue" style={{ fontSize: '13px' }} onClick={markAllAsRead}>
            <CheckCheck size={14} strokeWidth={1.5} style={{ marginRight: '3px', verticalAlign: '-2px' }} />
            全部已读
          </button>
        )}
      </motion.div>

      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }} style={{ marginBottom: '20px' }}>
        <div className="chip-row">
          {(Object.keys(filterLabels) as string[]).map((key) => (
            <button
              key={key}
              className={`chip ${filter === (key === 'all' ? 'all' : Number(key)) ? 'active' : ''}`}
              onClick={() => setFilter(key === 'all' ? 'all' : Number(key) as FilterKey)}
            >
              {filterLabels[key]}
              {key === 'all' && unreadCount > 0 && (
                <span style={{ marginLeft: '4px', fontSize: '11px', fontWeight: '700' }}>({unreadCount})</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={String(filter)}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {messages.map((notif, i) => {
              const IconComp = typeIconMap[notif.messageType] ?? Bell
              const isRead = notif.isRead === 1
              const isExpanded = expandedId === notif.id
              return (
                <motion.div key={notif.id} variants={staggerItem}>
                  <div
                    onClick={() => handleToggleExpand(notif.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '14px 18px', cursor: 'pointer',
                      borderBottom: i < messages.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      background: !isRead ? 'rgba(0,122,255,0.02)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (isRead) e.currentTarget.style.background = 'rgba(0,0,0,0.015)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = !isRead ? 'rgba(0,122,255,0.02)' : 'transparent' }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '10px',
                      background: typeColorBg[notif.messageType] ?? 'var(--gray-5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: '1px',
                    }}>
                      <IconComp size={16} strokeWidth={1.5} color={typeColorFg[notif.messageType] ?? 'var(--gray-1)'} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{
                          fontSize: '13px', fontWeight: !isRead ? '700' : '500',
                          color: 'var(--text-primary)', flex: 1, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {notif.messageTitle}
                        </span>
                        {!isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notif.messageContent}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                        {formatTime(notif.createTime)}
                      </span>
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                        <ChevronRight size={14} color="var(--gray-3)" />
                      </motion.div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        variants={expandCollapse}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 18px 14px 64px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                          {notif.messageContent}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>

        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            暂无消息
          </div>
        )}
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
