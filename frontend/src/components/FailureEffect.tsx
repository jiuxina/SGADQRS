import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { XCircle } from 'lucide-react'

interface FailureEffectProps {
  /** 是否显示 */
  show: boolean
  /** 错误消息 */
  message?: string
  /** 动画结束回调 */
  onComplete?: () => void
  /** 持续时间 (ms) */
  duration?: number
}

/**
 * 失败/拒绝特效组件
 * 显示震动效果和错误提示
 */
export default function FailureEffect({
  show,
  message = '报名失败',
  onComplete,
  duration = 2500,
}: FailureEffectProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(() => onComplete?.(), duration)
      return () => clearTimeout(t)
    }
  }, [show, duration, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          {/* 主提示框 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              x: [0, -6, 6, -6, 6, 0],
            }}
            transition={{
              scale: { type: 'spring', stiffness: 300, damping: 20 },
              opacity: { duration: 0.3 },
              y: { type: 'spring', stiffness: 200, damping: 15 },
              x: { duration: 0.4, delay: 0.15 },
            }}
            className="glass-card glass-card-vertical glass-card-static"
            style={{
              padding: '24px 32px',
              textAlign: 'center',
              minWidth: '240px',
            }}
          >
            <XCircle size={36} strokeWidth={1.5} color="var(--danger)" style={{ margin: '0 auto 12px' }} />

            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '6px',
            }}>
              {message}
            </div>

            <div style={{
              fontSize: '13px',
              color: 'var(--text-tertiary)',
            }}>
              请稍后再试或联系管理员
            </div>

            {/* 进度条 */}
            <div style={{
              marginTop: '16px',
              height: '3px',
              borderRadius: '2px',
              background: 'rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                style={{
                  height: '100%',
                  background: 'var(--text-tertiary)',
                  borderRadius: '2px',
                  opacity: 0.3,
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
