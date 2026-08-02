import { request } from '../request'
import type { PageResult, NoticeItem, FileUploadResult } from '../types'

export const noticeApi = {
  list: (params: { current?: number; size?: number; noticeType?: number; status?: number; keyword?: string }) =>
    request.get<PageResult<NoticeItem>>('/notice/list', { params }),
  create: (data: Record<string, unknown>) => request.post('/notice', data),
  update: (data: Record<string, unknown>) => request.put('/notice', data),
  toggleTop: (id: number) => request.put(`/notice/${id}/top`),
  delete: (id: number) => request.delete(`/notice/${id}`),
}

export const statsApi = {
  admin: (params?: { startDate?: string; endDate?: string }) => request.get('/stats/admin', { params }),
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
