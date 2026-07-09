interface ListMetaProps {
  count: number
  unit?: string
  prefix?: string
}

export default function ListMeta({ count, unit = '条', prefix = '共' }: ListMetaProps) {
  return (
    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
      {prefix} {count} {unit}
    </span>
  )
}
