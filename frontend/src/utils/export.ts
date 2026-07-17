import axios from 'axios'
import { env } from '../config/env'
import { STORAGE_KEYS } from '../config/constants'

const BASE_URL = env.apiBaseUrl

/**
 * 通用文件下载工具
 * 通过 axios 下载 blob 文件并触发浏览器下载
 */
export async function downloadFile(url: string, fileName: string): Promise<void> {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const response = await axios.get(`${BASE_URL}${url}`, {
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  const contentType = typeof response.headers['content-type'] === 'string'
    ? response.headers['content-type']
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  const blob = new Blob([response.data], { type: contentType })

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
