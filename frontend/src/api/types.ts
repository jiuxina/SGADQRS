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
  phone: string | null
  email: string | null
  deptId: number | null
  majorId: number | null
  classId: number | null
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
  phone: string | null
  email: string | null
  userType: number
  status: number
  deptId: number | null
  majorId: number | null
  classId: number | null
  deptName: string | null
  majorName: string | null
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
  status: number
  viewCount: number
  registrationCount: number
  hasRegistered: boolean
  attachments: CompetitionAttachment[]
  createTime: string
}

export interface CompetitionAttachment {
  id: number
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
  status?: number
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
  majorName: string | null
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

// ===== 消息相关 =====

export interface MessageItem {
  id: number
  userId: number
  messageTitle: string
  messageContent: string
  messageType: number
  isRead: number
  createTime: string
}

// ===== 日志相关 =====

export interface LogItem {
  id: number
  userId: number | null
  username: string | null
  operation: string
  method: string | null
  requestUrl: string | null
  requestParams: string | null
  ipAddress: string | null
  spendTime: number | null
  status: number
  errorMsg: string | null
  createTime: string
}

// ===== 配置相关 =====

export interface ConfigItem {
  id: number
  configKey: string
  configValue: string
  description: string | null
}

// ===== 组织架构 =====

export interface DeptItem {
  id: number
  parentId: number
  deptName: string
  deptCode: string | null
}

export interface MajorItem {
  id: number
  deptId: number
  majorName: string
  majorCode: string | null
}

export interface ClassItem {
  id: number
  majorId: number
  className: string
  grade: string
}

// ===== 统计相关 =====

export interface DashboardStats {
  [key: string]: unknown
}
