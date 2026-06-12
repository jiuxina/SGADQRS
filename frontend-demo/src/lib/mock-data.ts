// ============================================================
// Mock Data for Student Graduation and Degree Qualification Review System
// ============================================================

export interface Student {
  id: string
  name: string
  studentId: string
  major: string
  className: string
  enrollmentYear: number
  graduationStatus: '通过' | '未通过' | '待审核' | '待录入'
  degreeStatus: '通过' | '未通过' | '待审核' | '待录入'
  gpa: number
  credits: number
  requiredCredits: number
  alerts: string[]
  avatarColor: string
}

export interface AuditItem {
  category: string
  items: {
    name: string
    status: 'pass' | 'fail' | 'pending'
    detail: string
  }[]
}

export interface TeacherStudent {
  id: string
  name: string
  studentId: string
  className: string
  alerts: string[]
  riskLevel: 'high' | 'medium' | 'low'
  lastContact: string
  avatarColor: string
}

const AVATAR_COLORS = [
  '#0A59F7', '#7C3AED', '#059669', '#DC2626',
  '#D97706', '#2563EB', '#9333EA', '#0891B2',
  '#BE123C', '#4F46E5', '#0D9488', '#C2410C',
]

export const mockStudents: Student[] = [
  { id: '1', name: '张伟', studentId: '2021010001', major: '计算机科学与技术', className: '计科2101', enrollmentYear: 2021, graduationStatus: '通过', degreeStatus: '通过', gpa: 3.85, credits: 165, requiredCredits: 160, alerts: [], avatarColor: AVATAR_COLORS[0] },
  { id: '2', name: '李娜', studentId: '2021010002', major: '软件工程', className: '软工2101', enrollmentYear: 2021, graduationStatus: '通过', degreeStatus: '待审核', gpa: 3.62, credits: 162, requiredCredits: 160, alerts: [], avatarColor: AVATAR_COLORS[1] },
  { id: '3', name: '王强', studentId: '2021010003', major: '计算机科学与技术', className: '计科2102', enrollmentYear: 2021, graduationStatus: '未通过', degreeStatus: '未通过', gpa: 2.45, credits: 142, requiredCredits: 160, alerts: ['学分不足', 'GPA低于要求'], avatarColor: AVATAR_COLORS[2] },
  { id: '4', name: '赵敏', studentId: '2021010004', major: '信息安全', className: '信安2101', enrollmentYear: 2021, graduationStatus: '通过', degreeStatus: '通过', gpa: 3.91, credits: 168, requiredCredits: 160, alerts: [], avatarColor: AVATAR_COLORS[3] },
  { id: '5', name: '陈晨', studentId: '2021010005', major: '软件工程', className: '软工2102', enrollmentYear: 2021, graduationStatus: '待审核', degreeStatus: '待审核', gpa: 3.20, credits: 155, requiredCredits: 160, alerts: ['学分可能不足'], avatarColor: AVATAR_COLORS[4] },
  { id: '6', name: '刘洋', studentId: '2021010006', major: '数据科学', className: '数科2101', enrollmentYear: 2021, graduationStatus: '通过', degreeStatus: '通过', gpa: 3.78, credits: 164, requiredCredits: 160, alerts: [], avatarColor: AVATAR_COLORS[5] },
  { id: '7', name: '杨帆', studentId: '2021010007', major: '人工智能', className: '智科2101', enrollmentYear: 2021, graduationStatus: '未通过', degreeStatus: '未通过', gpa: 2.10, credits: 130, requiredCredits: 160, alerts: ['学分严重不足', 'GPA低于要求', '论文未提交'], avatarColor: AVATAR_COLORS[6] },
  { id: '8', name: '黄丽', studentId: '2021010008', major: '计算机科学与技术', className: '计科2101', enrollmentYear: 2021, graduationStatus: '通过', degreeStatus: '待录入', gpa: 3.55, credits: 161, requiredCredits: 160, alerts: [], avatarColor: AVATAR_COLORS[7] },
  { id: '9', name: '周明', studentId: '2021010009', major: '软件工程', className: '软工2101', enrollmentYear: 2021, graduationStatus: '待审核', degreeStatus: '待审核', gpa: 3.30, credits: 158, requiredCredits: 160, alerts: ['学分可能不足'], avatarColor: AVATAR_COLORS[8] },
  { id: '10', name: '吴昊', studentId: '2021010010', major: '信息安全', className: '信安2102', enrollmentYear: 2021, graduationStatus: '通过', degreeStatus: '通过', gpa: 3.68, credits: 163, requiredCredits: 160, alerts: [], avatarColor: AVATAR_COLORS[9] },
  { id: '11', name: '孙璐', studentId: '2021010011', major: '数据科学', className: '数科2101', enrollmentYear: 2021, graduationStatus: '未通过', degreeStatus: '未通过', gpa: 2.78, credits: 148, requiredCredits: 160, alerts: ['学分不足', '毕业论文未通过'], avatarColor: AVATAR_COLORS[10] },
  { id: '12', name: '马超', studentId: '2021010012', major: '人工智能', className: '智科2101', enrollmentYear: 2021, graduationStatus: '通过', degreeStatus: '通过', gpa: 3.92, credits: 170, requiredCredits: 160, alerts: [], avatarColor: AVATAR_COLORS[11] },
  { id: '13', name: '朱婷', studentId: '2021010013', major: '计算机科学与技术', className: '计科2102', enrollmentYear: 2021, graduationStatus: '通过', degreeStatus: '未通过', gpa: 3.15, credits: 162, requiredCredits: 160, alerts: ['学位英语未达标'], avatarColor: AVATAR_COLORS[0] },
  { id: '14', name: '许诺', studentId: '2021010014', major: '软件工程', className: '软工2102', enrollmentYear: 2021, graduationStatus: '待录入', degreeStatus: '待录入', gpa: 3.42, credits: 159, requiredCredits: 160, alerts: ['学分可能不足'], avatarColor: AVATAR_COLORS[1] },
  { id: '15', name: '郑凯', studentId: '2021010015', major: '信息安全', className: '信安2101', enrollmentYear: 2021, graduationStatus: '通过', degreeStatus: '通过', gpa: 3.71, credits: 166, requiredCredits: 160, alerts: [], avatarColor: AVATAR_COLORS[2] },
  { id: '16', name: '何雨', studentId: '2021010016', major: '数据科学', className: '数科2101', enrollmentYear: 2021, graduationStatus: '待审核', degreeStatus: '待审核', gpa: 3.05, credits: 153, requiredCredits: 160, alerts: ['学分可能不足', 'GPA接近线'], avatarColor: AVATAR_COLORS[3] },
  { id: '17', name: '林峰', studentId: '2021010017', major: '人工智能', className: '智科2101', enrollmentYear: 2021, graduationStatus: '通过', degreeStatus: '通过', gpa: 3.88, credits: 169, requiredCredits: 160, alerts: [], avatarColor: AVATAR_COLORS[4] },
  { id: '18', name: '罗丹', studentId: '2021010018', major: '计算机科学与技术', className: '计科2101', enrollmentYear: 2021, graduationStatus: '未通过', degreeStatus: '未通过', gpa: 1.95, credits: 125, requiredCredits: 160, alerts: ['学分严重不足', 'GPA严重低于要求', '论文未提交', '多门课程挂科'], avatarColor: AVATAR_COLORS[5] },
]

