import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { mockStudents, dashboardStats } from '@/lib/mock-data'
import type { Student } from '@/lib/mock-data'

type FilterStatus = 'all' | '通过' | '未通过' | '待审核' | '待录入'

const statusVariant: Record<string, 'success' | 'danger' | 'warning' | 'pending' | 'info'> = {
  '通过': 'success',
  '未通过': 'danger',
  '待审核': 'warning',
  '待录入': 'pending',
}

export default function AdminDashboard() {
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const filteredStudents = useMemo(() => {
    return mockStudents.filter((s) => {
      const matchSearch =
        search === '' ||
        s.name.includes(search) ||
        s.studentId.includes(search) ||
        s.major.includes(search)
      const matchFilter = filter === 'all' || s.graduationStatus === filter
      return matchSearch && matchFilter
    })
  }, [search, filter])

  const handleAction = (action: string) => {
    setLoadingAction(action)
    setTimeout(() => {
      setLoadingAction(null)
      addToast(`${action}操作完成`, 'success')
    }, 1200)
  }

  const statCards = [
    { label: '待审核', value: dashboardStats.pendingReview, color: '#F59E0B', bg: '#FEF3C7' },
    { label: '已通过', value: dashboardStats.passed, color: '#10B981', bg: '#D1FAE5' },
    { label: '未通过', value: dashboardStats.failed, color: '#EF4444', bg: '#FEE2E2' },
    { label: '待录入', value: dashboardStats.pendingEntry, color: '#6B7280', bg: '#F3F4F6' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Stats */}
      <div className="stagger-children mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} hover>
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: stat.bg }}
              >
                <span className="text-lg font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </span>
              </div>
              <div>
                <div className="text-xs text-text-tertiary">{stat.label}</div>
                <div className="text-xl font-semibold text-text-primary">{stat.value} 人</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          loading={loadingAction === '试审核'}
          onClick={() => handleAction('试审核')}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
        >
          试审核
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={loadingAction === '正式审核'}
          onClick={() => handleAction('正式审核')}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          正式审核
        </Button>
        <Button
          variant="secondary"
          size="sm"
          loading={loadingAction === '导出'}
          onClick={() => handleAction('导出')}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3M8 2v9M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          导出
        </Button>
      </div>

      {/* Student list */}
      <Card padding="none">
        {/* List header */}
        <div className="flex flex-col gap-3 border-b border-border-default p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-text-primary">学生审查列表</h2>
          <div className="flex gap-2">
            <Input
              placeholder="搜索姓名、学号、专业..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-48 text-xs"
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-border-default px-4 pt-2">
          {(['all', '通过', '未通过', '待审核', '待录入'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-t-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
                filter === status
                  ? 'border-b-2 border-brand-primary text-brand-primary bg-bg-emphasize'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              {status === 'all' ? '全部' : status}
              {status !== 'all' && (
                <span className="ml-1 text-text-tertiary">
                  ({mockStudents.filter((s) => s.graduationStatus === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default text-left text-xs font-medium text-text-tertiary">
                <th className="px-4 py-3">学生</th>
                <th className="px-4 py-3">学号</th>
                <th className="px-4 py-3">专业/班级</th>
                <th className="px-4 py-3">GPA</th>
                <th className="px-4 py-3">学分</th>
                <th className="px-4 py-3">毕业审查</th>
                <th className="px-4 py-3">学位审查</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, i) => (
                <tr
                  key={student.id}
                  className="border-b border-border-default transition-colors last:border-0 hover:bg-bg-tertiary/50"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: student.avatarColor }}
                      >
                        {student.name.slice(-1)}
                      </div>
                      <span className="font-medium text-text-primary">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary font-mono">{student.studentId}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-text-primary">{student.major}</div>
                    <div className="text-xs text-text-tertiary">{student.className}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${student.gpa >= 3.0 ? 'text-success' : student.gpa >= 2.0 ? 'text-warning' : 'text-danger'}`}>
                      {student.gpa.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {student.credits}/{student.requiredCredits}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[student.graduationStatus]} dot>
                      {student.graduationStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[student.degreeStatus]} dot>
                      {student.degreeStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card list - Mobile */}
        <div className="divide-y divide-border-default md:hidden">
          {filteredStudents.map((student) => (
            <div key={student.id} className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white shrink-0"
                  style={{ backgroundColor: student.avatarColor }}
                >
                  {student.name.slice(-1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">{student.name}</span>
                    <span className="text-xs text-text-tertiary font-mono">{student.studentId}</span>
                  </div>
                  <div className="mt-1 text-xs text-text-secondary">{student.major} · {student.className}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={statusVariant[student.graduationStatus]} dot>
                      毕业: {student.graduationStatus}
                    </Badge>
                    <Badge variant={statusVariant[student.degreeStatus]} dot>
                      学位: {student.degreeStatus}
                    </Badge>
                  </div>
                  {student.alerts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {student.alerts.map((alert) => (
                        <span key={alert} className="text-xs text-danger bg-danger-light rounded-full px-2 py-0.5">
                          {alert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-3 opacity-50">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
              <path d="M18 24h12M24 18v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm">没有找到匹配的学生记录</p>
          </div>
        )}
      </Card>
    </div>
  )
}
