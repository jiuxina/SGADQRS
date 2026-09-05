import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { XCircle, X } from 'lucide-react'

interface RejectReasonModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  title?: string
  placeholder?: string
}

export default function RejectReasonModal({
  open,
  onClose,
  onConfirm,
  title = '拒绝原因',
  placeholder = '请输入拒绝原因（选填）...',
}: RejectReasonModalProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(reason.trim())
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
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
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              width: window.innerWidth < 768 ? 'calc(100vw - 32px)' : '400px',
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
              onClick={handleClose}
              className="icon-btn"
              style={{ position: 'absolute', top: '14px', right: '14px' }}
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <XCircle size={16} strokeWidth={1.5} color="var(--text-secondary)" />
            </div>

            {/* Title */}
            <div style={{
              fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)',
              textAlign: 'center', marginBottom: '12px',
            }}>
              {title}
            </div>

            {/* Textarea */}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={placeholder}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border, rgba(0,0,0,0.08))',
                background: 'var(--glass-bg, rgba(0,0,0,0.04))',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
                marginBottom: '14px',
              }}
            />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleClose}
                style={{
                  flex: 1, height: '42px', borderRadius: '10px',
                  background: 'var(--glass-bg, rgba(0,0,0,0.04))',
                  border: '1px solid var(--border, rgba(0,0,0,0.08))',
                  color: 'var(--text-secondary)',
                  fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1, height: '42px', borderRadius: '10px',
                  background: '#FF3B30',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#e0342a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FF3B30')}
              >
                确认拒绝
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