export const mockStudentAudit: AuditItem[] = [
  {
    category: '基本信息',
    items: [
      { name: '姓名', status: 'pass', detail: '张伟' },
      { name: '学号', status: 'pass', detail: '2021010001' },
      { name: '专业', status: 'pass', detail: '计算机科学与技术' },
      { name: '班级', status: 'pass', detail: '计科2101' },
      { name: '入学年份', status: 'pass', detail: '2021' },
    ],
  },
  {
    category: '毕业审核',
    items: [
      { name: '课程学分', status: 'pass', detail: '已获得 165 / 需要 160 学分' },
      { name: '必修课成绩', status: 'pass', detail: '全部合格' },
      { name: '选修课学分', status: 'pass', detail: '已获得 35 / 需要 30 学分' },
      { name: '毕业论文', status: 'pass', detail: '成绩：优秀（92分）' },
      { name: '实习实践', status: 'pass', detail: '已完成企业实习 + 社会实践' },
      { name: '德育考核', status: 'pass', detail: '合格' },
    ],
  },
  {
    category: '学位审核',
    items: [
      { name: 'GPA要求', status: 'pass', detail: '当前 GPA: 3.85 / 要求 ≥ 2.0' },
      { name: '学位英语', status: 'pass', detail: '已通过（成绩：85分）' },
      { name: '学位论文', status: 'pass', detail: '成绩：优秀（90分）' },
      { name: '学业诚信', status: 'pass', detail: '无学术不端记录' },
    ],
  },
]

