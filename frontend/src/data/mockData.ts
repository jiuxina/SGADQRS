/* ============================================
   Student Competition Information Management System
   Complete Mock Data — All Roles
   ============================================ */

// ─── Review Status (legacy) ────────────────────────
export type ReviewStatus = 'pass' | 'fail' | 'pending' | 'reviewing'

// ─── Competitions ──────────────────────────────────
export interface Competition {
  id: string; name: string; organizer: string; publisherName: string
  description: string; rules: string
  registrationStart: string; registrationEnd: string; competitionStart: string; competitionEnd: string
  location: string; maxMembers: number; maxTeams: number | null
  status: 'draft' | 'pending' | 'published' | 'ongoing' | 'ended' | 'rejected'
  registeredCount: number
}

export const mockCompetitions: Competition[] = [
  { id: '1', name: '全国大学生人工智能大赛', organizer: '教育部高等学校计算机类教指委', publisherName: '王建国', description: '面向全国高校学生的AI技术竞赛，涵盖机器学习、深度学习、计算机视觉等方向。', rules: '每队3-5人，提交AI项目作品及答辩PPT', registrationStart: '2025-05-01', registrationEnd: '2025-06-15', competitionStart: '2025-07-01', competitionEnd: '2025-08-15', location: '线上初赛 + 北京决赛', maxMembers: 5, maxTeams: null, status: 'published', registeredCount: 128 },
  { id: '2', name: '中国"互联网+"大学生创新创业大赛', organizer: '教育部', publisherName: '李明华', description: '中国最大的大学生创新创业赛事，涵盖高教主赛道、青年红色筑梦之旅等。', rules: '团队参赛，需提交商业计划书和项目路演', registrationStart: '2025-04-15', registrationEnd: '2025-06-30', competitionStart: '2025-07-15', competitionEnd: '2025-10-30', location: '校赛→省赛→国赛', maxMembers: 5, maxTeams: 200, status: 'published', registeredCount: 256 },
  { id: '3', name: 'ACM-ICPC国际大学生程序设计竞赛', organizer: 'ACM', publisherName: '张伟', description: '全球最具影响力的大学生程序设计竞赛，考验算法设计与编程能力。', rules: '每队3人，5小时解决8-13道算法题', registrationStart: '2025-06-01', registrationEnd: '2025-07-15', competitionStart: '2025-10-01', competitionEnd: '2025-11-30', location: '区域赛 + World Finals', maxMembers: 3, maxTeams: null, status: 'published', registeredCount: 86 },
  { id: '4', name: '全国大学生数学建模竞赛', organizer: '中国工业与应用数学学会', publisherName: '陈静', description: '全国规模最大的数学建模竞赛，培养团队合作和数学应用能力。', rules: '每队3人，3天内完成数学建模论文', registrationStart: '2025-06-15', registrationEnd: '2025-08-31', competitionStart: '2025-09-05', competitionEnd: '2025-09-08', location: '各参赛学校', maxMembers: 3, maxTeams: null, status: 'published', registeredCount: 312 },
  { id: '5', name: '全国大学生电子设计竞赛', organizer: '教育部、工业和信息化部', publisherName: '刘强', description: '面向电子信息类专业的实践性竞赛，考验电路设计与编程能力。', rules: '每队3人，四天三夜完成电子系统设计', registrationStart: '2025-05-20', registrationEnd: '2025-07-10', competitionStart: '2025-07-25', competitionEnd: '2025-07-29', location: '各参赛学校实验室', maxMembers: 3, maxTeams: 150, status: 'ongoing', registeredCount: 95 },
  { id: '6', name: '全国大学生信息安全竞赛', organizer: '教育部高等学校信息安全教指委', publisherName: '赵刚', description: '信息安全领域全国性竞赛，含CTF、创新作品赛等赛道。', rules: 'CTF赛制：解题+攻防，创新赛：提交作品', registrationStart: '2025-05-10', registrationEnd: '2025-06-20', competitionStart: '2025-07-15', competitionEnd: '2025-08-20', location: '线上初赛 + 线下决赛', maxMembers: 4, maxTeams: null, status: 'published', registeredCount: 76 },
  { id: '7', name: '全国大学生机器人大赛', organizer: '中国自动化协会', publisherName: '王建国', description: '面向机器人设计与控制的全国性竞赛。', rules: '每队3-5人，提交机器人作品并现场演示', registrationStart: '2025-04-01', registrationEnd: '2025-05-31', competitionStart: '2025-06-15', competitionEnd: '2025-07-30', location: '上海世博展览馆', maxMembers: 5, maxTeams: 100, status: 'ongoing', registeredCount: 88 },
  { id: '8', name: '中国大学生计算机设计大赛', organizer: '教育部高等学校计算机类教指委', publisherName: '李明华', description: '涵盖软件应用、微课、大数据、物联网等方向的综合性计算机设计竞赛。', rules: '每队1-5人，按类别提交作品', registrationStart: '2025-03-15', registrationEnd: '2025-05-15', competitionStart: '2025-06-01', competitionEnd: '2025-08-30', location: '省赛→国赛', maxMembers: 5, maxTeams: null, status: 'ended', registeredCount: 420 },
  { id: '9', name: '全国大学生英语竞赛', organizer: '高等学校大学外语教学指导委员会', publisherName: '陈静', description: '全国规模最大的大学生英语综合能力竞赛。', rules: '个人参赛，分A/B/C/D四类', registrationStart: '2025-03-01', registrationEnd: '2025-03-20', competitionStart: '2025-04-13', competitionEnd: '2025-05-18', location: '各参赛学校', maxMembers: 1, maxTeams: null, status: 'ended', registeredCount: 650 },
  { id: '10', name: '"挑战杯"大学生课外学术科技作品竞赛', organizer: '共青团中央、中国科协', publisherName: '张伟', description: '中国大学生课外学术科技领域最高荣誉赛事。', rules: '团队参赛，提交学术论文或科技发明作品', registrationStart: '2025-06-01', registrationEnd: '2025-09-30', competitionStart: '2025-10-15', competitionEnd: '2025-12-01', location: '校赛→省赛→国赛', maxMembers: 8, maxTeams: null, status: 'published', registeredCount: 45 },
  { id: '11', name: '全国大学生物联网设计竞赛', organizer: '教育部高等学校计算机类教指委', publisherName: '刘强', description: '物联网技术应用与创新设计竞赛。', rules: '每队3-5人，提交物联网作品及演示', registrationStart: '2025-05-01', registrationEnd: '2025-07-01', competitionStart: '2025-08-01', competitionEnd: '2025-08-30', location: '区域赛 + 总决赛', maxMembers: 5, maxTeams: 120, status: 'published', registeredCount: 67 },
  { id: '12', name: '全国大学生统计建模大赛', organizer: '中国统计教育学会', publisherName: '陈静', description: '统计建模与数据分析领域全国性竞赛。', rules: '每队3人，提交统计建模论文', registrationStart: '2025-04-10', registrationEnd: '2025-06-10', competitionStart: '2025-06-20', competitionEnd: '2025-07-20', location: '线上提交', maxMembers: 3, maxTeams: null, status: 'ongoing', registeredCount: 178 },
]

