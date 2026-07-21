/**
 * 状态徽章映射 - 统一管理竞赛和报名状态的 CSS class 与显示标签
 */

// 管理员/教师端竞赛状态映射
export const competitionStatusBadge: Record<number, { cls: string; label: string }> = {
  0: { cls: 'pending', label: '草稿' },
  1: { cls: 'pending', label: '待审核' },
  2: { cls: 'pass', label: '已发布' },
  3: { cls: 'reviewing', label: '进行中' },
  4: { cls: 'fail', label: '已结束' },
  5: { cls: 'fail', label: '已驳回' },
}

// 学生端竞赛状态映射（标签和样式与管理端不同）
export const studentCompetitionStatusBadge: Record<number, { cls: string; label: string }> = {
  0: { cls: 'pending', label: '草稿' },
  1: { cls: 'reviewing', label: '审核中' },
  2: { cls: 'pass', label: '报名中' },
  3: { cls: 'reviewing', label: '进行中' },
  4: { cls: 'pending', label: '已结束' },
  5: { cls: 'fail', label: '已驳回' },
}

// 报名状态映射
export const registrationStatusBadge: Record<number, { cls: string; label: string }> = {
  0: { cls: 'pending', label: '待审核' },
  1: { cls: 'pass', label: '已通过' },
  2: { cls: 'fail', label: '已拒绝' },
}

/**
 * 获取状态徽章
 * @param status 状态码
 * @param type 映射类型：'competition'(管理员/教师竞赛)、'student-competition'(学生竞赛)、'registration'(报名)
 */
export function getStatusBadge(
  status: number,
  type: 'competition' | 'student-competition' | 'registration' = 'competition',
): { cls: string; label: string } {
  const map =
    type === 'competition'
      ? competitionStatusBadge
      : type === 'student-competition'
        ? studentCompetitionStatusBadge
        : registrationStatusBadge
  return map[status] ?? { cls: 'pending', label: '未知' }
}
