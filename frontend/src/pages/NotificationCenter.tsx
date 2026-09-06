import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Megaphone, Bell, CheckCheck } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { ListSkeleton } from '../components/PageSkeleton'
import Pagination from '../components/Pagination'
import { notificationApi } from '../api'
import { toast } from '../components/toastUtils'
import { useAuthStore } from '../store/authStore'
import type { NotificationItem } from '../api/types'
import { formatDate } from '../utils/format'
import { notificationTarget } from '../utils/notification'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'

/**
 * 消息中心：个人通知 + 全员公告统一收件箱。
 * 点击通知按 refType 跳转（见 utils/notification.ts）：
 * request→组队中心对应请求页、recruit→招募广场、team→我的队伍、user→成绩单。
 */
export default function NotificationCenter() {
  const navigate = useNavigate()
  const loadUser = useAuthStore((s) => s.loadUser)
  const [tab, setTab] = useState<'inbox' | 'announcements'>('inbox')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const pageSize = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'inbox') {
        const res = await notificationApi.list({ current, size: pageSize, unreadOnly: unreadOnly || undefined })
        setItems(res.records)
        setTotal(res.total)
      } else {
        const res = await notificationApi.announcements({ current, size: pageSize })
        setItems(res.records)
        setTotal(res.total)
      }
    } catch {
      // request 层已提示
    } finally {
      setLoading(false)
    }
  }, [tab, unreadOnly, current])

  useEffect(() => {
    load()
  }, [load])

  const targetFor = (n: NotificationItem): string => notificationTarget(n)

  const handleClick = async (n: NotificationItem) => {
    if (tab === 'inbox' && n.isRead === 0) {
      notificationApi.markRead(n.id).catch(() => {})
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: 1 } : i)))
    }
    const target = targetFor(n)
    if (target) navigate(target)
  }

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllRead()
      toast.success('已全部标记为已读')
      load()
      loadUser().catch(() => {})
    } catch {
      toast.error('操作失败')
    }
  }

  return (
    <>
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px', width: '100%', maxWidth: '960px', margin: '0 auto 12px' }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {([
            { v: 'inbox', label: '通知' },
            { v: 'announcements', label: '公告' },
          ] as const).map((t) => (
            <button
              key={t.v}
              onClick={() => { setTab(t.v); setCurrent(1) }}
              style={{
                padding: '6px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600',
                background: tab === t.v ? 'var(--accent)' : 'rgba(0,122,255,0.08)',
                color: tab === t.v ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {t.label}
            </button>
          ))}
          {tab === 'inbox' && (
            <button
              onClick={() => { setUnreadOnly((v) => !v); setCurrent(1) }}
              style={{
                padding: '6px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600',
                background: unreadOnly ? '#ff9500' : 'rgba(0,122,255,0.08)',
                color: unreadOnly ? '#fff' : 'var(--text-secondary)',
              }}
            >
              只看未读
            </button>
          )}
        </div>
        {tab === 'inbox' && (
          <button
            className="btn ghost"
            style={{ height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={handleMarkAll}
          >
            <CheckCheck size={14} strokeWidth={1.5} />
            全部已读
          </button>
        )}
      </motion.div>

      {loading ? (
        <ListSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${tab}-${unreadOnly}-${current}`}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '960px', margin: '0 auto' }}
          >
            {items.map((n) => (
              <motion.div
                key={n.id}
                variants={staggerItem}
                className="glass-card glass-card-static"
                onClick={() => handleClick(n)}
                style={{
                  padding: '14px 16px', cursor: targetFor(n) ? 'pointer' : 'default',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                  borderLeft: n.isRead === 0 && tab === 'inbox' ? '3px solid var(--accent)' : '3px solid transparent',
                }}
              >
                <span style={{
                  width: '34px', height: '34px', borderRadius: '11px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: n.type === 'announcement' ? 'rgba(255,149,0,0.12)' : 'rgba(0,122,255,0.10)',
                  color: n.type === 'announcement' ? '#ff9500' : 'var(--accent)',
                }}>
                  {n.type === 'announcement' ? <Megaphone size={16} strokeWidth={1.7} /> : <Bell size={16} strokeWidth={1.7} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: n.isRead === 0 && tab === 'inbox' ? '700' : '600', color: 'var(--text-primary)' }}>
                      {n.title}
                    </span>
                    {n.isTop === 1 && <span className="glass-badge pass" style={{ fontSize: '11px' }}>置顶</span>}
                  </div>
                  {n.content && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.6 }}>
                      {n.content.replace(/<[^>]+>/g, '')}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--text-quaternary, #bbb)', marginTop: '4px' }}>
                    {formatDate(n.createTime)}
                    {n.type === 'announcement' && ' · 全员公告'}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
        <Pagination
          current={current}
          totalPages={Math.max(1, Math.ceil(total / pageSize))}
          pageSize={pageSize}
          total={total}
          onPageChange={setCurrent}
          onPageSizeChange={() => {}}
        />
      </div>

      {items.length === 0 && !loading && (
        <EmptyState icon={tab === 'inbox' ? Bell : Megaphone} text={tab === 'inbox' ? '暂无通知，去招募广场转转吧' : '暂无公告'} />
      )}
    </>
  )
}
