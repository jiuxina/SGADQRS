import { create } from 'zustand'
import { notificationApi } from '../api'

interface NotificationState {
  /** 未读通知数（不含全员公告，由后端 unread-count 决定语义） */
  count: number
  setCount: (n: number) => void
  /** 拉取一次未读数并写入 store，失败静默 */
  refresh: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set) => ({
  count: 0,
  setCount: (n) => set({ count: n }),
  refresh: async () => {
    try {
      const { count } = await notificationApi.unreadCount()
      set({ count })
    } catch {
      /* 静默失败，不打扰用户 */
    }
  },
}))
