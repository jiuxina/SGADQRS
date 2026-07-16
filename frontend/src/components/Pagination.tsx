import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  /** 当前页码（从 1 开始） */
  current: number
  /** 总页数 */
  totalPages: number
  /** 每页条数 */
  pageSize: number
  /** 总条数 */
  total: number
  /** 页码变化回调 */
  onPageChange: (page: number) => void
  /** 每页条数变化回调 */
  onPageSizeChange: (size: number) => void
  /** 可选的每页条数选项 */
  pageSizeOptions?: number[]
}

/** 生成页码数组（带省略号） */
function getPageNumbers(current: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]

  if (current > 3) {
    pages.push('...')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < totalPages - 2) {
    pages.push('...')
  }

  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}

export default function Pagination({
  current,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: PaginationProps) {
  if (total === 0) return null

  const pages = getPageNumbers(current, totalPages)

  return (
    <div className="pagination-wrap">
      <div className="pagination-info">
        共 <strong>{total}</strong> 条，第 {current}/{totalPages} 页
      </div>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label="上一页"
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </button>

        {pages.map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={page}
              className={`pagination-btn ${page === current ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}

        <button
          className="pagination-btn"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          aria-label="下一页"
        >
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="pagination-size">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="pagination-select"
          aria-label="每页条数"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt} 条/页
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
