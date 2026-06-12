import type { ReviewStatus } from '../data/mockData'

const statusConfig: Record<ReviewStatus, { label: string; className: string }> = {
  pass: { label: '通过', className: 'badge-success' },
  fail: { label: '未通过', className: 'badge-danger' },
  pending: { label: '待审', className: 'badge-neutral' },
  reviewing: { label: '审查中', className: 'badge-warning' },
}

interface StatusBadgeProps {
  status: ReviewStatus
  className?: string
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={`badge ${config.className} ${className}`}>
      {config.label}
    </span>
  )
}
