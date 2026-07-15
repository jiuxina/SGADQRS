import { request } from '../request'
import type { PageResult, NoticeItem, MessageItem, LogItem, DeptItem, MajorItem, ClassItem, FileUploadResult } from '../types'

export const noticeApi = {
  list: (params: { current?: number; size?: number; noticeType?: number; status?: number }) =>
    request.get<PageResult<NoticeItem>>('/notice/list', { params }),
  create: (data: Record<string, unknown>) => request.post('/notice', data),
  update: (data: Record<string, unknown>) => request.put('/notice', data),
  toggleTop: (id: number) => request.put(`/notice/${id}/top`),
  delete: (id: number) => request.delete(`/notice/${id}`),
}

export const messageApi = {
  list: (params: { current?: number; size?: number; isRead?: number }) =>
    request.get<PageResult<MessageItem>>('/message/list', { params }),
  send: (data: {
    title: string
    content: string
    targetType: 'user' | 'role' | 'dept' | 'all'
    userIds?: number[]
    userType?: number
    deptId?: number
  }) => request.post('/message/send', data),
  markRead: (id: number) => request.put(`/message/${id}/read`),
  markAllRead: () => request.put('/message/readAll'),
  unreadCount: () => request.get<number>('/message/unread'),
}

export const logApi = {
  list: (params: { current?: number; size?: number; username?: string; method?: string; status?: number; startDate?: string; endDate?: string }) =>
    request.get<PageResult<LogItem>>('/log/list', { params }),
}

export const deptApi = {
  list: () => request.get<DeptItem[]>('/dept/list'),
  create: (data: { deptName: string; deptCode?: string; sortOrder?: number }) =>
    request.post('/dept', null, { params: data }),
  update: (id: number, data: { deptName?: string; deptCode?: string; sortOrder?: number }) =>
    request.put(`/dept/${id}`, null, { params: data }),
  delete: (id: number) => request.delete(`/dept/${id}`),

  majors: (deptId?: number) => request.get<MajorItem[]>('/dept/major/list', { params: { deptId } }),
  createMajor: (data: { deptId: number; majorName: string; majorCode?: string }) =>
    request.post('/dept/major', null, { params: data }),
  updateMajor: (id: number, data: { majorName?: string; majorCode?: string }) =>
    request.put(`/dept/major/${id}`, null, { params: data }),
  deleteMajor: (id: number) => request.delete(`/dept/major/${id}`),

  classes: (majorId?: number) => request.get<ClassItem[]>('/dept/class/list', { params: { majorId } }),
  createClass: (data: { majorId: number; className: string; grade?: string }) =>
    request.post('/dept/class', null, { params: data }),
  updateClass: (id: number, data: { className?: string; grade?: string }) =>
    request.put(`/dept/class/${id}`, null, { params: data }),
  deleteClass: (id: number) => request.delete(`/dept/class/${id}`),
}

export const statsApi = {
  admin: () => request.get('/stats/admin'),
  upcoming: () => request.get('/stats/upcoming'),
}

export const fileApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<FileUploadResult>('/file/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
