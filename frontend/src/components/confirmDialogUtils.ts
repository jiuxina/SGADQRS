export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

let globalConfirm: ((options: ConfirmOptions) => Promise<boolean>) | null = null

export function setGlobalConfirm(fn: ((options: ConfirmOptions) => Promise<boolean>) | null) {
  globalConfirm = fn
}

/** 全局调用方法 — 替代 confirm() */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  if (!globalConfirm) return Promise.resolve(false)
  return globalConfirm(options)
}
