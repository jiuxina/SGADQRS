import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { mockTeacherStudents, classStats } from '@/lib/mock-data'

export default function TeacherDashboard() {
  const { addToast } = useToast()
  const [selectedStudent, setSelectedStudent] = useState<typeof mockTeacherStudents[0] | null>(null)
  const [contactLoading, setContactLoading] = useState(false)

  const handleContact = () => {
    setContactLoading(true)
    setTimeout(() => {
      setContactLoading(false)
      setSelectedStudent(null)
      addToast('已发送提醒通知给学生', 'success')
    }, 1000)
  }

  const highRisk = mockTeacherStudents.filter((s) => s.riskLevel === 'high')
  const mediumRisk = mockTeacherStudents.filter((s) => s.riskLevel === 'medium')

  return (
    <div className="animate-fade-in">
      {/* Stats overview */}
      <div className="stagger-children mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Card hover>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-light">
              <span className="text-lg font-bold text-danger">{highRisk.length}</span>
            </div>
            <div>
              <div className="text-xs text-text-tertiary">高风险</div>
              <div className="text-xl font-semibold text-text-primary">{highRisk.length} 人</div>
            </div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-light">
              <span className="text-lg font-bold text-warning">{mediumRisk.length}</span>
            </div>
            <div>
              <div className="text-xs text-text-tertiary">中风险</div>
              <div className="text-xl font-semibold text-text-primary">{mediumRisk.length} 人</div>
            </div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info-light">
              <span className="text-lg font-bold text-info">
                {classStats.reduce((a, c) => a + c.total, 0)}
              </span>
            </div>
            <div>
              <div className="text-xs text-text-tertiary">总学生</div>
              <div className="text-xl font-semibold text-text-primary">
                {classStats.reduce((a, c) => a + c.total, 0)} 人
              </div>
            </div>
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-light">
              <span className="text-lg font-bold text-success">
                {classStats.reduce((a, c) => a + c.passed, 0)}
              </span>
            </div>
            <div>
              <div className="text-xs text-text-tertiary">已通过</div>
              <div className="text-xl font-semibold text-text-primary">
                {classStats.reduce((a, c) => a + c.passed, 0)} 人
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Class statistics table */}
      <Card className="mb-4" padding="none">
        <div className="border-b border-border-default p-4">
          <h2 className="text-lg font-semibold text-text-primary">班级统计</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default text-left text-xs font-medium text-text-tertiary">
                <th className="px-4 py-3">班级</th>
                <th className="px-4 py-3 text-center">总人数</th>
                <th className="px-4 py-3 text-center">预警</th>
                <th className="px-4 py-3 text-center">通过</th>
                <th className="px-4 py-3 text-center">未通过</th>
                <th className="px-4 py-3">通过率</th>
              </tr>
            </thead>
            <tbody>
              {classStats.map((cls) => {
                const rate = cls.total > 0 ? Math.round(((cls.passed) / cls.total) * 100) : 0
                return (
                  <tr key={cls.name} className="border-b border-border-default last:border-0 hover:bg-bg-tertiary/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{cls.name}</td>
                    <td className="px-4 py-3 text-center text-sm text-text-secondary">{cls.total}</td>
                    <td className="px-4 py-3 text-center">
                      {cls.warning > 0 ? (
                        <span className="text-sm font-medium text-warning">{cls.warning}</span>
                      ) : (
                        <span className="text-sm text-text-tertiary">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-success font-medium">{cls.passed}</td>
                    <td className="px-4 py-3 text-center">
                      {cls.failed > 0 ? (
                        <span className="text-sm font-medium text-danger">{cls.failed}</span>
                      ) : (
                        <span className="text-sm text-text-tertiary">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-bg-tertiary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${rate}%`,
                              backgroundColor: rate >= 80 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#EF4444',
                            }}
                          />
                        </div>
                        <span className="text-xs text-text-secondary w-8 text-right">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Warning student list */}
      <Card padding="none">
        <div className="border-b border-border-default p-4">
          <h2 className="text-lg font-semibold text-text-primary">预警学生</h2>
        </div>
        <div className="divide-y divide-border-default">
          {mockTeacherStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-bg-tertiary/50 cursor-pointer"
              onClick={() => setSelectedStudent(student)}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white shrink-0"
                style={{ backgroundColor: student.avatarColor }}
              >
                {student.name.slice(-1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{student.name}</span>
                  <Badge variant={student.riskLevel === 'high' ? 'danger' : 'warning'} dot>
                    {student.riskLevel === 'high' ? '高风险' : '中风险'}
                  </Badge>
                </div>
                <div className="mt-0.5 text-xs text-text-tertiary">
                  {student.studentId} · {student.className} · 最近联系: {student.lastContact}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-tertiary shrink-0">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>
      </Card>

      {/* Student detail modal */}
      <Dialog
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="学生详情"
      >
        {selectedStudent && (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: selectedStudent.avatarColor }}
              >
                {selectedStudent.name.slice(-1)}
              </div>
              <div>
                <div className="font-semibold text-text-primary">{selectedStudent.name}</div>
                <div className="text-sm text-text-secondary">{selectedStudent.studentId}</div>
              </div>
              <Badge variant={selectedStudent.riskLevel === 'high' ? 'danger' : 'warning'} className="ml-auto">
                {selectedStudent.riskLevel === 'high' ? '高风险' : '中风险'}
              </Badge>
            </div>

            <div className="mb-4 rounded-lg bg-bg-tertiary p-3 text-sm text-text-secondary">
              <div className="mb-1 font-medium text-text-primary">班级: {selectedStudent.className}</div>
              <div>最近联系: {selectedStudent.lastContact}</div>
            </div>

            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-text-primary">预警事项</h4>
              <div className="space-y-1.5">
                {selectedStudent.alerts.map((alert) => (
                  <div key={alert} className="flex items-center gap-2 text-sm text-danger">
                    <span className="h-1.5 w-1.5 rounded-full bg-danger shrink-0" />
                    {alert}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                loading={contactLoading}
                onClick={handleContact}
                className="flex-1"
              >
                发送提醒
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedStudent(null)}
              >
                关闭
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
