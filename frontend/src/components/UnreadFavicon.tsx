import { useEffect } from 'react'
import { useNotificationStore } from '../store/notificationStore'

const FAVICON_ID = 'dynamic-favicon'
const BASE_FAVICON =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤝</text></svg>"

/** 用 canvas 画 favicon：🤝 底 + 未读数红色角标（无未读时恢复原样） */
function drawFavicon(count: number) {
  let link = document.getElementById(FAVICON_ID) as HTMLLinkElement | null
  if (!link) return
  if (count <= 0) {
    link.href = BASE_FAVICON
    return
  }
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.font = '52px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🤝', size / 2, size / 2 + 2)
  // 角标
  ctx.beginPath()
  ctx.arc(size - 12, 12, 13, 0, Math.PI * 2)
  ctx.fillStyle = '#ff3b30'
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 15px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(count > 99 ? '99+' : String(count), size - 12, 13)
  link.href = canvas.toDataURL('image/png')
}

/**
 * 全角色挂载一次：30s 轮询未读数写入全局 store（铃铛/标题共用），
 * 并把未读数画进浏览器标签页 favicon 角标。
 */
export default function UnreadFavicon() {
  const count = useNotificationStore((s) => s.count)
  const refresh = useNotificationStore((s) => s.refresh)

  useEffect(() => {
    if (!document.getElementById(FAVICON_ID)) {
      const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      const link = document.createElement('link')
      link.id = FAVICON_ID
      link.rel = 'icon'
      link.href = existing?.href || BASE_FAVICON
      document.head.appendChild(link)
      existing?.remove()
    }
    refresh()
    const timer = setInterval(refresh, 30000)
    return () => clearInterval(timer)
  }, [refresh])

  useEffect(() => {
    drawFavicon(count)
  }, [count])

  return null
}