export const mockTeacherStudents: TeacherStudent[] = [
  { id: '3', name: '王强', studentId: '2021010003', className: '计科2102', alerts: ['学分不足（缺18学分）', 'GPA低于要求（2.45）'], riskLevel: 'high', lastContact: '2025-05-20', avatarColor: AVATAR_COLORS[2] },
  { id: '7', name: '杨帆', studentId: '2021010007', className: '智科2101', alerts: ['学分严重不足（缺30学分）', 'GPA严重低于要求（2.10）', '论文未提交'], riskLevel: 'high', lastContact: '2025-05-15', avatarColor: AVATAR_COLORS[6] },
  { id: '11', name: '孙璐', studentId: '2021010011', className: '数科2101', alerts: ['学分不足（缺12学分）', '毕业论文未通过'], riskLevel: 'high', lastContact: '2025-06-01', avatarColor: AVATAR_COLORS[10] },
  { id: '18', name: '罗丹', studentId: '2021010018', className: '计科2101', alerts: ['学分严重不足（缺35学分）', 'GPA严重低于要求（1.95）', '论文未提交', '多门课程挂科'], riskLevel: 'high', lastContact: '2025-04-10', avatarColor: AVATAR_COLORS[5] },
  { id: '5', name: '陈晨', studentId: '2021010005', className: '软工2102', alerts: ['学分可能不足（缺5学分）'], riskLevel: 'medium', lastContact: '2025-06-05', avatarColor: AVATAR_COLORS[4] },
  { id: '9', name: '周明', studentId: '2021010009', className: '软工2101', alerts: ['学分可能不足（缺2学分）'], riskLevel: 'medium', lastContact: '2025-06-03', avatarColor: AVATAR_COLORS[8] },
  { id: '13', name: '朱婷', studentId: '2021010013', className: '计科2102', alerts: ['学位英语未达标'], riskLevel: 'medium', lastContact: '2025-06-02', avatarColor: AVATAR_COLORS[0] },
  { id: '16', name: '何雨', studentId: '2021010016', className: '数科2101', alerts: ['学分可能不足（缺7学分）', 'GPA接近线（3.05）'], riskLevel: 'medium', lastContact: '2025-05-28', avatarColor: AVATAR_COLORS[3] },
]

// Dashboard statistics
export const dashboardStats = {
  totalStudents: 18,
  pendingReview: 4,
  passed: 8,
  failed: 4,
  pendingEntry: 2,
}

// Class statistics for teacher dashboard
export const classStats = [
  { name: '计科2101', total: 3, warning: 1, passed: 1, failed: 1 },
  { name: '计科2102', total: 3, warning: 1, passed: 1, failed: 1 },
  { name: '软工2101', total: 2, warning: 1, passed: 1, failed: 0 },
  { name: '软工2102', total: 2, warning: 1, passed: 1, failed: 0 },
  { name: '信安2101', total: 2, warning: 0, passed: 2, failed: 0 },
  { name: '信安2102', total: 1, warning: 0, passed: 1, failed: 0 },
  { name: '数科2101', total: 3, warning: 2, passed: 0, failed: 1 },
  { name: '智科2101', total: 3, warning: 1, passed: 1, failed: 1 },
]
