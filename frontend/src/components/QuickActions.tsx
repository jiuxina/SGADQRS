import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'

export interface QuickAction {
  label: string
  icon: LucideIcon
  path: string
}

interface QuickActionsProps {
  items: QuickAction[]
  /** grid: 两列网格填充宽卡;默认纵向列表 */
  layout?: 'list' | 'grid'
}

export default function QuickActions({ items, layout = 'list' }: QuickActionsProps) {
  const navigate = useNavigate()
  if (layout === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {items.map((action) => (
          <div
            key={action.label}
            className="bento-action"
            onClick={() => navigate(action.path)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', cursor: 'pointer', borderRadius: '10px', border: 'none', background: 'rgba(0,0,0,0.025)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,122,255,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.025)')}
          >
            <action.icon size={14} color="var(--text-secondary)" strokeWidth={1.5} />
            <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-primary)' }}>{action.label}</span>
            <ArrowUpRight size={12} color="var(--text-tertiary)" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <>
      {items.map((action) => (
        <div
          key={action.label}
          className="bento-action"
          onClick={() => navigate(action.path)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer' }}
        >
          <action.icon size={14} color="var(--text-secondary)" strokeWidth={1.5} />
          <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-primary)' }}>{action.label}</span>
          <ArrowUpRight size={12} color="var(--text-tertiary)" />
        </div>
      ))}
    </>
  )
}
