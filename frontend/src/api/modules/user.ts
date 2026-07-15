import { request } from '../request'
import type { PageResult, UserItem } from '../types'

export const userApi = {
  /** 用户列表 */
  list: (params: { current?: number; size?: number; keyword?: string; userType?: number }) =>
    request.get<PageResult<UserItem>>('/user/list', { params }),

  /** 用户详情 */
  getById: (id: number) => request.get<UserItem>(`/user/${id}`),

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
}
