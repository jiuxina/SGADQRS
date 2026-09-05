import { request } from '../request'
import type { PageResult, TeamItem, TeamMember } from '../types'

export interface ParticipantRow {
  teamId: number
  teamName: string
  studentId: number
  studentName: string | null
}

export const registrationApi = {
  /** 参赛队伍列表：学生=我所在的队伍；教师=我指导的队伍；管理员=全部 */
  teamList: (params: { current?: number; size?: number; competitionId?: number; status?: number; teacherId?: number }) =>
    request.get<PageResult<TeamItem>>('/registration/teams', { params }),

  /** 参赛队伍详情（队员、指导老师/竞赛发布教师、管理员可见） */
  teamDetail: (id: number) => request.get<TeamItem>(`/registration/team/${id}`),

  /** 解散队伍（队长本人，限组建中/待审核） */
  disbandTeam: (id: number) => request.delete(`/registration/team/${id}`),

  /** 竞赛参赛者名单（已通过队伍的全部成员，供成绩录入） */
  participants: (competitionId: number) =>
    request.get<ParticipantRow[]>('/registration/participants', { params: { competitionId } }),

  /** 创建参赛队伍（单人赛自动1人队并直接提交） */
  createTeam: (data: { competitionId: number; teamName: string; teamSlogan?: string; teacherId?: number }) =>
    request.post('/registration/team', data),

  /** 队长提交审核（组建中→已提交） */
  submitTeam: (id: number) => request.put(`/registration/team/${id}/submit`),

  /** 队长更换指导老师（teacherId 为空表示取消指定） */
  changeTeacher: (id: number, teacherId: number | null) =>
    request.put(`/registration/team/${id}/teacher`, { teacherId }),

  /** 管理员审核参赛队伍 */
  auditTeam: (id: number, status: number, auditRemark?: string) =>
    request.put(`/registration/team/${id}/audit`, null, { params: { status, ...(auditRemark ? { auditRemark } : {}) } }),
}

export type { TeamMember }
