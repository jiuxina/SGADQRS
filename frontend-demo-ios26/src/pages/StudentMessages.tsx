import { useState } from 'react'
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
import { mockNotifications, type Notification } from '../data/mockData'

type FilterKey = 'all' | 'system' | 'competition' | 'registration' | 'result'

const filterLabels: Record<FilterKey, string> = {
  all: '全部',
  system: '系统通知',
  competition: '竞赛通知',
  registration: '报名通知',
  result: '成绩通知',
}

const typeIcon: Record<string, typeof Bell> = {
  system: Settings,
  competition: Trophy,
  registration: UserCheck,
  result: BarChart3,
}

const typeColorBg: Record<string, string> = {
  system: 'rgba(142,142,147,0.08)',
  competition: 'rgba(0,122,255,0.08)',
  registration: 'rgba(52,199,89,0.08)',
  result: 'rgba(175,82,222,0.08)',
}

const typeColorFg: Record<string, string> = {
  system: 'var(--gray-1)',
  competition: 'var(--accent)',
  registration: 'var(--success)',
  result: '#AF52DE',
}

export default function StudentMessages() {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(mockNotifications.filter((n) => n.isRead).map((n) => n.id))
  )

  const filtered = mockNotifications.filter((n) => {
    if (filter === 'all') return true
    return n.type === filter
  })

  const unreadCount = mockNotifications.filter((n) => !readIds.has(n.id)).length

  const markAllAsRead = () => {
    setReadIds(new Set(mockNotifications.map((n) => n.id)))
  }

  const toggleRead = (notif: Notification) => {
    if (!readIds.has(notif.id)) {
      setReadIds((prev) => new Set([...prev, notif.id]))
    }
  }

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
    const notif = mockNotifications.find((n) => n.id === id)
    if (notif) toggleRead(notif)
  }

  const formatTime = (timeStr: string) => {
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

  return (
    <>
      {/* Header with unread count and mark all button */}
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
            消息中心
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                height: '20px',
                borderRadius: '10px',
                background: 'var(--danger)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '700',
                padding: '0 6px',
              }}
            >
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

      {/* Filter chips */}
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }} style={{ marginBottom: '20px' }}>
        <div className="chip-row">
          {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
            <button
              key={key}
              className={`chip ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {filterLabels[key]}
              {key === 'all' && unreadCount > 0 && (
                <span style={{ marginLeft: '4px', fontSize: '11px', fontWeight: '700' }}>
                  ({unreadCount})
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Messages list */}
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
            key={filter}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {filtered.map((notif, i) => {
              const IconComp = typeIcon[notif.type] ?? Bell
              const isRead = readIds.has(notif.id)
              const isExpanded = expandedId === notif.id
              return (
                <motion.div key={notif.id} variants={staggerItem}>
                  <div
                    onClick={() => handleToggleExpand(notif.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px 18px',
                      cursor: 'pointer',
                      borderBottom:
                        i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      background: !isRead ? 'rgba(0,122,255,0.02)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (isRead) e.currentTarget.style.background = 'rgba(0,0,0,0.015)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = !isRead ? 'rgba(0,122,255,0.02)' : 'transparent'
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '10px',
                        background: typeColorBg[notif.type] ?? 'var(--gray-5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      <IconComp size={16} strokeWidth={1.5} color={typeColorFg[notif.type] ?? 'var(--gray-1)'} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: !isRead ? '700' : '500',
                            color: 'var(--text-primary)',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {notif.title}
                        </span>
                        {!isRead && (
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: 'var(--accent)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notif.content}
                      </div>
                    </div>

                    {/* Time + chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                        {formatTime(notif.time)}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      >
                        <ChevronRight size={14} color="var(--gray-3)" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        variants={expandCollapse}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        style={{ overflow: 'hidden' }}
                      >
                        <div
                          style={{
                            padding: '0 18px 14px 64px',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                          }}
                        >
                          {notif.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-tertiary)',
              fontSize: '14px',
            }}
          >
            暂无消息
          </div>
        )}
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
