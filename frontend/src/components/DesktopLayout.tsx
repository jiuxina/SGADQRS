import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  LayoutDashboard,
  Trophy,
  ClipboardCheck,
  BarChart3,
  Settings,
  Bell,
  Search,
  LogOut,
  Compass,
  FileText,
  Medal,
  Users,
  ScrollText,
  Megaphone,
  Plus,
} from 'lucide-react'
import { useGlassShimmerContainer } from '../hooks/useAnimations'
import { useAuthStore } from '../store/authStore'

interface DesktopLayoutProps {
  children?: ReactNode
  title?: string
}

interface NavItem {
  id: string
  label: string
  icon: typeof LayoutDashboard
  path: string
  badge?: number
}

function getRoleFromPath(pathname: string): 'admin' | 'teacher' | 'student' {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/teacher')) return 'teacher'
  return 'student'
}

const navItemsByRole: Record<string, NavItem[]> = {
  admin: [
    { id: 'dashboard', label: '系统总览', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'competitions', label: '竞赛审核', icon: ClipboardCheck, path: '/admin/competitions', badge: 3 },
    { id: 'users', label: '用户管理', icon: Users, path: '/admin/users' },
    { id: 'stats', label: '数据统计', icon: BarChart3, path: '/admin/stats' },
    { id: 'notices', label: '公告管理', icon: Megaphone, path: '/admin/notices' },
    { id: 'logs', label: '系统日志', icon: ScrollText, path: '/admin/logs' },
    { id: 'settings', label: '系统设置', icon: Settings, path: '/admin/settings' },
  ],
  teacher: [
    { id: 'dashboard', label: '赛事管理', icon: LayoutDashboard, path: '/teacher/dashboard' },
    { id: 'competitions', label: '竞赛管理', icon: Trophy, path: '/teacher/competitions' },
    { id: 'create', label: '发布竞赛', icon: Plus, path: '/teacher/competitions/create' },
    { id: 'teams', label: '团队管理', icon: Users, path: '/teacher/teams' },
    { id: 'grades', label: '成绩录入', icon: FileText, path: '/teacher/grades' },
    { id: 'messages', label: '消息通知', icon: Bell, path: '/teacher/messages', badge: 2 },
  ],
  student: [
    { id: 'dashboard', label: '竞赛总览', icon: Compass, path: '/student/dashboard' },
    { id: 'competitions', label: '竞赛浏览', icon: Trophy, path: '/student/competitions' },
    { id: 'registration', label: '我的报名', icon: FileText, path: '/student/registration' },
    { id: 'grades', label: '成绩查询', icon: Medal, path: '/student/grades' },
    { id: 'messages', label: '消息通知', icon: Bell, path: '/student/messages', badge: 3 },
  ],
}

const titleMap: Record<string, string> = {
  '/admin/dashboard': '系统总览',
  '/admin/competitions': '竞赛审核',
  '/admin/users': '用户管理',
  '/admin/stats': '数据统计',
  '/admin/notices': '公告管理',
  '/admin/logs': '系统日志',
  '/admin/settings': '系统设置',
  '/teacher/dashboard': '赛事管理',
  '/teacher/competitions': '竞赛管理',
  '/teacher/competitions/create': '发布竞赛',
  '/teacher/teams': '团队管理',
  '/teacher/grades': '成绩录入',
  '/teacher/messages': '消息通知',
  '/student/dashboard': '竞赛总览',
  '/student/competitions': '竞赛浏览',
  '/student/registration': '我的报名',
  '/student/grades': '成绩查询',
  '/student/messages': '消息通知',
}

function positionTooltip(e: React.MouseEvent<HTMLElement>) {
  const btn = e.currentTarget
  const tooltip = btn.querySelector('.sidebar-tooltip') as HTMLElement | null
  if (!tooltip) return
  const rect = btn.getBoundingClientRect()
  tooltip.style.left = `${rect.right + 14}px`
  tooltip.style.top = `${rect.top + rect.height / 2}px`
  tooltip.style.transform = 'translateY(-50%)'
}

export default function DesktopLayout({ children, title }: DesktopLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const shimmerRef = useGlassShimmerContainer()
  const { user, logout } = useAuthStore()

  const role = getRoleFromPath(location.pathname)
  const navItems = navItemsByRole[role] || navItemsByRole.student
  const activeId = navItems.find((item) => location.pathname === item.path)?.id || 'dashboard'
  const pageTitle = title || titleMap[location.pathname] || '竞赛总览'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="desktop-shell">
      <div className="page-bg" />

      {/* Sidebar — Icon Capsule */}
      <aside className="desktop-sidebar">
        <div className="sidebar-brand" />

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const active = activeId === item.id
            const Icon = item.icon
            return (
              <motion.button
                key={item.id}
                className={`sidebar-item ${active ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                onMouseEnter={positionTooltip}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                {active && (
                  <motion.div
                    className="sidebar-active-bg"
                    layoutId="sidebar-indicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon strokeWidth={active ? 2 : 1.5} />
                <div className="sidebar-tooltip">{item.label}</div>
                {item.badge && (
                  <div className="sidebar-badge">{item.badge}</div>
                )}
              </motion.button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.realName?.charAt(0) || (role === 'admin' ? '管' : role === 'teacher' ? '师' : '学')}
            </div>
          </div>
          <motion.button
            className="sidebar-item"
            onClick={handleLogout}
            onMouseEnter={positionTooltip}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            <LogOut strokeWidth={1.5} />
            <div className="sidebar-tooltip">退出登录</div>
          </motion.button>
        </div>
      </aside>

      {/* Main */}
      <main className="desktop-main">
        {/* Header */}
        <header className="desktop-header">
          <span />
          <div className="desktop-header-title">
            <AnimatePresence mode="wait">
              <motion.span
                key={pageTitle}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.7 }}
              >
                {pageTitle}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="desktop-header-actions">
            <div className="search-wrap" style={{ width: '200px' }}>
              <Search strokeWidth={1.5} />
              <input className="glass-search" placeholder="搜索..." style={{ marginBottom: 0 }} />
            </div>
            <button className="header-action-btn" title="通知">
              <Bell strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="desktop-content" ref={shimmerRef}>
          {children}
        </div>
      </main>
    </div>
  )
}
