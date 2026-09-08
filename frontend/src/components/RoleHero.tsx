import { motion } from 'motion/react'
import { useAuthStore } from '../store/authStore'

type Role = 'admin' | 'teacher' | 'student'

const ROLE_LABEL: Record<Role, string> = {
  student: '学生端',
  teacher: '教师端',
  admin: '管理员端',
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

/** 概览页顶部的角色标识：一行彩色文字，简洁标识当前登录的是哪一个端 */
export default function RoleHero() {
  const user = useAuthStore((s) => s.user)
  const role = (user?.role as Role) || 'student'
  const label = ROLE_LABEL[role] ?? '学生端'

  return (
    <motion.div
      className={`role-hero role-hero-${role}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <span className="role-hero-role">{label}</span>
      <span className="role-hero-title">{greeting()}，{user?.realName || '欢迎回来'}</span>
    </motion.div>
  )
}
