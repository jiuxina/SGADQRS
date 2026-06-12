import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import { MainLayout } from '@/components/layout/main-layout'
import LoginPage from '@/pages/login'
import AdminDashboard from '@/pages/admin-dashboard'
import StudentAuditPage from '@/pages/student-audit'
import TeacherDashboard from '@/pages/teacher-dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={<MainLayout title="审查管理" subtitle="2025届毕业审查" />}
          >
            <Route index element={<AdminDashboard />} />
          </Route>

          {/* Student routes */}
          <Route
            path="/student/audit"
            element={<MainLayout title="审查结果" subtitle="我的毕业及学位审查" />}
          >
            <Route index element={<StudentAuditPage />} />
          </Route>

          {/* Teacher routes */}
          <Route
            path="/teacher/dashboard"
            element={<MainLayout title="预警看板" subtitle="学生毕业预警管理" />}
          >
            <Route index element={<TeacherDashboard />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
