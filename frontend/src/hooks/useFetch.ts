import { useState, useEffect, useCallback } from 'react'

/**
 * 通用异步数据获取 Hook
 * @param fetchFn 返回 Promise 的数据获取函数
 * @param immediate 是否立即执行（默认 true）
 */
export function useFetch<T>(fetchFn: () => Promise<T>, immediate = true) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    if (immediate) execute()
  }, [immediate, execute])

  return { data, loading, error, execute, setData }
}
