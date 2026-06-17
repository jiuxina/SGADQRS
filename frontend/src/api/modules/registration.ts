import { request } from '../request'
import type { PageResult, RegistrationItem, TeamItem } from '../types'

export const registrationApi = {
  /** 报名列表 */
  list: (params: { current?: number; size?: number; competitionId?: number; studentId?: number; status?: number; publisherId?: number }) =>
    request.get<PageResult<RegistrationItem>>('/registration/list', { params }),

  /** 学生报名 */
  register: (data: { competitionId: number; teamId?: number; contactPhone?: string; remark?: string; attachmentUrl?: string }) =>
    request.post('/registration', data),

  /** 审核报名 */
  audit: (id: number, data: { status: number; auditRemark?: string }) =>
    request.put(`/registration/${id}/audit`, data),

  /** 取消报名 */
  cancel: (id: number) => request.delete(`/registration/${id}`),

  /** 团队列表 */
  teamList: (params: { current?: number; size?: number; competitionId?: number; status?: number }) =>
    request.get<PageResult<TeamItem>>('/registration/teams', { params }),

  /** 创建团队 */
  createTeam: (data: { competitionId: number; teamName: string; teamSlogan?: string }) =>
    request.post('/registration/team', data),

  /** 加入团队 */
  joinTeam: (teamId: number) => request.post(`/registration/team/${teamId}/join`),

  /** 审核团队 */
  auditTeam: (id: number, status: number) =>
    request.put(`/registration/team/${id}/audit`, null, { params: { status } }),
}
