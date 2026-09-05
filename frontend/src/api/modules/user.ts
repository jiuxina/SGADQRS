import { request } from '../request'
import type { PageResult, PublicProfile, UserCard, UserItem, UserStats } from '../types'

export const userApi = {
  /** 用户列表 */
  list: (params: { current?: number; size?: number; keyword?: string; userType?: number }) =>
    request.get<PageResult<UserItem>>('/user/list', { params }),

  /** 用户统计 */
  stats: () => request.get<UserStats>('/user/stats'),

  /** 用户详情 */
  getById: (id: number) => request.get<UserItem>(`/user/${id}`),

  /** 社区公开资料（未解锁仅脱敏卡） */
  publicProfile: (id: number) => request.get<PublicProfile>(`/user/public/${id}`),

  /** 本人更新社区资料 */
  updateProfile: (data: Record<string, unknown>) => request.put('/user/profile', data),

  /** 本人修改密码 */
  changePassword: (data: { oldPassword: string; newPassword: string }) => request.put('/user/password', data),

  /** 创建用户 */
  create: (data: Record<string, unknown>) => request.post('/user', data),

  /** 更新用户 */
  update: (data: Record<string, unknown>) => request.put('/user', data),

  /** 删除用户 */
  delete: (id: number) => request.delete(`/user/${id}`),

  /** 禁用/启用用户 */
  toggleStatus: (id: number, status: number) => request.put(`/user/disable/${id}`, { status }),

  /** 重置密码 */
  resetPassword: (id: number) => request.put(`/user/reset-password/${id}`),

  /** 批量删除用户 */
  batchDelete: (ids: number[]) => request.post('/user/batch-delete', { ids }),

  /** 批量禁用用户 */
  batchDisable: (ids: number[]) => request.post('/user/batch-disable', { ids }),
}

export type { UserCard }
