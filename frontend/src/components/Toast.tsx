import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
  duration: number
}

let toastId = 0
let globalAddToast: ((type: ToastType, message: string, duration?: number) => void) | null = null

/** 全局调用方法 — 替代 alert() */
export const toast = {
  success(message: string, duration = 3000) {
    globalAddToast?.('success', message, duration)
  },
  error(message: string, duration = 4000) {
    globalAddToast?.('error', message, duration)
  },
  warning(message: string, duration = 3500) {
    globalAddToast?.('warning', message, duration)
  },
  info(message: string, duration = 3000) {
    globalAddToast?.('info', message, duration)
  },
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: { bg: 'rgba(52, 199, 89, 0.12)', border: 'rgba(52, 199, 89, 0.25)', icon: '#34C759', text: '#1a7a33' },
  error: { bg: 'rgba(255, 59, 48, 0.12)', border: 'rgba(255, 59, 48, 0.25)', icon: '#FF3B30', text: '#c41e15' },
  warning: { bg: 'rgba(255, 149, 0, 0.12)', border: 'rgba(255, 149, 0, 0.25)', icon: '#FF9500', text: '#b36d00' },
  info: { bg: 'rgba(0, 122, 255, 0.12)', border: 'rgba(0, 122, 255, 0.25)', icon: '#007AFF', text: '#0055cc' },
}

/** Toast 容器 — 需挂载在 App 根部 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, type, message, duration }])
  }, [])

  useEffect(() => {
    globalAddToast = addToast
    return () => { globalAddToast = null }
  }, [addToast])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
      maxWidth: '380px',
    }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }) {
  const Icon = iconMap[item.type]
  const colors = colorMap[item.type]

  useEffect(() => {
    const timer = setTimeout(() => onRemove(item.id), item.duration)
    return () => clearTimeout(timer)
  }, [item.id, item.duration, onRemove])

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '14px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        pointerEvents: 'auto',
        cursor: 'pointer',
        minWidth: '280px',
      }}
      onClick={() => onRemove(item.id)}
    >
      <Icon size={20} strokeWidth={1.8} color={colors.icon} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span style={{
        fontSize: '13px',
        fontWeight: '500',
        color: colors.text,
        lineHeight: 1.5,
        flex: 1,
      }}>
        {item.message}
      </span>
      <X size={14} strokeWidth={2} color={colors.icon} style={{ flexShrink: 0, opacity: 0.6, marginTop: '2px' }} />
    </motion.div>
  )
}
