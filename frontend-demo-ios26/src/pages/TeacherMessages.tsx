import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Bell,
  Trophy,
  UserCheck,
  BarChart3,
  Settings,
  CheckCheck,
  ChevronDown,
} from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp, expandCollapse } from '../motion/variants'
import { mockNotifications, type Notification } from '../data/mockData'

type FilterType = 'all' | Notification['type']

const filterLabels: Record<FilterType, string> = {
  all: '全部',
  system: '系统通知',
  competition: '竞赛通知',
  registration: '报名通知',
  result: '成绩通知',
}

const typeIcons: Record<Notification['type'], typeof Bell> = {
  system: Settings,
  competition: Trophy,
  registration: UserCheck,
  result: BarChart3,
}

const typeColors: Record<Notification['type'], string> = {
  system: 'var(--gray-1)',
  competition: 'var(--accent)',
  registration: 'var(--success)',
  result: 'var(--warning)',
}

const typeBgColors: Record<Notification['type'], string> = {
  system: 'rgba(142, 142, 147, 0.08)',
  competition: 'rgba(0, 122, 255, 0.08)',
  registration: 'rgba(52, 199, 89, 0.08)',
  result: 'rgba(255, 149, 0, 0.08)',
}

export default function TeacherMessages() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([...mockNotifications])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const filtered = notifications.filter((n) => {
    return filter === 'all' || n.type === filter
  })

  function handleToggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
    // Mark as read when expanded
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <>
      {/* Header */}
      <motion.div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={18} strokeWidth={1.5} color="var(--accent)" />
          <div>
            <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>消息通知</span>
            {unreadCount > 0 && (
              <span style={{
                marginLeft: '8px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#fff',
                background: 'var(--danger)',
                borderRadius: '8px',
                padding: '2px 7px',
              }}>
                {unreadCount} 未读
              </span>
            )}
          </div>
        </div>
        <button className="btn ghost" onClick={handleMarkAllRead}>
          <CheckCheck size={14} strokeWidth={1.5} /> 全部已读
        </button>
      </motion.div>

      {/* Filter chips */}
      <motion.div style={{ marginBottom: '20px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <div className="chip-row">
          {(['all', 'system', 'competition', 'registration', 'result'] as FilterType[]).map((f) => (
            <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {filterLabels[f]}
              {f !== 'all' && (
                <span style={{ marginLeft: '4px', fontSize: '11px', opacity: 0.7 }}>
                  {notifications.filter((n) => n.type === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Message list */}
      <motion.div
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {filtered.map((notification) => {
          const IconComp = typeIcons[notification.type]
          const isExpanded = expandedId === notification.id
          return (
            <motion.div
              key={notification.id}
              className="glass-card glass-card-vertical glass-card-static"
              style={{
                padding: '0',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              variants={staggerItem}
            >
              {/* Message row */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px' }}
                onClick={() => handleToggle(notification.id)}
              >
                {/* Type icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: typeBgColors[notification.type],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <IconComp size={16} strokeWidth={1.5} color={typeColors[notification.type]} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: notification.isRead ? '500' : '700',
                      color: 'var(--text-primary)',
                    }}>
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--accent)',
                        flexShrink: 0,
                      }} />
                    )}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {notification.content}
                  </div>
                </div>

                {/* Time + chevron */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                    {notification.time}
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  >
                    <ChevronDown size={14} color="var(--gray-3)" strokeWidth={1.5} />
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
                    <div style={{
                      padding: '0 18px 16px 68px',
                      fontSize: '13px',
                      lineHeight: 1.7,
                      color: 'var(--text-secondary)',
                    }}>
                      {notification.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}

        {filtered.length === 0 && (
          <motion.div
            className="glass-card glass-card-static"
            style={{ justifyContent: 'center', padding: '48px 20px' }}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
          >
            <Bell size={24} strokeWidth={1} color="var(--gray-3)" style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '8px' }}>暂无通知消息</span>
          </motion.div>
        )}
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
