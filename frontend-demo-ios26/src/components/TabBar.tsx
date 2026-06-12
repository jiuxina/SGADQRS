import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Settings,
  GraduationCap,
  BookOpen,
} from 'lucide-react'

type TabItem = {
  id: string
  label: string
  icon: typeof LayoutDashboard
  path: string
}

interface TabBarProps {
  variant?: 'admin' | 'teacher'
}

export default function TabBar({ variant = 'admin' }: TabBarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const adminTabs: TabItem[] = [
    { id: 'dashboard', label: '总览', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'teams', label: '队伍', icon: Users, path: '/admin/dashboard' },
    { id: 'audit', label: '审查', icon: ClipboardCheck, path: '/student/audit' },
    { id: 'settings', label: '设置', icon: Settings, path: '/admin/dashboard' },
  ]

  const teacherTabs: TabItem[] = [
    { id: 'overview', label: '队伍', icon: GraduationCap, path: '/teacher/dashboard' },
    { id: 'warnings', label: '预警', icon: BookOpen, path: '/teacher/dashboard' },
    { id: 'audit', label: '审查', icon: ClipboardCheck, path: '/student/audit' },
    { id: 'settings', label: '设置', icon: Settings, path: '/teacher/dashboard' },
  ]

  const tabs = variant === 'admin' ? adminTabs : teacherTabs

  return (
    <div className="ios-tab-bar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px' }}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path && (
            tab.id === 'dashboard' || tab.id === 'overview' ? true :
            tab.id === 'students' || tab.id === 'warnings' ? location.pathname.includes('dashboard') : true
          )
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.2 : 1.5}
                style={{
                  color: isActive ? 'var(--accent)' : 'var(--gray-1)',
                  transition: 'color 0.2s',
                }}
              />
              <span
                style={{
                  fontSize: '10px',
                  color: isActive ? 'var(--accent)' : 'var(--gray-1)',
                  fontWeight: isActive ? 500 : 400,
                  transition: 'color 0.2s',
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
