import { request } from '../request'
import type { PageResult, RegistrationItem, TeamItem, TeamMember } from '../types'

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

  /** 批量审核报名 */
  batchAudit: (data: { ids: number[]; status: number; auditRemark?: string }) =>
    request.put('/registration/batch-audit', data),

  /** 取消报名 */
  cancel: (id: number) => request.delete(`/registration/${id}`),

  /** 团队列表 */
  teamList: (params: { current?: number; size?: number; competitionId?: number; status?: number; teacherId?: number }) =>
    request.get<PageResult<TeamItem>>('/registration/teams', { params }),

  /** 创建团队 */
  createTeam: (data: { competitionId: number; teamName: string; teamSlogan?: string; teacherId?: number }) =>
    request.post('/registration/team', data),

  /** 加入团队 */
  joinTeam: (teamId: number) => request.post(`/registration/team/${teamId}/join`),

  /** 审核团队 */
  auditTeam: (id: number, status: number, auditRemark?: string) =>
    request.put(`/registration/team/${id}/audit`, null, { params: { status, ...(auditRemark ? { auditRemark } : {}) } }),

  /** 接受指导邀请 */
  acceptAdvisor: (teamId: number) =>
    request.put(`/registration/team/${teamId}/advisor/accept`),

  /** 拒绝指导邀请 */
  rejectAdvisor: (teamId: number) =>
    request.put(`/registration/team/${teamId}/advisor/reject`),

  /** 审核入队请求 */
  auditJoinRequest: (teamId: number, memberId: number, status: number) =>
    request.put(`/registration/team/${teamId}/member/${memberId}/audit`, null, { params: { status } }),

  /** 获取待审核入队申请 */
  listPendingJoinRequests: (teamId: number) =>
    request.get<TeamMember[]>(`/registration/team/${teamId}/member/pending`),
}
