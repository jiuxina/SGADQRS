import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminCompetitions from './pages/AdminCompetitions'
import AdminUsers from './pages/AdminUsers'
import AdminStats from './pages/AdminStats'
import AdminNotices from './pages/AdminNotices'
import AdminLogs from './pages/AdminLogs'
import AdminSettings from './pages/AdminSettings'
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
import DesktopLayout from './components/DesktopLayout'

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
        <Route element={<DashboardLayout />}>
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/competitions" element={<AdminCompetitions />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/stats" element={<AdminStats />} />
          <Route path="/admin/notices" element={<AdminNotices />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          {/* Teacher routes */}
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/competitions" element={<TeacherCompetitions />} />
          <Route path="/teacher/competitions/create" element={<TeacherCompetitionCreate />} />
          <Route path="/teacher/teams" element={<TeacherTeams />} />
          <Route path="/teacher/grades" element={<TeacherGrades />} />
          <Route path="/teacher/messages" element={<TeacherMessages />} />

          {/* Student routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/competitions" element={<StudentCompetitions />} />
          <Route path="/student/registration" element={<StudentRegistration />} />
          <Route path="/student/grades" element={<StudentGrades />} />
          <Route path="/student/messages" element={<StudentMessages />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App