// ─── Registrations ─────────────────────────────────
export interface Registration {
  id: string; competitionId: string; competitionName: string; studentName: string
  studentId: string; teamName: string | null; isTeamLeader: boolean
  contactPhone: string; status: 'pending' | 'approved' | 'rejected'
  auditRemark: string; registrationTime: string
}

export const mockRegistrations: Registration[] = [
  { id: '1', competitionId: '1', competitionName: '全国大学生人工智能大赛', studentName: '张明辉', studentId: '2021010101', teamName: '深度学习研究小组', isTeamLeader: true, contactPhone: '138****1234', status: 'approved', auditRemark: '材料齐全，审核通过', registrationTime: '2025-05-12 09:30' },
  { id: '2', competitionId: '2', competitionName: '中国"互联网+"创新创业大赛', studentName: '张明辉', studentId: '2021010101', teamName: '创新应用开发团队', isTeamLeader: false, contactPhone: '138****1234', status: 'approved', auditRemark: '', registrationTime: '2025-04-20 14:15' },
  { id: '3', competitionId: '3', competitionName: 'ACM-ICPC程序设计竞赛', studentName: '张明辉', studentId: '2021010101', teamName: '算法精英队', isTeamLeader: true, contactPhone: '138****1234', status: 'pending', auditRemark: '', registrationTime: '2025-06-05 10:00' },
  { id: '4', competitionId: '4', competitionName: '全国大学生数学建模竞赛', studentName: '张明辉', studentId: '2021010101', teamName: null, isTeamLeader: false, contactPhone: '138****1234', status: 'pending', auditRemark: '', registrationTime: '2025-06-18 16:40' },
  { id: '5', competitionId: '6', competitionName: '全国大学生信息安全竞赛', studentName: '张明辉', studentId: '2021010101', teamName: null, isTeamLeader: false, contactPhone: '138****1234', status: 'rejected', auditRemark: '报名材料不完整，请补充项目方案', registrationTime: '2025-05-15 11:20' },
  { id: '6', competitionId: '9', competitionName: '全国大学生英语竞赛', studentName: '张明辉', studentId: '2021010101', teamName: null, isTeamLeader: false, contactPhone: '138****1234', status: 'approved', auditRemark: '', registrationTime: '2025-03-05 08:30' },
]

