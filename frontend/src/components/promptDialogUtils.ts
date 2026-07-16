export interface PromptOptions {
  title?: string
  message: string
  defaultValue?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
}

let globalPrompt: ((options: PromptOptions) => Promise<string | null>) | null = null

export function setGlobalPrompt(fn: ((options: PromptOptions) => Promise<string | null>) | null) {
  globalPrompt = fn
}

/** 全局调用方法 — 替代 prompt() */
export function promptDialog(options: PromptOptions): Promise<string | null> {
  if (!globalPrompt) return Promise.resolve(null)
  return globalPrompt(options)
}
