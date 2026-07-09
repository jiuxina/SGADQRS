import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'

export interface QuickAction {
  label: string
  icon: LucideIcon
  path: string
}

interface QuickActionsProps {
  items: QuickAction[]
}

export default function QuickActions({ items }: QuickActionsProps) {
  const navigate = useNavigate()
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
