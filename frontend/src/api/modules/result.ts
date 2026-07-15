import { request } from '../request'
import type { PageResult, ResultItem } from '../types'

export const resultApi = {
  /** 成绩列表 */
  list: (params: { current?: number; size?: number; competitionId?: number; studentId?: number; isPublished?: number }) =>
    request.get<PageResult<ResultItem>>('/result/list', { params }),

  /** 录入成绩 */
  save: (data: Record<string, unknown>) => request.post('/result', data),

  /** 更新成绩 */
  update: (data: Record<string, unknown>) => request.put('/result', data),

  /** 发布成绩 */
  publish: (competitionId: number) => request.post(`/result/publish/${competitionId}`),

  /** 学生成绩统计 */
  studentStats: () => request.get('/result/student/stats'),
}
