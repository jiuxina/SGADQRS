import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

interface Props {
  /** 错误兜底的返回动作（通常是跳回本端概览页） */
  onBack?: () => void
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * 页面级错误边界：某个页面渲染崩溃时保留侧边栏/顶栏，
 * 只在内容区显示兜底 UI，避免整站白屏。
 * 用法：<PageErrorBoundary key={location.pathname} onBack={...}>（key 换路由自动复位）
 */
export default class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('页面错误边界捕获:', error, info)
  }

  private reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '24px',
      }}>
        <AlertTriangle size={36} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
        <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
          页面加载出了点问题
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: '380px' }}>
          {this.state.error?.message || '渲染时发生意外错误，请重试或返回概览页。'}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            className="btn ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={this.reset}
          >
            <RotateCcw size={14} strokeWidth={1.8} />
            重试
          </button>
          {this.props.onBack && (
            <button
              className="btn primary filled-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={this.props.onBack}
            >
              <Home size={14} strokeWidth={1.8} />
              返回概览
            </button>
          )}
        </div>
      </div>
    )
  }
}
