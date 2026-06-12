import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick: () => void
  rightContent?: React.ReactNode
}

export function Header({ title, subtitle, onMenuClick, rightContent }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border-default bg-bg-secondary/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-tertiary lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {rightContent && (
          <div className="flex items-center gap-2">{rightContent}</div>
        )}
      </div>
    </header>
  )
}
