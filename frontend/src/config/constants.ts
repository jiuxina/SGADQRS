/**
 * 应用常量定义
 * 集中管理所有魔法数字和配置值
 */

// ===== 存储键名 =====

export const STORAGE_KEYS = {
  TOKEN: 'scms_token',
  USER: 'scms_user',
  /** 记住账号：存上次登录成功的用户名 */
  REMEMBER_USER: 'scms_remember_user',
  /** 页面使用教程已看标记前缀（后接 `路径|tab`） */
  TUTORIAL_SEEN_PREFIX: 'scms_tutorial_seen:',
  /** 发布竞赛表单草稿（仅创建模式） */
  COMPETITION_DRAFT: 'scms_draft_competition',
} as const

// ===== 分页配置 =====

export const PAGE_SIZE = {
  /** 默认分页大小 */
  DEFAULT: 20,
  /** 仪表盘预览数量 */
  DASHBOARD_PREVIEW: 5,
  /** 大分页 */
  LARGE: 100,
} as const

// ===== 状态码 =====

/** 竞赛状态 */
export const CompetitionStatus = {
  /** 草稿 */
  DRAFT: 0,
  /** 审核中 */
  PENDING: 1,
  /** 报名中 */
  PUBLISHED: 2,
  /** 进行中 */
  ONGOING: 3,
  /** 已结束 */
  ENDED: 4,
  /** 已驳回 */
  REJECTED: 5,
} as const

export type CompetitionStatus = typeof CompetitionStatus[keyof typeof CompetitionStatus]

/** 竞赛状态标签 */
export const COMPETITION_STATUS_LABEL: Record<CompetitionStatus, string> = {
  [CompetitionStatus.DRAFT]: '草稿',
  [CompetitionStatus.PENDING]: '审核中',
  [CompetitionStatus.PUBLISHED]: '报名中',
  [CompetitionStatus.ONGOING]: '进行中',
  [CompetitionStatus.ENDED]: '已结束',
  [CompetitionStatus.REJECTED]: '已驳回',
}

/** 报名状态 */
export const RegistrationStatus = {
  /** 待审核 */
  PENDING: 0,
  /** 已通过 */
  APPROVED: 1,
  /** 已拒绝 */
  REJECTED: 2,
} as const

export type RegistrationStatus = typeof RegistrationStatus[keyof typeof RegistrationStatus]

/** 报名状态标签 */
export const REGISTRATION_STATUS_LABEL: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: '待审核',
  [RegistrationStatus.APPROVED]: '已通过',
  [RegistrationStatus.REJECTED]: '已拒绝',
}

/** 公告状态 */
export const NoticeStatus = {
  /** 草稿 */
  DRAFT: 0,
  /** 已发布 */
  PUBLISHED: 1,
} as const

export type NoticeStatus = typeof NoticeStatus[keyof typeof NoticeStatus]

/** 公告状态标签 */
export const NOTICE_STATUS_LABEL: Record<NoticeStatus, string> = {
  [NoticeStatus.DRAFT]: '草稿',
  [NoticeStatus.PUBLISHED]: '已发布',
}

/** 用户状态 */
export const UserStatus = {
  /** 禁用 */
  DISABLED: 0,
  /** 启用 */
  ENABLED: 1,
} as const

export type UserStatus = typeof UserStatus[keyof typeof UserStatus]

/** 用户状态标签 */
export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  [UserStatus.DISABLED]: '禁用',
  [UserStatus.ENABLED]: '启用',
}

/** 团队成员状态 */
export const TeamMemberStatus = {
  /** 待确认 */
  PENDING: 0,
  /** 已确认 */
  CONFIRMED: 1,
  /** 已拒绝 */
  REJECTED: 2,
} as const

export type TeamMemberStatus = typeof TeamMemberStatus[keyof typeof TeamMemberStatus]

// ===== API 配置 =====

export const API_CONFIG = {
  /** 成功状态码 */
  SUCCESS_CODE: 200,
  /** 认证过期状态码 */
  AUTH_EXPIRED_STATUS: 401,
} as const

// ===== 路由路径 =====

export const ROUTES = {
  LOGIN: '/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  TEACHER_DASHBOARD: '/teacher/dashboard',
  STUDENT_DASHBOARD: '/student/dashboard',
} as const

// ===== 时间阈值 =====

export const TIME_THRESHOLDS = {
  /** 时钟刷新间隔 (ms) */
  CLOCK_REFRESH_INTERVAL: 15000,
  /** 倒计时更新间隔 (ms) */
  COUNTDOWN_TICK_INTERVAL: 1000,
  /** 紧急状态阈值 (ms) - 24小时 */
  URGENT_THRESHOLD: 24 * 60 * 60 * 1000,
  /** 慢请求警告阈值 (ms) */
  SLOW_REQUEST_THRESHOLD: 500,
} as const

// ===== 动画配置 =====

export const ANIMATION_CONFIG = {
  /** 数字滚动默认时长 (ms) */
  DIGIT_ROLL_DURATION: 800,
  /** 挂载动画延迟 (ms) */
  MOUNT_DELAY: 100,
  /** 庆祝特效时长 (ms) */
  CONFETTI_DURATION: 3000,
  /** 失败特效时长 (ms) */
  FAILURE_DURATION: 2500,
  /** 粒子数量 */
  PARTICLE_COUNT: 150,
} as const

// ===== Z-Index 层级 =====

export const Z_INDEX = {
  /** 模态框 */
  MODAL: 999,
  /** 特效覆盖层 */
  EFFECT_OVERLAY: 9999,
} as const

// ===== Canvas 配置 =====

export const CANVAS_CONFIG = {
  /** 证书宽度 */
  CERTIFICATE_WIDTH: 1000,
  /** 证书高度 */
  CERTIFICATE_HEIGHT: 700,
} as const
