// ===== 通用类型 =====

export interface Result<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

// ===== 用户相关 =====

export interface UserInfo {
  id: number
  username: string
  realName: string
  avatar: string | null
  role: string
  userType: number
  gender: number | null
  deptName: string | null
  majorName: string | null
  className: string | null
}

export interface LoginParams {
  username: string
  password: string
  role: string
}

export interface LoginResult {
  token: string
  user: UserInfo
}

export interface UserItem {
  id: number
  username: string
  realName: string
  avatar: string | null
  gender: number
  userType: number
  status: number
  deptName: string | null
  majorName: string | null
  className: string | null
  createTime: string
}

// ===== 竞赛相关 =====

export interface CompetitionItem {
  id: number
  competitionName: string
  organizer: string
  publisherId: number
  publisherName: string | null
  coverImage: string | null
  description: string | null
  rules: string | null
  registrationStart: string
  registrationEnd: string
  competitionStart: string
  competitionEnd: string
  location: string | null
  maxMembers: number
  maxTeams: number | null
  awards: Array<{ name: string; level: number }> | null
  status: number
  registrationCount: number
  hasRegistered: boolean
  attachments: CompetitionAttachment[]
  createTime: string
}

export interface CompetitionAttachment {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string | null
}

export interface CompetitionDTO {
  id?: number
  competitionName: string
  organizer?: string
  coverImage?: string
  description?: string
  rules?: string
  registrationStart: string
  registrationEnd: string
  competitionStart: string
  competitionEnd: string
  location?: string
  maxMembers?: number
  maxTeams?: number
  awards?: string
  attachments?: string
  status?: number
}

export interface FileUploadResult {
  url: string
  fileName: string
  fileSize: number
  fileType: string
}

// ===== 报名相关 =====

export interface RegistrationItem {
  id: number
  competitionId: number
  competitionName: string | null
  teamId: number | null
  teamName: string | null
  studentId: number
  studentName: string | null
  isTeamLeader: number
  contactPhone: string | null
  remark: string | null
  attachmentUrl: string | null
  status: number
  auditRemark: string | null
  auditTime: string | null
  createTime: string
}

// ===== 团队相关 =====

export interface TeamItem {
  id: number
  competitionId: number
  competitionName: string | null
  teamName: string
  leaderId: number
  leaderName: string | null
  teamSlogan: string | null
  status: number
  members: TeamMember[]
  createTime: string
}

export interface TeamMember {
  id: number
  teamId: number
  studentId: number
  studentName: string | null
  studentUsername: string | null
  status: number
  joinTime: string
}

// ===== 成绩相关 =====

export interface ResultItem {
  id: number
  competitionId: number
  competitionName: string | null
  registrationId: number
  studentId: number | null
  studentName: string | null
  teamId: number | null
  teamName: string | null
  score: number | null
  ranking: number | null
  awardLevel: number | null
  awardName: string | null
  remark: string | null
  isPublished: number
  publishTime: string | null
  createTime: string
}

// ===== 公告相关 =====

export interface NoticeItem {
  id: number
  noticeTitle: string
  noticeContent: string
  noticeType: number
  isTop: number
  status: number
  publishTime: string | null
  createTime: string
}

// ===== 统计相关 =====

export interface DashboardStats {
  [key: string]: unknown
}

export interface EnrollmentTrend {
  month: string
  count: number
}

export interface CompetitionRanking {
  id: number
  name: string
  count: number
  status: number
}

export interface UpcomingDeadline {
  id: number
  competitionName: string
  deadlineType: string
  deadlineTime: string
}

export interface UpcomingStart {
  id: number
  competitionName: string
  startTime: string
}

export interface UpcomingStats {
  upcomingDeadlines: UpcomingDeadline[]
  upcomingStarts: UpcomingStart[]
}
