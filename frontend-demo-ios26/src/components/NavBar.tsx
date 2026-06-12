import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface NavBarProps {
  title: string
  subtitle?: string
  showBack?: boolean
  rightContent?: ReactNode
}

export default function NavBar({ title, subtitle, showBack = false, rightContent }: NavBarProps) {
  const navigate = useNavigate()

  return (
    <div className="ios-nav-bar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '17px',
                fontFamily: 'inherit',
              }}
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
              <span>返回</span>
            </button>
          )}
          {!showBack && (
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.38px' }}>{title}</h1>
              {subtitle && (
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '1px 0 0' }}>{subtitle}</p>
              )}
            </div>
          )}
          {showBack && !subtitle && (
            <h1 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.41px' }}>{title}</h1>
          )}
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
    </div>
  )
}
