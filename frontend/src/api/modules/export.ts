import { downloadFile } from '../../utils/export'

export const exportApi = {
  /** 导出竞赛列表 */
  competitions: (params?: { status?: number; keyword?: string }) => {
    const query = new URLSearchParams()
    if (params?.status != null) query.set('status', String(params.status))
    if (params?.keyword) query.set('keyword', params.keyword)
    const qs = query.toString()
    return downloadFile(`/export/competitions${qs ? '?' + qs : ''}`, '竞赛列表.xlsx')
  },

  /** 导出参赛队伍列表 */
  teams: (params?: { competitionId?: number; status?: number }) => {
    const query = new URLSearchParams()
    if (params?.competitionId) query.set('competitionId', String(params.competitionId))
    if (params?.status != null) query.set('status', String(params.status))
    const qs = query.toString()
    return downloadFile(`/export/teams${qs ? '?' + qs : ''}`, '团队列表.xlsx')
  },

  /** 导出成绩列表 */
  results: (params?: { competitionId?: number; isPublished?: number }) => {
    const query = new URLSearchParams()
    if (params?.competitionId) query.set('competitionId', String(params.competitionId))
    if (params?.isPublished != null) query.set('isPublished', String(params.isPublished))
    const qs = query.toString()
    return downloadFile(`/export/results${qs ? '?' + qs : ''}`, '成绩列表.xlsx')
  },

  /** 导出用户列表 */
  users: (params?: { userType?: number; keyword?: string }) => {
    const query = new URLSearchParams()
    if (params?.userType != null) query.set('userType', String(params.userType))
    if (params?.keyword) query.set('keyword', params.keyword)
    const qs = query.toString()
    return downloadFile(`/export/users${qs ? '?' + qs : ''}`, '用户列表.xlsx')
  },

  /** 导出学生成绩单 */
  studentTranscript: () => downloadFile('/export/student-transcript', '我的成绩单.xlsx'),
}
