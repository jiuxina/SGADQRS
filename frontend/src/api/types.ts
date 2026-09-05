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
  nickname: string | null
  avatar: string | null
  role: string
  userType: number
  gender: number | null
  deptName: string | null
  majorName: string | null
  className: string | null
  bio: string | null
  skills: string | null
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

// ===== 团队相关 =====

export interface TeamItem {
  id: number
  competitionId: number
  competitionName: string | null
  teamName: string
  leaderId: number
  leaderName: string | null
  teacherId: number | null
  teacherName: string | null
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
  joinTime: string
}

// ===== 社区：资料卡 =====

/** 脱敏资料卡（未解锁状态下的可见信息） */
export interface UserCard {
  id: number
  displayName: string
  avatar: string | null
  gender: number | null
  deptName: string | null
  majorName: string | null
  className: string | null
  skills: string | null
  bioBrief: string | null
  userType: number
  role: string
  unlocked: boolean
}

/** 公开资料（解锁后含完整信息与获奖记录） */
export interface PublicProfile extends UserCard {
  username?: string
  realName?: string
  nickname?: string | null
  bio?: string | null
  awards?: AwardRecord[]
  stats?: { totalParticipations: number; totalAwards: number }
}

export interface AwardRecord {
  competitionName: string | null
  awardLevel: number | null
  awardName: string | null
  ranking: number | null
  score: number | null
  publishTime: string | null
}

// ===== 社区：招募/求组帖 =====

export interface RecruitPostItem {
  id: number
  competitionId: number
  competitionName: string | null
  userId: number
  /** 1-组队招募 2-求组 */
  type: number
  title: string
  content: string | null
  teamId: number | null
  tags: string | null
  deadline: string | null
  /** 1-招募中 0-已关闭 */
  status: number
  createTime: string
  author: UserCard | null
  team: { id: number; teamName: string; slogan: string | null; currentMembers: number; maxMembers: number | null } | null
}

export interface RecruitPostDTO {
  type: number
  competitionId: number
  teamId?: number
  title: string
  content?: string
  tags?: string
  deadline?: string
}

// ===== 社区：请求（互看/申请/邀请） =====

export interface CommunityRequestItem {
  id: number
  /** 1-资料互看 2-入队申请 3-入队邀请 */
  type: number
  postId: number | null
  teamId: number | null
  fromUserId: number
  toUserId: number
  message: string | null
  /** 0-待处理 1-已同意 2-已拒绝 */
  status: number
  createTime: string
  handleTime: string | null
  fromUser: UserCard | null
  toUser: UserCard | null
  postTitle: string | null
  teamName: string | null
  competitionName: string | null
}

// ===== 站内通知 =====

export interface NotificationItem {
  id: number
  /** 接收者用户ID，0-全员公告 */
  userId: number
  type: 'announcement' | 'interaction' | 'system' | string
  title: string
  content: string | null
  refType: string | null
  refId: number | null
  isRead: number
  isTop: number
  createTime: string
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

// ===== 用户统计 =====

export interface UserStats {
  totalCount: number
  studentCount: number
  teacherCount: number
  adminCount: number
}
