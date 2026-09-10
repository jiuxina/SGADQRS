import { request } from '../request'
import type { PageResult, ResultItem } from '../types'

export const resultApi = {
  /** 成绩列表 */
  list: (params: { current?: number; size?: number; competitionId?: number; studentId?: number; isPublished?: number }) =>
    request.get<PageResult<ResultItem>>('/result/list', { params }),

  /** 更新成绩 */
  update: (data: Record<string, unknown>) => request.put('/result', data),

  /** 批量录入成绩 */
  batch: (data: { competitionId: number; results: Array<{ studentId: number; score: number; ranking?: number | null; awardLevel?: number | null }> }) =>
    request.post('/result/batch', data),

  /** 发布成绩 */
  publish: (competitionId: number) => request.post(`/result/publish/${competitionId}`),

  /** 成绩统计（教师/管理员） */
  stats: (params: { competitionId: number }) =>
    request.get<{ totalCount: number; scoredCount: number; avgScore: number | null; maxScore: number | null; minScore: number | null; publishedCount: number; unpublishedCount: number }>('/result/stats', { params }),
}
