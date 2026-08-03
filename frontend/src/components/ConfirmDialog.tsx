import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, HelpCircle, X } from 'lucide-react'
import { setGlobalConfirm } from './confirmDialogUtils'
import type { ConfirmOptions } from './confirmDialogUtils'

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

const variantStyles = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'var(--danger)',
    iconBg: 'rgba(255, 59, 48, 0.1)',
    confirmBg: 'var(--danger)',
    confirmHover: 'color-mix(in srgb, var(--danger) 90%, black)',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'var(--warning)',
    iconBg: 'rgba(255, 149, 0, 0.1)',
    confirmBg: 'var(--warning)',
    confirmHover: 'color-mix(in srgb, var(--warning) 90%, black)',
  },
  info: {
    icon: HelpCircle,
    iconColor: 'var(--accent)',
    iconBg: 'rgba(0, 122, 255, 0.1)',
    confirmBg: 'var(--accent)',
    confirmHover: 'color-mix(in srgb, var(--accent) 90%, black)',
  },
}

/** Confirm 容器 — 需挂载在 App 根部 */
export function ConfirmContainer() {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve })
    })
  }, [])

  useEffect(() => {
    setGlobalConfirm(confirm)
    return () => { setGlobalConfirm(null) }
  }, [confirm])

  const handleConfirm = useCallback(() => {
    state?.resolve(true)
    setState(null)
  }, [state])

  const handleCancel = useCallback(() => {
    state?.resolve(false)
    setState(null)
  }, [state])

  if (!state) return null

  const variant = state.variant || 'warning'
  const styles = variantStyles[variant]
  const Icon = styles.icon

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
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
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Icon size={16} strokeWidth={1.5} color="var(--text-secondary)" />
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
              textAlign: 'center', lineHeight: 1.6, marginBottom: '24px',
            }}>
              {state.message}
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
                  background: styles.confirmBg,
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = styles.confirmHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = styles.confirmBg)}
              >
                {state.confirmText || '确定'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
