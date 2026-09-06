import { useState, useCallback, useMemo } from 'react'
import { PAGE_SIZE } from '../config/constants'

interface UsePaginationOptions {
  /** 初始页码，默认 1 */
  defaultPage?: number
  /** 初始每页条数，默认 PAGE_SIZE.DEFAULT */
  defaultPageSize?: number
}

interface UsePaginationReturn {
  /** 当前页码（从 1 开始） */
  current: number
  /** 每页条数 */
  pageSize: number
  /** 总条数 */
  total: number
  /** 总页数 */
  totalPages: number
  /** 设置当前页 */
  setCurrent: (page: number) => void
  /** 设置每页条数（自动回到第 1 页） */
  setPageSize: (size: number) => void
  /** 设置总条数 */
  setTotal: (total: number) => void
  /** 翻页到上一页 */
  goToPrev: () => void
  /** 翻页到下一页 */
  goToNext: () => void
  /** 是否有上一页 */
  hasPrev: boolean
  /** 是否有下一页 */
  hasNext: boolean
  /** 重置到第 1 页（用于筛选条件变化时） */
  resetPage: () => void
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { defaultPage = 1, defaultPageSize = PAGE_SIZE.DEFAULT } = options

  const [current, setCurrentRaw] = useState(defaultPage)
  const [pageSize, setPageSizeRaw] = useState(defaultPageSize)
  const [total, setTotal] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const setCurrent = useCallback(
    (page: number) => {
      setCurrentRaw(Math.max(1, Math.min(page, totalPages)))
    },
    [totalPages],
  )

  const setPageSize = useCallback((size: number) => {
    setPageSizeRaw(size)
    setCurrentRaw(1)
  }, [])

  const resetPage = useCallback(() => {
    setCurrentRaw(1)
  }, [])

  const goToPrev = useCallback(() => {
    setCurrentRaw((p) => Math.max(1, p - 1))
  }, [])

  const goToNext = useCallback(() => {
    setCurrentRaw((p) => Math.min(p + 1, totalPages))
  }, [totalPages])

  return {
    current,
    pageSize,
    total,
    totalPages,
    setCurrent,
    setPageSize,
    setTotal,
    goToPrev,
    goToNext,
    hasPrev: current > 1,
    hasNext: current < totalPages,
    resetPage,
  }
}
