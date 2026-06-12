import { useState, useRef, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
} from 'lucide-react'

type Role = 'admin' | 'teacher' | 'student'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('admin')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const parallaxRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!parallaxRef.current) return
    const rect = parallaxRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    parallaxRef.current.style.setProperty('--px', `${-x * 30}px`)
    parallaxRef.current.style.setProperty('--py', `${-y * 20}px`)
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      if (role === 'admin') navigate('/admin/dashboard')
      else if (role === 'teacher') navigate('/teacher/dashboard')
      else navigate('/student/dashboard')
    }, 600)
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
          <div className="login-skew-label">SCMS</div>
          <h1 className="login-title-skew">
            <span className="cut-ul">学</span>
            <span className="cut-top">生</span>
            <span className="cut-top">竞</span>
            <span className="cut-ur">赛</span>
          </h1>
          <h1 className="login-title-skew login-title-line2">
            <span className="cut-l">信</span>
            <span className="cut-ul">息</span>
            <span className="cut-ur">管</span>
            <span className="cut-r">理</span>
            <span className="cut-r">系</span>
            <span className="cut-r">统</span>
          </h1>
          <p className="login-subtitle-skew">
            Student Competition Information Management System
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="login-right">
        <form onSubmit={handleSubmit} className="login-form-card anim-up d2">
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', textAlign: 'center' }}>
            登录
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    color: 'var(--text-tertiary)',
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
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
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

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)', margin: '20px 0 0' }}>
            演示模式：任意账号密码即可登录
          </p>
        </form>
      </div>
    </div>
  )
}