// ─── Results / Grades ──────────────────────────────
export interface CompetitionResult {
  id: string; competitionId: string; competitionName: string; studentName: string
  studentId: string; teamName: string | null
  score: number | null; ranking: number | null
  awardLevel: 'special' | 'first' | 'second' | 'third' | 'excellence' | null
  awardName: string; isPublished: boolean; publishTime: string | null
}

export const mockResults: CompetitionResult[] = [
  { id: '1', competitionId: '8', competitionName: '中国大学生计算机设计大赛', studentName: '张明辉', studentId: '2021010101', teamName: '深度学习研究小组', score: 92.5, ranking: 3, awardLevel: 'first', awardName: '一等奖', isPublished: true, publishTime: '2025-09-01' },
  { id: '2', competitionId: '9', competitionName: '全国大学生英语竞赛', studentName: '张明辉', studentId: '2021010101', teamName: null, score: 85.0, ranking: 12, awardLevel: 'second', awardName: '二等奖', isPublished: true, publishTime: '2025-05-20' },
  { id: '3', competitionId: '1', competitionName: '全国大学生人工智能大赛', studentName: '张明辉', studentId: '2021010101', teamName: '深度学习研究小组', score: 88.3, ranking: 5, awardLevel: 'second', awardName: '二等奖', isPublished: true, publishTime: '2025-08-20' },
  { id: '4', competitionId: '2', competitionName: '中国"互联网+"创新创业大赛', studentName: '张明辉', studentId: '2021010101', teamName: '创新应用开发团队', score: 95.1, ranking: 1, awardLevel: 'special', awardName: '特等奖', isPublished: true, publishTime: '2025-11-05' },
  { id: '5', competitionId: '12', competitionName: '全国大学生统计建模大赛', studentName: '张明辉', studentId: '2021010101', teamName: '数据挖掘先锋队', score: null, ranking: null, awardLevel: null, awardName: '待公布', isPublished: false, publishTime: null },
]

// ─── Notifications ─────────────────────────────────
export interface Notification {
  id: string; title: string; content: string
  type: 'system' | 'competition' | 'registration' | 'result'
  isRead: boolean; time: string
}

export const mockNotifications: Notification[] = [
  { id: '1', title: '报名审核通过', content: '您在"全国大学生人工智能大赛"的报名已通过审核，请及时关注比赛通知。', type: 'registration', isRead: false, time: '2025-06-10 14:30' },
  { id: '2', title: '成绩已发布', content: '"中国大学生计算机设计大赛"成绩已发布，请前往成绩查询页面查看。', type: 'result', isRead: false, time: '2025-06-09 10:00' },
  { id: '3', title: '报名即将截止', content: '"ACM-ICPC程序设计竞赛"报名将于7月15日截止，请尽快完成报名。', type: 'competition', isRead: true, time: '2025-06-08 08:00' },
  { id: '4', title: '系统维护通知', content: '系统将于6月15日凌晨2:00-6:00进行维护升级，届时部分功能可能暂不可用。', type: 'system', isRead: true, time: '2025-06-07 16:00' },
  { id: '5', title: '报名被拒绝', content: '您在"全国大学生信息安全竞赛"的报名被拒绝，原因：报名材料不完整。', type: 'registration', isRead: true, time: '2025-06-05 09:15' },
  { id: '6', title: '新竞赛发布', content: '"挑战杯"大学生课外学术科技作品竞赛已发布，欢迎报名参赛。', type: 'competition', isRead: true, time: '2025-06-01 12:00' },
  { id: '7', title: '证书可下载', content: '"中国"互联网+"创新创业大赛"电子证书已生成，请前往成绩页面下载。', type: 'result', isRead: true, time: '2025-05-28 14:00' },
  { id: '8', title: '团队组建提醒', content: '"全国大学生数学建模竞赛"为团队赛，请尽快组建或加入团队。', type: 'competition', isRead: true, time: '2025-05-25 10:00' },
]

