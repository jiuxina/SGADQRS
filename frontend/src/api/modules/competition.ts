import { request } from '../request'
import type { PageResult, CompetitionItem, CompetitionDTO, DashboardStats, CompetitionAttachment } from '../types'

export const competitionApi = {
  /** 竞赛列表 */
  list: (params: { current?: number; size?: number; keyword?: string; status?: number; publisherId?: number }) =>
    request.get<PageResult<CompetitionItem>>('/competition/list', { params }),

  /** 竞赛详情 */
  getById: (id: number) => request.get<CompetitionItem>(`/competition/${id}`),

  /** 创建竞赛 */
  create: (data: CompetitionDTO) => request.post<CompetitionItem>('/competition', data),

  /** 更新竞赛 */
  update: (data: CompetitionDTO) => request.put('/competition', data),

  /** 审核竞赛 */
  audit: (id: number, status: number, remark?: string) =>
    request.put(`/competition/${id}/audit`, null, { params: { status, remark } }),

  /** 删除竞赛 */
  delete: (id: number) => request.delete(`/competition/${id}`),

  /** 添加附件 */
  addAttachment: (id: number, params: { fileName: string; fileUrl: string; fileSize?: number; fileType?: string }) =>
    request.post<CompetitionAttachment>(`/competition/${id}/attachment`, null, { params }),

  /** 删除附件 */
  deleteAttachment: (attachmentId: number) => request.delete(`/competition/attachment/${attachmentId}`),

  /** 仪表盘统计 */
  dashboard: () => request.get<DashboardStats>('/competition/dashboard'),
}
