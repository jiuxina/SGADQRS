/**
 * 计算距离目标时间的倒计时文本
 */
export function countdownText(dateStr: string): string {
  const now = new Date()
  const target = new Date(dateStr)
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return '已截止'
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `剩余 ${days} 天`
  if (hours > 0) return `剩余 ${hours} 小时`
  return '即将截止'
}
