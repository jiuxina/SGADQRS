import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminCompetitions from './pages/AdminCompetitions'
import AdminUsers from './pages/AdminUsers'
import AdminStats from './pages/AdminStats'
import AdminNotices from './pages/AdminNotices'
import AdminLogs from './pages/AdminLogs'
import AdminSettings from './pages/AdminSettings'
import AdminOrgTree from './pages/AdminOrgTree'
import TeacherDashboard from './pages/TeacherDashboard'
import TeacherCompetitions from './pages/TeacherCompetitions'
import TeacherCompetitionCreate from './pages/TeacherCompetitionCreate'
import TeacherTeams from './pages/TeacherTeams'
import TeacherGrades from './pages/TeacherGrades'
import TeacherMessages from './pages/TeacherMessages'
import StudentDashboard from './pages/StudentDashboard'
import StudentCompetitions from './pages/StudentCompetitions'
import StudentRegistration from './pages/StudentRegistration'
import StudentGrades from './pages/StudentGrades'
import StudentMessages from './pages/StudentMessages'
import StudentAudit from './pages/StudentAudit'
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

function App() {
  return (
    <div style={{ height: '100dvh', overflow: 'hidden' }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
          {/* Common routes */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AuthGuard allowedRoles={['admin']}><AdminDashboard /></AuthGuard>} />
          <Route path="/admin/competitions" element={<AuthGuard allowedRoles={['admin']}><AdminCompetitions /></AuthGuard>} />
          <Route path="/admin/users" element={<AuthGuard allowedRoles={['admin']}><AdminUsers /></AuthGuard>} />
          <Route path="/admin/stats" element={<AuthGuard allowedRoles={['admin']}><AdminStats /></AuthGuard>} />
          <Route path="/admin/notices" element={<AuthGuard allowedRoles={['admin']}><AdminNotices /></AuthGuard>} />
          <Route path="/admin/logs" element={<AuthGuard allowedRoles={['admin']}><AdminLogs /></AuthGuard>} />
          <Route path="/admin/settings" element={<AuthGuard allowedRoles={['admin']}><AdminSettings /></AuthGuard>} />
          <Route path="/admin/org-tree" element={<AuthGuard allowedRoles={['admin']}><AdminOrgTree /></AuthGuard>} />

          {/* Teacher routes */}
          <Route path="/teacher/dashboard" element={<AuthGuard allowedRoles={['teacher']}><TeacherDashboard /></AuthGuard>} />
          <Route path="/teacher/competitions" element={<AuthGuard allowedRoles={['teacher']}><TeacherCompetitions /></AuthGuard>} />
          <Route path="/teacher/competitions/create" element={<AuthGuard allowedRoles={['teacher']}><TeacherCompetitionCreate /></AuthGuard>} />
          <Route path="/teacher/teams" element={<AuthGuard allowedRoles={['teacher']}><TeacherTeams /></AuthGuard>} />
          <Route path="/teacher/grades" element={<AuthGuard allowedRoles={['teacher']}><TeacherGrades /></AuthGuard>} />
          <Route path="/teacher/messages" element={<AuthGuard allowedRoles={['teacher']}><TeacherMessages /></AuthGuard>} />

          {/* Student routes */}
          <Route path="/student/dashboard" element={<AuthGuard allowedRoles={['student']}><StudentDashboard /></AuthGuard>} />
          <Route path="/student/competitions" element={<AuthGuard allowedRoles={['student']}><StudentCompetitions /></AuthGuard>} />
          <Route path="/student/registration" element={<AuthGuard allowedRoles={['student']}><StudentRegistration /></AuthGuard>} />
          <Route path="/student/grades" element={<AuthGuard allowedRoles={['student']}><StudentGrades /></AuthGuard>} />
          <Route path="/student/messages" element={<AuthGuard allowedRoles={['student']}><StudentMessages /></AuthGuard>} />
          <Route path="/student/audit" element={<AuthGuard allowedRoles={['student']}><StudentAudit /></AuthGuard>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Global overlays */}
      <ToastContainer />
      <ConfirmContainer />
      <PromptContainer />
      <EditGradeContainer />
    </div>
  )
}

export default App
