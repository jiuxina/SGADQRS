import { request } from '../request'
import type { PageResult, NoticeItem, MessageItem, LogItem, ConfigItem, DeptItem, MajorItem, ClassItem } from '../types'

export const noticeApi = {
  list: (params: { current?: number; size?: number; noticeType?: number; status?: number }) =>
    request.get<PageResult<NoticeItem>>('/notice/list', { params }),
  create: (data: Record<string, unknown>) => request.post('/notice', data),
  update: (data: Record<string, unknown>) => request.put('/notice', data),
  delete: (id: number) => request.delete(`/notice/${id}`),
}

export const messageApi = {
  list: (params: { current?: number; size?: number; messageType?: number; isRead?: number }) =>
    request.get<PageResult<MessageItem>>('/message/list', { params }),
  markRead: (id: number) => request.put(`/message/${id}/read`),
  markAllRead: () => request.put('/message/readAll'),
  unreadCount: () => request.get<number>('/message/unread'),
}

export const logApi = {
  list: (params: { current?: number; size?: number; username?: string; method?: string; status?: number }) =>
    request.get<PageResult<LogItem>>('/log/list', { params }),
}

export const configApi = {
  list: () => request.get<ConfigItem[]>('/config/list'),
  update: (id: number, configValue: string) => request.put(`/config/${id}`, null, { params: { configValue } }),
}

export const deptApi = {
  list: () => request.get<DeptItem[]>('/dept/list'),
  majors: (deptId?: number) => request.get<MajorItem[]>('/dept/major/list', { params: { deptId } }),
  classes: (majorId?: number) => request.get<ClassItem[]>('/dept/class/list', { params: { majorId } }),
}

export const statsApi = {
  admin: () => request.get('/stats/admin'),
}

export const fileApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<string>('/file/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
