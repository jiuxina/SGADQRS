import { useState, useRef, useCallback, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  LayoutDashboard,
  Trophy,
  ClipboardCheck,
  BarChart3,
  Bell,
  Search,
  LogOut,
  Compass,
  FileText,
  Users,
  ScrollText,
  Megaphone,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react'
import { useGlassShimmerContainer } from '../hooks/useAnimations'
import { useAuthStore } from '../store/authStore'
import { env } from '../config/env'
import { useIsMobile } from '../hooks/useIsMobile'
import PageTransition from './PageTransition'
import NotificationBell from './NotificationBell'

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
    { id: 'competitions', label: '竞赛中心', icon: ClipboardCheck, path: '/admin/competitions' },
    { id: 'users', label: '用户管理', icon: Users, path: '/admin/users' },
    { id: 'stats', label: '数据统计', icon: BarChart3, path: '/admin/stats' },
    { id: 'notices', label: '公告管理', icon: Megaphone, path: '/admin/notices' },
  ],
  teacher: [
    { id: 'dashboard', label: '工作台', icon: LayoutDashboard, path: '/teacher/dashboard' },
    { id: 'competitions', label: '竞赛管理', icon: Trophy, path: '/teacher/competitions' },
    { id: 'teams', label: '团队管理', icon: Users, path: '/teacher/teams' },
    { id: 'grades', label: '成绩录入', icon: FileText, path: '/teacher/grades' },
  ],
  student: [
    { id: 'dashboard', label: '概览', icon: Compass, path: '/student/dashboard' },
    { id: 'competitions', label: '竞赛', icon: Trophy, path: '/student/competitions' },
    { id: 'teams', label: '组队中心', icon: Users, path: '/student/teams' },
    { id: 'history', label: '参赛历史', icon: ScrollText, path: '/student/history' },
    { id: 'notifications', label: '消息中心', icon: MessageSquare, path: '/student/notifications' },
  ],
}

/* Bottom tab bar items per role (max 5) */
const mobileTabItemsByRole: Record<string, NavItem[]> = {
  admin: [
    { id: 'dashboard', label: '总览', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'competitions', label: '竞赛', icon: ClipboardCheck, path: '/admin/competitions' },
    { id: 'users', label: '用户', icon: Users, path: '/admin/users' },
    { id: 'stats', label: '统计', icon: BarChart3, path: '/admin/stats' },
  ],
  teacher: [
    { id: 'dashboard', label: '工作台', icon: LayoutDashboard, path: '/teacher/dashboard' },
    { id: 'competitions', label: '竞赛', icon: Trophy, path: '/teacher/competitions' },
    { id: 'teams', label: '团队', icon: Users, path: '/teacher/teams' },
    { id: 'grades', label: '成绩', icon: FileText, path: '/teacher/grades' },
  ],
  student: [
    { id: 'dashboard', label: '概览', icon: Compass, path: '/student/dashboard' },
    { id: 'competitions', label: '竞赛', icon: Trophy, path: '/student/competitions' },
    { id: 'teams', label: '组队', icon: Users, path: '/student/teams' },
    { id: 'history', label: '历史', icon: ScrollText, path: '/student/history' },
    { id: 'notifications', label: '消息', icon: MessageSquare, path: '/student/notifications' },
  ],
}