// ─── Users (for admin management) ──────────────────
export interface User {
  id: string; username: string; realName: string; userType: 'student' | 'teacher' | 'admin'
  deptName: string
  lastLogin: string; createTime: string
}

export const mockUsers: User[] = [
  { id: '1', username: '2021010101', realName: '张明辉', userType: 'student', deptName: '计算机科学与技术学院', lastLogin: '2025-06-10 14:30', createTime: '2021-09-01' },
  { id: '2', username: '2021010102', realName: '李思雨', userType: 'student', deptName: '计算机科学与技术学院', lastLogin: '2025-06-10 12:15', createTime: '2021-09-01' },
  { id: '3', username: '2021010103', realName: '王浩然', userType: 'student', deptName: '计算机科学与技术学院', lastLogin: '2025-06-09 16:40', createTime: '2021-09-01' },
  { id: '4', username: '2021010201', realName: '陈佳琪', userType: 'student', deptName: '软件工程学院', lastLogin: '2025-06-10 09:00', createTime: '2021-09-01' },
  { id: '5', username: '2021010202', realName: '刘子轩', userType: 'student', deptName: '软件工程学院', lastLogin: '2025-05-20 11:30', createTime: '2021-09-01' },
  { id: '6', username: 'T001', realName: '王建国', userType: 'teacher', deptName: '计算机科学与技术学院', lastLogin: '2025-06-10 08:30', createTime: '2015-07-01' },
  { id: '7', username: 'T002', realName: '李明华', userType: 'teacher', deptName: '软件工程学院', lastLogin: '2025-06-09 17:20', createTime: '2016-03-15' },
  { id: '8', username: 'T003', realName: '张伟', userType: 'teacher', deptName: '信息安全学院', lastLogin: '2025-06-08 14:10', createTime: '2017-09-01' },
  { id: '9', username: 'T004', realName: '陈静', userType: 'teacher', deptName: '数据科学学院', lastLogin: '2025-04-15 10:00', createTime: '2018-03-01' },
  { id: '10', username: 'admin', realName: '系统管理员', userType: 'admin', deptName: '教务处', lastLogin: '2025-06-10 15:00', createTime: '2020-01-01' },
  { id: '11', username: '2021010301', realName: '孙博文', userType: 'student', deptName: '信息安全学院', lastLogin: '2025-06-10 11:45', createTime: '2021-09-01' },
  { id: '12', username: '2021010302', realName: '周晓敏', userType: 'student', deptName: '信息安全学院', lastLogin: '2025-06-09 15:20', createTime: '2021-09-01' },
]

// ─── Notices (for admin) ───────────────────────────
export interface Notice {
  id: string; title: string; content: string; type: 'notice' | 'announcement'
  isTop: boolean; status: 'published' | 'draft'; publishTime: string; createTime: string
}

export const mockNotices: Notice[] = [
  { id: '1', title: '2025年全国大学生人工智能大赛报名通知', content: '各学院：全国大学生人工智能大赛现已开始报名...', type: 'notice', isTop: true, status: 'published', publishTime: '2025-05-01 10:00', createTime: '2025-04-28 16:00' },
  { id: '2', title: '关于举办第十二届"互联网+"创新创业大赛的通知', content: '各学院：第十二届中国"互联网+"大学生创新创业大赛...', type: 'notice', isTop: true, status: 'published', publishTime: '2025-04-15 09:00', createTime: '2025-04-12 14:00' },
  { id: '3', title: '2025年上半年竞赛日历发布', content: '现将2025年上半年各类竞赛时间安排公布如下...', type: 'announcement', isTop: false, status: 'published', publishTime: '2025-03-01 08:00', createTime: '2025-02-25 10:00' },
  { id: '4', title: '系统升级维护通知', content: '为提升系统性能，定于6月15日凌晨进行升级维护...', type: 'notice', isTop: false, status: 'published', publishTime: '2025-06-07 16:00', createTime: '2025-06-07 14:00' },
  { id: '5', title: '竞赛获奖证书领取通知', content: '2024年度各类竞赛获奖证书已制作完成...', type: 'announcement', isTop: false, status: 'draft', publishTime: '', createTime: '2025-06-05 11:00' },
]

