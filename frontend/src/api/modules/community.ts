import { request } from '../request'
import type { CommunityRequestItem, PageResult } from '../types'

export const communityApi = {
  /** 发起请求：2-入队申请 3-入队邀请（可附备注/联系方式） */
  createRequest: (data: { type: 2 | 3; postId?: number; teamId?: number; message?: string }) =>
    request.post<CommunityRequestItem>('/community/request', data),

  /** 处理请求：1-同意 2-拒绝 */
  handle: (id: number, status: 1 | 2) => request.put(`/community/request/${id}/handle`, { status }),

  /** 收到的请求 */
  received: (params: { current?: number; size?: number; type?: number; status?: number }) =>
    request.get<PageResult<CommunityRequestItem>>('/community/request/received', { params }),

  /** 我发出的请求 */
  sent: (params: { current?: number; size?: number; type?: number; status?: number }) =>
    request.get<PageResult<CommunityRequestItem>>('/community/request/sent', { params }),
}