const titleMap: Record<string, string> = {
  '/profile': '个人中心',
  '/admin/dashboard': '系统总览',
  '/admin/competitions': '竞赛中心',
  '/admin/competitions|teams': '队伍审核',
  '/admin/competitions|grades': '成绩管理',
  '/admin/users': '用户管理',
  '/admin/stats': '数据统计',
  '/admin/notices': '公告管理',
  '/teacher/dashboard': '工作台',
  '/teacher/competitions': '竞赛管理',
  '/teacher/competitions/create': '发布竞赛',
  '/teacher/teams': '团队管理',
  '/teacher/grades': '成绩录入',
  '/student/dashboard': '概览',
  '/student/competitions': '竞赛',
  '/student/teams': '组队中心',
  '/student/teams|recruit': '招募广场',
  '/student/history': '参赛历史',
  '/student/history|transcript': '成绩单',
  '/student/notifications': '消息中心',
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

function getAvatarSrc(user: { avatar?: string | null; gender?: number | null; id?: number } | null): string {
  if (user?.avatar) {
    return user.avatar.startsWith('/uploads') ? `${env.apiBaseUrl.replace('/api', '')}${user.avatar}` : user.avatar
  }
  const gender = user?.gender || 3
  const idx = ((user?.id ?? 0) % 20) + 1
  return `/avatar/s${gender}-${idx}.webp`
}

export default function DesktopLayout({ children, title }: DesktopLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const shimmerRef = useGlassShimmerContainer()
  const { user, logout } = useAuthStore()
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const pathRole = getRoleFromPath(location.pathname)
  const role = (user?.role as 'admin' | 'teacher' | 'student') || pathRole
  const navItems = navItemsByRole[role] || navItemsByRole.student
  const mobileTabs = mobileTabItemsByRole[role] || mobileTabItemsByRole.student
  // 无匹配导航项（如 /profile、TA 的主页）时不高亮任何项，而非回退到「概览」
  const activeId = navItems.find(
    (item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  )?.id
  const activeTab = new URLSearchParams(location.search).get('tab')
  const pageTitle = title
    || (activeTab && titleMap[`${location.pathname}|${activeTab}`])
    || titleMap[location.pathname]
    || (/^\/(admin|teacher)\/competitions\/\d+$/.test(location.pathname) ? '竞赛详情' : null)
    || (/^\/(admin|teacher)\/competitions\/\d+\/edit$/.test(location.pathname) ? '编辑竞赛' : null)
    || (/^\/(student|teacher)\/teams\/detail\/\d+$|^\/admin\/competitions\/team\/\d+$/.test(location.pathname) ? '队伍详情' : null)
    || (/^\/student\/u\/\d+$/.test(location.pathname) ? 'TA 的主页' : '概览')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    const path = role === 'admin' ? '/admin/competitions' : role === 'teacher' ? '/teacher/competitions' : '/student/competitions'
    navigate(`${path}?search=${encodeURIComponent(trimmed)}`)
    setSearchQuery('')
  }, [searchQuery, role, navigate])

  /* Swipe-to-switch-tab */
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY, t: Date.now() }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStart.current.x
    const dy = touch.clientY - touchStart.current.y
    const dt = Date.now() - touchStart.current.t
    touchStart.current = null

    // Require: horizontal > 50px, horizontal > vertical * 1.5, under 600ms
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5 || dt > 600) return

    const currentIndex = mobileTabs.findIndex((t) => t.id === activeId)
    if (currentIndex === -1) return

    if (dx < 0 && currentIndex < mobileTabs.length - 1) {
      // Swipe left → next tab
      navigator.vibrate?.(10)
      navigate(mobileTabs[currentIndex + 1].path)
    } else if (dx > 0 && currentIndex > 0) {
      // Swipe right → previous tab
      navigator.vibrate?.(10)
      navigate(mobileTabs[currentIndex - 1].path)
    }
  }, [mobileTabs, activeId, navigate])

  /* =========================================
     Mobile Layout
     ========================================= */
  if (isMobile) {
    return (
      <div className="mobile-shell" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="page-bg" />

        {/* Mobile Header */}
        <header className="mobile-header">
          <button
            className="mobile-menu-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="菜单"
          >
            <Menu size={22} strokeWidth={1.8} />
          </button>
          <AnimatePresence mode="wait">
            <motion.span
              key={pageTitle}
              className="mobile-header-title"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.7 }}
            >
              {pageTitle}
            </motion.span>
          </AnimatePresence>
          <button className="mobile-menu-btn" onClick={() => role === 'student' ? navigate('/student/notifications') : navigate('/profile')} aria-label="通知">
            <Bell size={20} strokeWidth={1.8} />
          </button>
        </header>

        {/* Scrollable content */}
        <main className="mobile-content" ref={shimmerRef}>
          <PageTransition>
            {children}
          </PageTransition>
        </main>

        {/* Bottom Tab Bar */}
        <nav className="mobile-tab-bar">
          {mobileTabs.map((tab) => {
            const active = activeId === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`mobile-tab-item ${active ? 'active' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                <div className="mobile-tab-icon-wrap">
                  {active && (
                    <motion.div
                      className="mobile-tab-active-bg"
                      layoutId="mobile-tab-indicator"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.5} />
                </div>
                <span>{tab.label}</span>
                {tab.badge && (
                  <div className="mobile-tab-badge">{tab.badge}</div>
                )}
              </button>
            )
          })}
        </nav>

        {/* Drawer Overlay */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                className="mobile-drawer-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                className="mobile-drawer"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              >
                {/* Drawer Header */}
                <div className="drawer-header" onClick={() => handleNavigate('/profile')} style={{ cursor: 'pointer' }}>
                  <div className="drawer-user">
                    <div className="drawer-avatar">
                      <img
                        src={getAvatarSrc(user)}
                        alt="avatar"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarSrc(null) }}
                      />
                    </div>
                    <div>
                      <div className="drawer-user-name">{user?.realName || (role === 'admin' ? '管理员' : role === 'teacher' ? '教师' : '学生')}</div>
                      <div className="drawer-user-role">{role === 'admin' ? '管理员' : role === 'teacher' ? '教师' : '学生'}</div>
                    </div>
                  </div>
                  <button className="drawer-close-btn" onClick={(e) => { e.stopPropagation(); setDrawerOpen(false) }}>
                    <X size={20} strokeWidth={1.8} />
                  </button>
                </div>

                {/* Drawer Nav */}
                <nav className="drawer-nav">
                  {navItems.map((item) => {
                    const active = activeId === item.id
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        className={`drawer-nav-item ${active ? 'active' : ''}`}
                        onClick={() => handleNavigate(item.path)}
                      >
                        <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                        <span>{item.label}</span>
                        {item.badge && (
                          <div className="drawer-badge">{item.badge}</div>
                        )}
                      </button>
                    )
                  })}
                </nav>

                {/* Drawer Footer */}
                <div className="drawer-footer">
                  <button className="drawer-nav-item" onClick={handleLogout}>
                    <LogOut size={20} strokeWidth={1.5} />
                    <span>退出登录</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  /* =========================================
     Desktop Layout (unchanged)
     ========================================= */
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
          <motion.button
            className={`sidebar-item ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => navigate('/profile')}
            onMouseEnter={positionTooltip}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            {location.pathname === '/profile' && (
              <motion.div
                className="sidebar-active-bg"
                layoutId="sidebar-indicator"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                <img
                  src={getAvatarSrc(user)}
                  alt="avatar"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = getAvatarSrc(null) }}
                />
              </div>
            </div>
            <div className="sidebar-tooltip">个人中心</div>
          </motion.button>
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
              <input
                className="glass-search"
                placeholder="搜索竞赛..."
                style={{ marginBottom: 0 }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
            {role === 'student' ? (
              <NotificationBell />
            ) : (
              <button className="header-action-btn" title="通知" onClick={() => navigate('/profile')}>
                <Bell strokeWidth={1.5} />
              </button>
            )}
          </div>
        </header>

        {/* Scrollable content */}
        <div className="desktop-content" ref={shimmerRef}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  )
}
