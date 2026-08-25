import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'

interface GlassModalProps {
  open: boolean
  onClose: () => void
  title?: string
  maxWidth?: string
  children: ReactNode
}

export default function GlassModal({ open, onClose, title, maxWidth = '520px', children }: GlassModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-card glass-card-vertical glass-card-static"
            style={{
              width: '90%', maxWidth, maxHeight: '85vh', overflow: 'auto',
              padding: '24px', position: 'relative',
            }}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
                <button
                  onClick={onClose}
                  className="icon-btn"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            )}
            {!title && (
              <button
                onClick={onClose}
                className="icon-btn"
                style={{ position: 'absolute', top: '16px', right: '16px' }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
