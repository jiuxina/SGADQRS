import { motion, AnimatePresence } from 'motion/react'

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
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            if (!show) onComplete?.()
          }}
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
          {/* 背景闪烁 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.15, 0, 0.1, 0],
            }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)',
            }}
          />

          {/* 主提示框 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              x: [0, -10, 10, -10, 10, 0], // 震动效果
            }}
            transition={{
              scale: { type: 'spring', stiffness: 300, damping: 20 },
              opacity: { duration: 0.3 },
              y: { type: 'spring', stiffness: 200, damping: 15 },
              x: { duration: 0.5, delay: 0.2 },
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.95)',
              borderRadius: '16px',
              padding: '24px 32px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* 错误图标 */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 0.5, repeat: 2 }}
                style={{ fontSize: '32px' }}
              >
                😔
              </motion.div>
            </motion.div>

            {/* 标题 */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: 'white',
                marginBottom: '8px',
              }}
            >
              {message}
            </motion.div>

            {/* 副标题 */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              请稍后再试或联系管理员
            </motion.div>

            {/* 进度条 */}
            <motion.div
              style={{
                marginTop: '16px',
                height: '4px',
                borderRadius: '2px',
                background: 'rgba(255,255,255,0.2)',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                style={{
                  height: '100%',
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: '2px',
                }}
              />
            </motion.div>
          </motion.div>

          {/* 散落的碎片 */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 1,
                delay: 0.2 + i * 0.05,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                borderRadius: i % 2 === 0 ? '50%' : '2px',
                background: ['#ff6b6b', '#feca57', '#ff9ff3'][i % 3],
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
