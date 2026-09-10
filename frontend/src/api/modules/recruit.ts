import { request } from '../request'
import type { PageResult, RecruitPostDTO, RecruitPostItem } from '../types'

export const recruitApi = {
  /** 发布招募/求组帖 */
  create: (data: RecruitPostDTO) => request.post<RecruitPostItem>('/recruit', data),

  /** 招募广场列表 */
  list: (params: {
    current?: number
    size?: number
    competitionId?: number
    type?: number
    status?: number
    keyword?: string
  }) => request.get<PageResult<RecruitPostItem>>('/recruit/list', { params }),

  /** 帖子详情 */
  detail: (id: number) => request.get<RecruitPostItem>(`/recruit/${id}`),

  /** 编辑帖子 */
  update: (id: number, data: Partial<RecruitPostDTO>) => request.put<RecruitPostItem>(`/recruit/${id}`, data),

  /** 关闭帖子 */
  close: (id: number) => request.delete(`/recruit/${id}`),
}
