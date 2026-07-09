import { type LucideIcon, Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  text: string
}

export default function EmptyState({ icon: Icon = Inbox, text }: EmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 20px',
      color: 'var(--text-tertiary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
    }}>
      <Icon size={36} strokeWidth={1.2} style={{ opacity: 0.4 }} />
      <span style={{ fontSize: '14px' }}>{text}</span>
    </div>
  )
}
