import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import { toast } from '../components/toastUtils'
import { STORAGE_KEYS } from '../config/constants'

/** 通知消息结构 — 与后端 WebSocketNotification 对应 */
export interface WebSocketNotification {
  type: 'message' | 'audit' | 'grade' | 'notice'
  title: string
  content: string
  data?: Record<string, unknown>
}

/** 通知回调函数类型 */
type NotificationCallback = (notification: WebSocketNotification) => void

/**
 * WebSocket 实时通知 Hook
 *
 * 基于 STOMP 协议，通过 SockJS 降级兼容不支持 WebSocket 的环境。
 * 连接成功后订阅用户私有通知队列，收到消息时弹出 toast 并触发回调。
 *
 * @param onNotification 收到通知时的额外回调（如刷新数据），可选
 *
 * @example
 * ```tsx
 * useWebSocket((notification) => {
 *   if (notification.type === 'message') {
 *     refreshMessages()
 *   }
 * })
 * ```
 */
export function useWebSocket(onNotification?: NotificationCallback) {
  const clientRef = useRef<Client | null>(null)
  const onNotificationRef = useRef(onNotification)

  // 保持回调引用最新，避免闭包过期
  useEffect(() => {
    onNotificationRef.current = onNotification
  }, [onNotification])

  /** 根据通知类型显示对应样式的 toast */
  const showToast = useCallback((notification: WebSocketNotification) => {
    const prefix = getToastPrefix(notification.type)
    const message = notification.content
      ? `${notification.title}: ${notification.content}`
      : notification.title

    switch (notification.type) {
      case 'message':
        toast.info(`${prefix} ${message}`)
        break
      case 'audit':
        toast.success(`${prefix} ${message}`)
        break
      case 'grade':
        toast.success(`${prefix} ${message}`)
        break
      case 'notice':
        toast.info(`${prefix} ${message}`)
        break
      default:
        toast.info(message)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (!token) return

    // 构建 WebSocket URL — 开发环境通过 Vite proxy，生产环境直连
    const wsUrl = buildWsUrl()

    const client = new Client({
      // SockJS 工厂函数
      webSocketFactory: () => new SockJS(wsUrl),

      // STOMP CONNECT 帧携带 JWT token
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      // 心跳配置（ms）— 服务端到客户端, 客户端到服务端
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      // 重连延迟（ms）— 指数退避，最大 30 秒
      reconnectDelay: 3000,

      // 连接成功回调
      onConnect: () => {
        // 订阅用户私有通知队列
        client.subscribe('/user/queue/notifications', (message) => {
          try {
            const notification: WebSocketNotification = JSON.parse(message.body)
            showToast(notification)
            onNotificationRef.current?.(notification)
          } catch {
            // 解析失败静默忽略
          }
        })
      },

      // 连接错误回调
      onStompError: (frame) => {
        console.warn('[WebSocket] STOMP error:', frame.headers['message'])
      },

      // 断开连接回调
      onDisconnect: () => {
        // 断开后由 reconnectDelay 自动重连
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [showToast])

  return {
    /** 手动断开连接 */
    disconnect: useCallback(() => {
      clientRef.current?.deactivate()
    }, []),

    /** 手动重连 */
    reconnect: useCallback(() => {
      clientRef.current?.activate()
    }, []),

    /** 当前是否已连接 */
    isConnected: useCallback(() => {
      return clientRef.current?.connected ?? false
    }, []),
  }
}

/** 构建 WebSocket 连接 URL */
function buildWsUrl(): string {
  // 开发环境: Vite proxy 将 /api/ws 转发到后端 (context-path=/api)
  // 生产环境: 从 API 地址推导
  if (import.meta.env.DEV) {
    return `${window.location.origin}/api/ws`
  }

  // 生产环境: 从 API base URL 推导 WS URL
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  return apiBase.replace(/\/api\/?$/, '') + '/api/ws'
}

/** 获取通知类型对应的 toast 前缀图标 */
function getToastPrefix(type: WebSocketNotification['type']): string {
  switch (type) {
    case 'message':
      return '[新消息]'
    case 'audit':
      return '[审核结果]'
    case 'grade':
      return '[成绩发布]'
    case 'notice':
      return '[新公告]'
    default:
      return ''
  }
}
