import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockStudentAudit, mockStudents } from '@/lib/mock-data'

const student = mockStudents[0] // Use first student as the logged-in student

const statusConfig = {
  pass: { label: '通过', variant: 'success' as const, icon: '✓' },
  fail: { label: '未通过', variant: 'danger' as const, icon: '✗' },
  pending: { label: '待审核', variant: 'warning' as const, icon: '…' },
}

export default function StudentAuditPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      {/* Personal Info Card */}
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-md"
            style={{ backgroundColor: student.avatarColor }}
          >
            {student.name.slice(-1)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-text-primary">{student.name}</h2>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-text-secondary">
              <span>学号: {student.studentId}</span>
              <span>·</span>
              <span>{student.major}</span>
              <span>·</span>
              <span>{student.className}</span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold text-brand-primary">{student.gpa}</div>
            <div className="text-xs text-text-tertiary">GPA</div>
          </div>
        </div>
        {/* Overall status bar */}
        <div className="mt-4 flex gap-2">
          <div className="flex-1 rounded-lg bg-success-light p-3 text-center">
            <div className="text-lg font-bold text-success">通过</div>
            <div className="text-xs text-text-secondary">毕业审查</div>
          </div>
          <div className="flex-1 rounded-lg bg-success-light p-3 text-center">
            <div className="text-lg font-bold text-success">通过</div>
            <div className="text-xs text-text-secondary">学位审查</div>
          </div>
        </div>
      </Card>

      {/* Audit sections */}
      {mockStudentAudit.map((section) => (
        <Card key={section.category} className="mb-4">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">{section.category}</h3>
          <div className="space-y-3">
            {section.items.map((item) => {
              const config = statusConfig[item.status]
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg border border-border-default p-3 transition-all duration-200 hover:shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                        item.status === 'pass'
                          ? 'bg-success'
                          : item.status === 'fail'
                          ? 'bg-danger'
                          : 'bg-warning'
                      }`}
                    >
                      {config.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{item.name}</div>
                      <div className="text-xs text-text-tertiary">{item.detail}</div>
                    </div>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              )
            })}
          </div>
        </Card>
      ))}

      {/* Missing items section */}
      {(() => {
        const missingItems = mockStudentAudit
          .flatMap((s) => s.items)
          .filter((item) => item.status === 'fail')
        if (missingItems.length === 0) return null
        return (
          <Card className="mb-4 border-danger/20 bg-danger-light/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white text-xs font-bold">
                !
              </div>
              <h3 className="text-lg font-semibold text-danger">需要关注</h3>
            </div>
            <div className="space-y-2">
              {missingItems.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm text-text-primary">
                  <span className="text-danger">•</span>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-text-tertiary">— {item.detail}</span>
                </div>
              ))}
            </div>
          </Card>
        )
      })()}

      {/* All passed message */}
      {mockStudentAudit.flatMap((s) => s.items).every((item) => item.status === 'pass') && (
        <Card className="mb-4 border-success/20 bg-success-light/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-white">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16.7 5L7.5 14.2L3.3 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-success">恭喜！所有审查项目均已通过</div>
              <div className="text-sm text-text-secondary">您已满足毕业和学位授予的所有条件</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
