import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, ClipboardCheck, BarChart3, Settings } from 'lucide-react'

const tabs = [
  { id: 'home', label: '首页', icon: Home, path: '/admin/dashboard' },
  { id: 'students', label: '学生', icon: Users, path: '/teacher/dashboard' },
  { id: 'reviews', label: '审核', icon: ClipboardCheck, path: '/student/audit' },
  { id: 'reports', label: '报告', icon: BarChart3, path: '/admin/dashboard' },
  { id: 'settings', label: '设置', icon: Settings, path: '/admin/dashboard' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="ios-tab-bar">
      {tabs.map((tab) => {
        const active = tab.id === 'home' && location.pathname === '/admin/dashboard'
          || tab.id === 'students' && location.pathname === '/teacher/dashboard'
          || tab.id === 'reviews' && location.pathname === '/student/audit'
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            className={`tab-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <Icon strokeWidth={active ? 2.2 : 1.5} />
            <span>{tab.label}</span>
            {tab.id === 'reviews' && (
              <div className="tab-badge">3</div>
            )}
          </button>
        )
      })}
    </nav>
  )
}
