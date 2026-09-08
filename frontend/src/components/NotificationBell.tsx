import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Bell } from 'lucide-react'
import { notificationApi } from '../api'
import type { NotificationItem } from '../api/types'
import { formatDate } from '../utils/format'
import { notificationTarget, inboxPathByRole } from '../utils/notification'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'

/**
 * 顶栏通知铃铛：未读数由 UnreadFavicon 统一轮询写入 store，这里只消费；
 * 点击弹出最近通知预览，点击单条消息按 refType 跳转对应页面，无落地页时回退消息中心。
 */
export default function NotificationBell({ bellPath }: { bellPath?: string }) {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.user?.role)
  const inboxPath = bellPath ?? inboxPathByRole(role)
  const count = useNotificationStore((s) => s.count)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    notificationApi.list({ current: 1, size: 6 })
      .then((res) => setItems(res.records))
      .catch(() => setItems([]))
  }, [open])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        className="header-action-btn"
        title="消息通知"
        onClick={() => setOpen((v) => !v)}
        style={{ position: 'relative' }}
      >
        <Bell strokeWidth={1.5} />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            minWidth: '16px', height: '16px', padding: '0 4px',
            borderRadius: '999px', background: '#ff3b30', color: '#fff',
            fontSize: '11px', fontWeight: '700', lineHeight: '16px', textAlign: 'center',
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="glass-card glass-card-vertical glass-card-static"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              position: 'absolute', top: '44px', right: 0, width: '320px',
              padding: '12px', zIndex: 1200,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>最近通知</span>
              <button
                style={{ fontSize: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => { setOpen(false); navigate(inboxPath) }}
              >
                查看全部 →
              </button>
            </div>
            {items.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '18px 0' }}>
                暂无新通知
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    setOpen(false)
                    if (n.isRead === 0) {
                      notificationApi.markRead(n.id).catch(() => {})
                      useNotificationStore.getState().refresh()
                    }
                    navigate(notificationTarget(n) || inboxPath)
                  }}
                  style={{
                    display: 'flex', gap: '8px', padding: '8px 6px', borderRadius: '10px',
                    cursor: 'pointer', alignItems: 'flex-start',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,122,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%', marginTop: '6px', flexShrink: 0,
                    background: n.isRead === 1 ? 'transparent' : '#ff3b30',
                    border: n.isRead === 1 ? '1px solid var(--text-quaternary, #ccc)' : 'none',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.content || ''}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-quaternary, #bbb)', marginTop: '2px' }}>
                      {formatDate(n.createTime)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
