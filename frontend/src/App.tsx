import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminCompetitions from './pages/AdminCompetitions'
import AdminCompetitionDetail from './pages/AdminCompetitionDetail'
import AdminUsers from './pages/AdminUsers'
import AdminStats from './pages/AdminStats'
import AdminNotices from './pages/AdminNotices'
import TeacherDashboard from './pages/TeacherDashboard'
import TeacherCompetitions from './pages/TeacherCompetitions'
import TeacherCompetitionCreate from './pages/TeacherCompetitionCreate'
import TeacherCompetitionDetail from './pages/TeacherCompetitionDetail'
import TeacherTeams from './pages/TeacherTeams'
import TeacherGrades from './pages/TeacherGrades'
import StudentDashboard from './pages/StudentDashboard'
import StudentCompetitions from './pages/StudentCompetitions'
import StudentCompetitionDetail from './pages/StudentCompetitionDetail'
import StudentTeams from './pages/StudentTeams'
import StudentHistory from './pages/StudentHistory'
import TeamDetail from './pages/TeamDetail'
import UserProfilePage from './pages/UserProfilePage'
import NotificationCenter from './pages/NotificationCenter'
import ProfilePage from './pages/ProfilePage'
import DesktopLayout from './components/DesktopLayout'
import AuthGuard from './components/AuthGuard'
import { ToastContainer } from './components/Toast'
import { ConfirmContainer } from './components/ConfirmDialog'
import { PromptContainer } from './components/PromptDialog'
import { EditGradeContainer } from './components/EditGradeDialog'

function DashboardLayout() {
  return (
    <DesktopLayout>
      <Outlet />
    </DesktopLayout>
  )
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('全局错误边界捕获:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100dvh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '16px',
          background: 'var(--bg-primary, #f5f5f7)', color: 'var(--text-primary)',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>页面出现了意外错误</div>
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', maxWidth: '400px', textAlign: 'center' }}>
            {this.state.error?.message || '未知错误'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 24px', borderRadius: '10px', border: 'none',
              background: '#007AFF', color: '#fff', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer',
            }}
          >
            刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <GlobalErrorBoundary>
    <div style={{ height: '100dvh', overflow: 'hidden' }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
          {/* Common routes */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AuthGuard allowedRoles={['admin']}><AdminDashboard /></AuthGuard>} />
          <Route path="/admin/competitions" element={<AuthGuard allowedRoles={['admin']}><AdminCompetitions /></AuthGuard>} />
          <Route path="/admin/teams" element={<Navigate replace to="/admin/competitions?tab=teams" />} />
          <Route path="/admin/grades" element={<Navigate replace to="/admin/competitions?tab=grades" />} />
          <Route path="/admin/users" element={<AuthGuard allowedRoles={['admin']}><AdminUsers /></AuthGuard>} />
          <Route path="/admin/stats" element={<AuthGuard allowedRoles={['admin']}><AdminStats /></AuthGuard>} />
          <Route path="/admin/notices" element={<AuthGuard allowedRoles={['admin']}><AdminNotices /></AuthGuard>} />
          <Route path="/admin/competitions/team/:id" element={<AuthGuard allowedRoles={['admin']}><TeamDetail /></AuthGuard>} />
          <Route path="/admin/competitions/:id" element={<AuthGuard allowedRoles={['admin']}><AdminCompetitionDetail /></AuthGuard>} />
          <Route path="/admin/competitions/:id/edit" element={<AuthGuard allowedRoles={['admin']}><TeacherCompetitionCreate /></AuthGuard>} />

          {/* Teacher routes */}
          <Route path="/teacher/dashboard" element={<AuthGuard allowedRoles={['teacher']}><TeacherDashboard /></AuthGuard>} />
          <Route path="/teacher/competitions" element={<AuthGuard allowedRoles={['teacher']}><TeacherCompetitions /></AuthGuard>} />
          <Route path="/teacher/competitions/create" element={<AuthGuard allowedRoles={['teacher']}><TeacherCompetitionCreate /></AuthGuard>} />
          <Route path="/teacher/competitions/:id" element={<AuthGuard allowedRoles={['teacher']}><TeacherCompetitionDetail /></AuthGuard>} />
          <Route path="/teacher/competitions/:id/edit" element={<AuthGuard allowedRoles={['teacher']}><TeacherCompetitionCreate /></AuthGuard>} />
          <Route path="/teacher/teams" element={<AuthGuard allowedRoles={['teacher']}><TeacherTeams /></AuthGuard>} />
          <Route path="/teacher/teams/detail/:id" element={<AuthGuard allowedRoles={['teacher']}><TeamDetail /></AuthGuard>} />
          <Route path="/teacher/grades" element={<AuthGuard allowedRoles={['teacher']}><TeacherGrades /></AuthGuard>} />

          {/* Student routes */}
          <Route path="/student/dashboard" element={<AuthGuard allowedRoles={['student']}><StudentDashboard /></AuthGuard>} />
          <Route path="/student/competitions/:id" element={<AuthGuard allowedRoles={['student']}><StudentCompetitionDetail /></AuthGuard>} />
          <Route path="/student/competitions" element={<AuthGuard allowedRoles={['student']}><StudentCompetitions /></AuthGuard>} />
          <Route path="/student/recruit" element={<Navigate replace to="/student/teams?tab=recruit" />} />
          <Route path="/student/grades" element={<Navigate replace to="/student/history?tab=transcript" />} />
          <Route path="/student/teams" element={<AuthGuard allowedRoles={['student']}><StudentTeams /></AuthGuard>} />
          <Route path="/student/teams/detail/:id" element={<AuthGuard allowedRoles={['student']}><TeamDetail /></AuthGuard>} />
          <Route path="/student/history" element={<AuthGuard allowedRoles={['student']}><StudentHistory /></AuthGuard>} />
          <Route path="/student/notifications" element={<AuthGuard allowedRoles={['student']}><NotificationCenter /></AuthGuard>} />
          <Route path="/student/u/:id" element={<AuthGuard allowedRoles={['student', 'teacher', 'admin']}><UserProfilePage /></AuthGuard>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Global overlays */}
      <ToastContainer />
      <ConfirmContainer />
      <PromptContainer />
      <EditGradeContainer />
    </div>
    </GlobalErrorBoundary>
  )
}

export default App