// ─── Operation Logs (for admin) ────────────────────
export interface OperationLog {
  id: string; username: string; operation: string; method: string
  requestUrl: string; ipAddress: string; spendTime: number; status: 'success' | 'fail'
  time: string
}

export const mockLogs: OperationLog[] = [
  { id: '1', username: 'admin', operation: '审核竞赛发布', method: 'PUT', requestUrl: '/api/competition/1/audit', ipAddress: '192.168.1.100', spendTime: 45, status: 'success', time: '2025-06-10 15:32' },
  { id: '2', username: '王建国', operation: '发布竞赛信息', method: 'POST', requestUrl: '/api/competition', ipAddress: '192.168.1.105', spendTime: 128, status: 'success', time: '2025-06-10 14:20' },
  { id: '3', username: '张明辉', operation: '提交竞赛报名', method: 'POST', requestUrl: '/api/registration', ipAddress: '10.0.0.55', spendTime: 89, status: 'success', time: '2025-06-10 10:15' },
  { id: '4', username: '李明华', operation: '录入竞赛成绩', method: 'POST', requestUrl: '/api/result/batch', ipAddress: '192.168.1.108', spendTime: 256, status: 'success', time: '2025-06-09 16:40' },
  { id: '5', username: 'admin', operation: '禁用用户账号', method: 'PUT', requestUrl: '/api/user/5/status', ipAddress: '192.168.1.100', spendTime: 32, status: 'success', time: '2025-06-09 11:00' },
  { id: '6', username: '系统', operation: '自动生成报名统计', method: 'GET', requestUrl: '/api/stats/registration', ipAddress: '127.0.0.1', spendTime: 512, status: 'success', time: '2025-06-09 02:00' },
  { id: '7', username: '王浩然', operation: '上传报名材料', method: 'POST', requestUrl: '/api/upload', ipAddress: '10.0.0.78', spendTime: 1024, status: 'fail', time: '2025-06-08 15:30' },
  { id: '8', username: 'admin', operation: '导出用户数据', method: 'GET', requestUrl: '/api/user/export', ipAddress: '192.168.1.100', spendTime: 2048, status: 'success', time: '2025-06-08 10:00' },
  { id: '9', username: '赵刚', operation: '审核学生报名', method: 'PUT', requestUrl: '/api/registration/3/audit', ipAddress: '192.168.1.112', spendTime: 67, status: 'success', time: '2025-06-07 14:20' },
  { id: '10', username: 'admin', operation: '发布系统公告', method: 'POST', requestUrl: '/api/notice', ipAddress: '192.168.1.100', spendTime: 55, status: 'success', time: '2025-06-07 09:00' },
]

// ─── System Config (for admin) ─────────────────────
export interface SystemConfig {
  id: string; key: string; value: string; description: string
}

export const mockConfigs: SystemConfig[] = [
  { id: '1', key: 'max_registration_count', value: '5', description: '每个学生最多同时报名的竞赛数量' },
  { id: '2', key: 'max_team_members', value: '8', description: '每支队伍最大队员数上限' },
  { id: '3', key: 'max_upload_size', value: '20', description: '单个附件上传大小限制（MB）' },
  { id: '4', key: 'allowed_file_types', value: 'pdf,doc,docx,jpg,png,zip', description: '允许上传的文件类型' },
  { id: '5', key: 'registration_auto_audit', value: 'false', description: '报名是否自动审核通过' },
  { id: '6', key: 'site_name', value: '学生竞赛信息管理系统', description: '系统名称' },
  { id: '7', key: 'site_description', value: '高校学生竞赛综合管理平台', description: '系统描述' },
  { id: '8', key: 'maintenance_mode', value: 'false', description: '系统维护模式（开启后仅管理员可访问）' },
]

// ════════════════════════════════════════════════════
//  Legacy Data (for existing pages)
// ════════════════════════════════════════════════════

export interface CompetitionTeam {
  id: string; teamName: string; leaderName: string; leaderId: string; competition: string
  competitionType: string; memberCount: number; status: ReviewStatus
  registrationAudit: ReviewStatus; qualificationAudit: ReviewStatus; avgScore: number
}
export interface ReviewSection {
  id: string; label: string; status: ReviewStatus; detail: string; score?: string
}
export interface Warning {
  id: string; teamName: string; leaderName: string; leaderId: string
  type: 'material' | 'member' | 'score' | 'discipline'; message: string; severity: 'high' | 'medium' | 'low'
}
export interface TeacherCompetitionTeam {
  id: string; teamName: string; competition: string; leaderName: string; overallStatus: ReviewStatus
  memberCount: number; maxMembers: number; avgScore: number; warnings: string[]; phone: string
}

