import { request } from '../request'
import type { NotificationItem, PageResult } from '../types'

export const notificationApi = {
  /** 我的通知列表 */
  list: (params: { current?: number; size?: number; unreadOnly?: boolean }) =>
    request.get<PageResult<NotificationItem>>('/notification/list', { params }),

  /** 全员公告 */
  announcements: (params: { current?: number; size?: number } = {}) =>
    request.get<PageResult<NotificationItem>>('/notification/announcements', { params }),

  /** 未读数 */
  unreadCount: () => request.get<{ count: number }>('/notification/unread-count'),

  /** 标记已读 */
  markRead: (id: number) => request.put(`/notification/read/${id}`),

  /** 全部已读 */
  markAllRead: () => request.put('/notification/read-all'),
}
