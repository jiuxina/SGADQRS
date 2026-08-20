import { env } from '../config/env'

/**
 * 日期格式化
 * @param dateStr ISO 日期字符串
 * @returns 格式化后的日期字符串 (YYYY-MM-DD)，无效输入返回 '-'
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 解析封面图片 URL
 * @param url 原始 URL（可能是相对路径或绝对路径）
 * @returns 完整的图片 URL，无图片返回 null
 */
export function resolveCoverUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads') || url.startsWith('/public')) return `${env.apiBaseUrl}${url}`
  return url
}

/**
 * 文件大小格式化
 * @param bytes 字节数
 * @returns 人类可读的文件大小字符串
 */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