export const mockCompetitionTeams: CompetitionTeam[] = [
  { id: '1', teamName: '深度学习研究小组', leaderName: '张明辉', leaderId: '2021010101', competition: '全国大学生人工智能大赛', competitionType: '科技竞赛', memberCount: 4, status: 'pass', registrationAudit: 'pass', qualificationAudit: 'pass', avgScore: 92.5 },
  { id: '2', teamName: '创新应用开发团队', leaderName: '李思雨', leaderId: '2021010102', competition: '中国"互联网+"大学生创新创业大赛', competitionType: '创新创业', memberCount: 5, status: 'pass', registrationAudit: 'pass', qualificationAudit: 'pass', avgScore: 95.1 },
  { id: '3', teamName: '网络安全攻防队', leaderName: '王浩然', leaderId: '2021010103', competition: '全国大学生信息安全竞赛', competitionType: '科技竞赛', memberCount: 3, status: 'fail', registrationAudit: 'fail', qualificationAudit: 'fail', avgScore: 68.3 },
  { id: '4', teamName: '数据挖掘先锋队', leaderName: '陈佳琪', leaderId: '2021010201', competition: '全国大学生数学建模竞赛', competitionType: '学科竞赛', memberCount: 3, status: 'reviewing', registrationAudit: 'reviewing', qualificationAudit: 'reviewing', avgScore: 85.7 },
  { id: '5', teamName: '智能机器人战队', leaderName: '刘子轩', leaderId: '2021010202', competition: '全国大学生机器人大赛', competitionType: '科技竞赛', memberCount: 5, status: 'pass', registrationAudit: 'pass', qualificationAudit: 'pass', avgScore: 90.2 },
  { id: '6', teamName: '全栈开发小组', leaderName: '赵雅欣', leaderId: '2021010203', competition: '中国大学生计算机设计大赛', competitionType: '科技竞赛', memberCount: 4, status: 'pending', registrationAudit: 'pending', qualificationAudit: 'pending', avgScore: 82.4 },
  { id: '7', teamName: '算法精英队', leaderName: '孙博文', leaderId: '2021010301', competition: 'ACM-ICPC国际大学生程序设计竞赛', competitionType: '学科竞赛', memberCount: 3, status: 'pass', registrationAudit: 'pass', qualificationAudit: 'pass', avgScore: 88.9 },
  { id: '8', teamName: '大数据分析团队', leaderName: '周晓敏', leaderId: '2021010302', competition: '全国大学生统计建模大赛', competitionType: '学科竞赛', memberCount: 4, status: 'pass', registrationAudit: 'pass', qualificationAudit: 'pass', avgScore: 91.6 },
  { id: '9', teamName: '嵌入式开发小组', leaderName: '吴鹏飞', leaderId: '2021010303', competition: '全国大学生电子设计竞赛', competitionType: '科技竞赛', memberCount: 3, status: 'fail', registrationAudit: 'fail', qualificationAudit: 'fail', avgScore: 62.8 },
  { id: '10', teamName: '云计算创新队', leaderName: '郑雨桐', leaderId: '2021010401', competition: '中国高校计算机大赛', competitionType: '科技竞赛', memberCount: 4, status: 'pass', registrationAudit: 'pass', qualificationAudit: 'pass', avgScore: 93.7 },
]

export const mockReviewSections: ReviewSection[] = [
  { id: 'registration', label: '报名资格审查', status: 'pass', detail: '队伍报名信息完整，符合参赛要求', score: '已通过' },
  { id: 'member', label: '队员资格审查', status: 'pass', detail: '全部4名队员学籍验证通过，无违纪记录', score: '4/4' },
  { id: 'project', label: '项目方案审核', status: 'pass', detail: '项目方案完整，技术路线清晰可行', score: '92分' },
  { id: 'teacher', label: '指导教师确认', status: 'pass', detail: '指导教师已确认，资质审核通过', score: '已确认' },
  { id: 'material', label: '材料完整性', status: 'pass', detail: '所有申报材料已提交并核实', score: '8/8项' },
  { id: 'college', label: '院系审核', status: 'pass', detail: '院系已审核通过', score: '已通过' },
  { id: 'discipline', label: '纪律审查', status: 'pass', detail: '无违纪记录，符合参赛纪律要求', score: '合格' },
  { id: 'preliminary', label: '校赛初选', status: 'reviewing', detail: '校赛初选进行中，待最终评审结果', score: '进行中' },
]

