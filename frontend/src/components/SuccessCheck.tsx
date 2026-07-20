import { motion, AnimatePresence } from 'motion/react'

interface SuccessCheckProps {
  size?: number
  color?: string
  delay?: number
}

export default function SuccessCheck({ size = 48, color = '#34C759', delay = 0 }: SuccessCheckProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.4}
        viewBox="0 0 24 18"
        fill="none"
      >
        <motion.path
          d="M2 10L8 16L22 2"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: delay + 0.2 }}
        />
      </svg>
    </motion.div>
  )
}

export function SuccessOverlay({ visible, onComplete }: { visible: boolean; onComplete?: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            if (visible) {
              setTimeout(() => onComplete?.(), 1500)
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 9998,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <SuccessCheck size={80} />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                marginTop: '16px',
                fontSize: '18px',
                fontWeight: '600',
                color: '#1a1a1a',
              }}
            >
              操作成功
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


