import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})

  const validate = (): boolean => {
    const newErrors: { username?: string; password?: string } = {}
    if (!username.trim()) newErrors.username = '请输入用户名'
    if (!password.trim()) newErrors.password = '请输入密码'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      addToast('登录成功，欢迎回来！', 'success')
      setTimeout(() => navigate('/admin/dashboard'), 500)
    }, 800)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 h-80 w-80 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #0A59F7 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        {/* Logo and title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary shadow-lg">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L6 10v12l10 6 10-6V10L16 4z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              <path d="M16 16L6 10M16 16l10-6M16 16v12" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">学生毕业及学位资格审查系统</h1>
          <p className="mt-2 text-sm text-text-secondary">请使用您的账号登录系统</p>
        </div>

        {/* Login form */}
        <div className="rounded-xl border border-border-default bg-bg-secondary p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="用户名"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }))
              }}
              error={errors.username}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
            />
            <Input
              type="password"
              label="密码"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              error={errors.password}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="7" width="12" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 7V5a3 3 0 116 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
            />

            <Button type="submit" loading={loading} className="mt-2 w-full">
              登录
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-text-tertiary">
          登录即表示您同意{' '}
          <span className="text-brand-primary cursor-pointer hover:underline">隐私政策</span>{' '}
          和{' '}
          <span className="text-brand-primary cursor-pointer hover:underline">用户协议</span>
        </p>
      </div>
    </div>
  )
}
