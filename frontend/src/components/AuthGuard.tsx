import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ROLE_HOME } from '../config/constants'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // 用户没有权限访问该页面，重定向到对应角色的首页
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
  }

  return <>{children}</>
}
