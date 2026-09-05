import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { PartyPopper } from 'lucide-react'

interface ConfettiEffectProps {
  /** 是否显示 */
  show: boolean
  /** 动画结束回调 */
  onComplete?: () => void
  /** 持续时间 (ms) */
  duration?: number
  /** 粒子数量 */
  particleCount?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

const COLORS = [
  '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff',
  '#5f27cd', '#01a3a4', '#f368e0', '#ff9f43', '#00d2d3',
  '#c8d6e5', '#576574', '#22a6b3', '#be2edd', '#6ab04c',
]

/**
 * 礼花/庆祝特效组件
 * 使用 Canvas 绘制粒子动画
 */
export default function ConfettiEffect({
  show,
  onComplete,
  duration = 3000,
  particleCount = 150,
}: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])

  // 创建粒子
  const createParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 20 - 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      })
    }
    return particles
  }, [particleCount])

  // 动画循环（使用 ref 避免闭包中的 TDZ 问题）
  const animateRef = useRef<(() => void) | null>(null)

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const gravity = 0.5
    const friction = 0.99

    particlesRef.current.forEach((p) => {
      p.vy += gravity
      p.vx *= friction
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotationSpeed
      p.opacity = Math.max(0, p.opacity - 0.005)

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color

      // 绘制不同形状的粒子
      const shape = Math.random() > 0.5 ? 'rect' : 'circle'
      if (shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    })

    // 移除消失的粒子
    particlesRef.current = particlesRef.current.filter((p) => p.opacity > 0 && p.y < canvas.height + 50)

    if (particlesRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(() => animateRef.current?.())
    } else {
      onComplete?.()
    }
  }, [onComplete])

  useEffect(() => {
    animateRef.current = animate
  })

  useEffect(() => {
    if (!show) return

    const canvas = canvasRef.current
    if (!canvas) return

    // 设置 canvas 大小
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // 创建粒子
    particlesRef.current = createParticles(canvas.width, canvas.height)

    // 开始动画
    animationRef.current = requestAnimationFrame(() => animateRef.current?.())

    // 超时清理
    const timeout = setTimeout(() => {
      particlesRef.current = []
      onComplete?.()
    }, duration)

    return () => {
      cancelAnimationFrame(animationRef.current)
      clearTimeout(timeout)
    }
  }, [show, createParticles, duration, onComplete])

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
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
            }}
          />

          {/* 成功提示 */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 0.5, repeat: 2 }}
              style={{
                fontSize: '64px',
                marginBottom: '12px',
              }}
            >
              <PartyPopper size={64} />
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: '24px',
                fontWeight: '800',
                color: 'white',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              报名成功！
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.9)',
                marginTop: '8px',
                textShadow: '0 1px 5px rgba(0,0,0,0.2)',
              }}
            >
              请等待教师审核
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
