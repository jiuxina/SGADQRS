import { type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  GraduationCap,
  BookOpen,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react'

interface SidebarLayoutProps {
  children: ReactNode
  variant?: 'admin' | 'teacher'
}

export default function SidebarLayout({ children, variant = 'admin' }: SidebarLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const adminNav = [
    { section: '概览', items: [
      { id: 'dashboard', label: '竞赛总览', icon: LayoutDashboard, path: '/admin/dashboard' },
    ]},
    { section: '管理', items: [
      { id: 'students', label: '赛事管理', icon: Users, path: '/admin/dashboard' },
      { id: 'audit', label: '参赛审查', icon: ClipboardCheck, path: '/student/audit' },
    ]},
    { section: '工具', items: [
      { id: 'teacher', label: '指导端', icon: GraduationCap, path: '/teacher/dashboard' },
      { id: 'settings', label: '系统设置', icon: Settings, path: '/admin/dashboard' },
    ]},
  ]

  const teacherNav = [
    { section: '概览', items: [
      { id: 'dashboard', label: '队伍总览', icon: LayoutDashboard, path: '/teacher/dashboard' },
    ]},
    { section: '工作', items: [
      { id: 'warnings', label: '预警队伍', icon: BookOpen, path: '/teacher/dashboard' },
      { id: 'audit', label: '参赛审查', icon: ClipboardCheck, path: '/student/audit' },
    ]},
    { section: '其他', items: [
      { id: 'admin', label: '管理端', icon: Settings, path: '/admin/dashboard' },
    ]},
  ]

  const nav = variant === 'admin' ? adminNav : teacherNav

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <div className="app-sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <GraduationCap size={20} color="white" />
            </div>
            <div className="sidebar-logo-text">竞赛管理系统</div>
          </div>
          <div className="sidebar-subtitle">
            {variant === 'admin' ? '管理控制台' : '教师工作台'}
          </div>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          {nav.map((section) => (
            <div key={section.section} style={{ marginBottom: '8px' }}>
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.id}
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="sidebar-item-icon">
                      <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                    </span>
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {variant === 'admin' ? '管' : '师'}
            </div>
            <div>
              <div className="sidebar-user-name">
                {variant === 'admin' ? '管理员' : '张老师'}
              </div>
              <div className="sidebar-user-role">
                {variant === 'admin' ? '教务处' : '计算机学院'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="app-main">
        {/* Top Bar */}
        <div className="topbar">
          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: 'var(--gray-1)',
            position: 'relative',
            borderRadius: '8px',
            transition: 'background 0.2s ease',
          }}>
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--danger)',
              border: '2px solid var(--bg-topbar)',
            }} />
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/login')}
            style={{ fontSize: '13px' }}
          >
            <LogOut size={14} />
            退出
          </button>
        </div>

        {/* Page Content */}
        <div className="app-content">
          {children}
        </div>
      </div>
    </div>
  )
}