export const mockWarnings: Warning[] = [
  { id: '1', teamName: '网络安全攻防队', leaderName: '王浩然', leaderId: '2021010103', type: 'material', message: '报名材料不完整，缺少项目方案文档', severity: 'high' },
  { id: '2', teamName: '嵌入式开发小组', leaderName: '吴鹏飞', leaderId: '2021010303', type: 'score', message: '队伍平均成绩62.8，低于参赛要求70分', severity: 'high' },
  { id: '3', teamName: '全栈开发小组', leaderName: '赵雅欣', leaderId: '2021010203', type: 'member', message: '队员学籍证明未提交，需尽快补充', severity: 'high' },
  { id: '4', teamName: '密码学研究队', leaderName: '高凯瑞', leaderId: '2021010304', type: 'material', message: '指导教师确认函缺失', severity: 'high' },
  { id: '5', teamName: '区块链研究小组', leaderName: '杨天宇', leaderId: '2021010104', type: 'member', message: '一名队员学籍状态异常，需核实', severity: 'medium' },
  { id: '6', teamName: '系统安全研究队', leaderName: '谢泽宇', leaderId: '2021010305', type: 'score', message: '队伍平均成绩76.4，接近参赛要求临界值', severity: 'medium' },
  { id: '7', teamName: '数据挖掘先锋队', leaderName: '陈佳琪', leaderId: '2021010201', type: 'material', message: '项目方案缺少预算部分，建议补充', severity: 'low' },
  { id: '8', teamName: '自然语言处理队', leaderName: '何俊杰', leaderId: '2021010105', type: 'discipline', message: '报名进度滞后，需尽快提交材料', severity: 'low' },
]

export const mockTeacherTeams: TeacherCompetitionTeam[] = [
  { id: '1', teamName: '深度学习研究小组', competition: '全国大学生人工智能大赛', leaderName: '张明辉', overallStatus: 'pass', memberCount: 4, maxMembers: 5, avgScore: 92.5, warnings: [], phone: '138****1234' },
  { id: '2', teamName: '创新应用开发团队', competition: '中国"互联网+"创新创业大赛', leaderName: '李思雨', overallStatus: 'pass', memberCount: 5, maxMembers: 5, avgScore: 95.1, warnings: [], phone: '139****5678' },
  { id: '3', teamName: '网络安全攻防队', competition: '全国大学生信息安全竞赛', leaderName: '王浩然', overallStatus: 'fail', memberCount: 3, maxMembers: 4, avgScore: 68.3, warnings: ['材料不完整', '成绩偏低'], phone: '136****9012' },
  { id: '4', teamName: '数据挖掘先锋队', competition: '全国大学生数学建模竞赛', leaderName: '陈佳琪', overallStatus: 'reviewing', memberCount: 3, maxMembers: 3, avgScore: 85.7, warnings: ['方案缺少预算'], phone: '137****3456' },
  { id: '5', teamName: '智能机器人战队', competition: '全国大学生机器人大赛', leaderName: '刘子轩', overallStatus: 'pass', memberCount: 5, maxMembers: 5, avgScore: 90.2, warnings: [], phone: '135****7890' },
  { id: '6', teamName: '全栈开发小组', competition: '中国大学生计算机设计大赛', leaderName: '赵雅欣', overallStatus: 'pending', memberCount: 4, maxMembers: 4, avgScore: 82.4, warnings: ['学籍证明未提交'], phone: '158****2345' },
  { id: '7', teamName: '算法精英队', competition: 'ACM-ICPC程序设计竞赛', leaderName: '孙博文', overallStatus: 'pass', memberCount: 3, maxMembers: 3, avgScore: 88.9, warnings: [], phone: '159****6789' },
  { id: '8', teamName: '大数据分析团队', competition: '全国大学生统计建模大赛', leaderName: '周晓敏', overallStatus: 'pass', memberCount: 4, maxMembers: 4, avgScore: 91.6, warnings: [], phone: '186****0123' },
]
