import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { X, Edit3 } from 'lucide-react'
import { setGlobalPrompt } from './promptDialogUtils'
import type { PromptOptions } from './promptDialogUtils'

interface PromptState extends PromptOptions {
  resolve: (value: string | null) => void
}

/** Prompt 容器 — 需挂载在 App 根部 */
export function PromptContainer() {
  const [state, setState] = useState<PromptState | null>(null)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      setState({ ...options, resolve })
      setValue(options.defaultValue ?? '')
    })
  }, [])

  useEffect(() => {
    setGlobalPrompt(prompt)
    return () => { setGlobalPrompt(null) }
  }, [prompt])

  useEffect(() => {
    if (state) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [state])

  const handleConfirm = useCallback(() => {
    state?.resolve(value)
    setState(null)
  }, [state, value])

  const handleCancel = useCallback(() => {
    state?.resolve(null)
    setState(null)
  }, [state])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') handleCancel()
  }, [handleConfirm, handleCancel])

  if (!state) return null

  return (
    // 不用 AnimatePresence 退出动画：退出动画被挂起时弹窗会以 opacity:0 残留并堆叠；关闭即卸载。
    state && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              width: window.innerWidth < 768 ? 'calc(100vw - 32px)' : '380px',
              background: 'var(--surface, rgba(255,255,255,0.95))',
              borderRadius: '18px',
              padding: '28px 24px 20px',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="icon-btn"
              style={{
                position: 'absolute', top: '14px', right: '14px',
              }}
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <Edit3 size={16} strokeWidth={1.5} color="var(--text-secondary)" />
            </div>

            {/* Title */}
            {state.title && (
              <div style={{
                fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)',
                textAlign: 'center', marginBottom: '8px',
              }}>
                {state.title}
              </div>
            )}

            {/* Message */}
            <div style={{
              fontSize: '14px', color: 'var(--text-secondary)',
              textAlign: 'center', lineHeight: 1.6, marginBottom: '12px',
            }}>
              {state.message}
            </div>

            {/* Input */}
            <div style={{ marginBottom: '16px' }}>
              <input
                ref={inputRef}
                className="glass-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={state.placeholder || ''}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1, height: '42px', borderRadius: '10px',
                  background: 'var(--glass-bg, rgba(0,0,0,0.04))',
                  border: '1px solid var(--border, rgba(0,0,0,0.08))',
                  color: 'var(--text-secondary)',
                  fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {state.cancelText || '取消'}
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1, height: '42px', borderRadius: '10px',
                  background: '#007AFF',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#0066D6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#007AFF')}
              >
                {state.confirmText || '确定'}
              </button>
            </div>
          </motion.div>
        </motion.div>
    )
  )
}
