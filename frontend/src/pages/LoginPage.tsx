import { useState, useRef, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { env } from '../config/env'
import { toast } from '../components/toastUtils'

type Role = 'admin' | 'teacher' | 'student'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const parallaxRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!parallaxRef.current) return
    const rect = parallaxRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    parallaxRef.current.style.setProperty('--px', `${-x * 30}px`)
    parallaxRef.current.style.setProperty('--py', `${-y * 20}px`)
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setErrorMsg('请输入账号和密码')
      return
    }
    setIsLoading(true)
    setErrorMsg('')
    try {
      await login(username, password, role)
      if (role === 'admin') navigate('/admin/dashboard')
      else if (role === 'teacher') navigate('/teacher/dashboard')
      else navigate('/student/dashboard')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '登录失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-desktop">
      <div className="page-bg" />

      {/* Left panel — Full-bleed trophy + parallax + skewed text */}
      <div
        className="login-left login-parallax"
        ref={parallaxRef}
        onMouseMove={handleMouseMove}
      >
        {/* Full-bleed image (oversized for parallax headroom) */}
        <img
          src="/images/trophy-glass-1.png"
          alt=""
          className="login-bg-img"
          draggable={false}
        />

        {/* Layered gradient overlays */}
        <div className="login-left-overlay" />
        <div className="login-left-vignette" />

        {/* Decorative lines */}
        <div className="login-deco-lines">
          <span /><span /><span />
        </div>

        {/* Skewed text block — radial diagonal clip from center */}
        <div className="login-skew-block anim-up d1">
          <div className="login-skew-label">TEAMUP</div>
          <h1 className="login-title-skew">
            <span className="cut-ul">赛</span>
            <span className="cut-ur">友</span>
          </h1>
          <h1 className="login-title-skew login-title-line2">
            <span className="cut-l">组</span>
            <span className="cut-ul">队</span>
            <span className="cut-ur">社</span>
            <span className="cut-r">区</span>
          </h1>
          <p className="login-subtitle-skew">
            TeamUp · 找队友、看战绩、一起打比赛
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="login-right">
        <form onSubmit={handleSubmit} className="login-form-card anim-up d2">
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', textAlign: 'center' }}>
            登录
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>
            请选择身份并输入账号密码
          </div>

          {/* Role Switcher */}
          <div className="role-switcher">
            {(['admin', 'teacher', 'student'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                className={`role-btn ${role === r ? 'active' : ''}`}
                onClick={() => setRole(r)}
              >
                {r === 'admin' ? '管理员' : r === 'teacher' ? '教师' : '学生'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                账号
              </label>
              <input
                type="text"
                placeholder="请输入学号或工号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                密码
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="icon-btn"
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
                记住账号
              </label>
              <button type="button" onClick={() => toast.info('请联系管理员重置密码')} className="icon-btn" style={{ color: 'var(--accent)', fontFamily: 'inherit', fontSize: '13px' }}>
                忘记密码？
              </button>
            </div>

            <button
              type="submit"
              className="btn filled-primary"
              style={{ width: '100%', height: '44px', fontSize: '15px', marginTop: '4px' }}
              disabled={isLoading}
            >
              {isLoading ? '验证中...' : '登录'}
            </button>
          </div>

          <AnimatePresence>
            {errorMsg && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, x: [0, -8, 8, -8, 8, 0] }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ textAlign: 'center', fontSize: '12px', color: '#ef4444', margin: '12px 0 0' }}
              >
                {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>
          {env.isDev && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
              开发环境：请查阅 README 获取测试账号
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
