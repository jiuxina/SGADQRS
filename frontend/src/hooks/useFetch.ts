import { useState, useEffect, useCallback, startTransition } from 'react'

/**
 * 通用异步数据获取 Hook
 * @param fetchFn 返回 Promise 的数据获取函数
 * @param immediate 是否立即执行（默认 true）
 */
export function useFetch<T>(fetchFn: () => Promise<T>, immediate = true) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<string | null>(null)

  const execFetch = useCallback(async () => {
    return fetchFn()
  }, [fetchFn])

  const execute = useCallback(async () => {
    startTransition(() => setLoading(true))
    startTransition(() => setError(null))
    try {
      const result = await execFetch()
      setData(result)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      setError(msg)
      return null
    } finally {
      startTransition(() => setLoading(false))
    }
  }, [execFetch])

  useEffect(() => {
    if (immediate) {
      startTransition(() => setLoading(true))
      execFetch().then(r => setData(r)).catch(() => {}).finally(() => startTransition(() => setLoading(false)))
    }
  }, [immediate, execFetch])

  return { data, loading, error, execute, setData }
}
