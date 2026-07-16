export type ToastType = 'success' | 'error' | 'warning' | 'info'

let globalAddToast: ((type: ToastType, message: string, duration?: number) => void) | null = null

export function setGlobalAddToast(fn: ((type: ToastType, message: string, duration?: number) => void) | null) {
  globalAddToast = fn
}

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
