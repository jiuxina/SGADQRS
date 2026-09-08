import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ChevronLeft, ChevronRight, CircleHelp } from 'lucide-react'
import type { Tutorial } from '../config/tutorials'

interface TutorialOverlayProps {
  tutorial: Tutorial
  onClose: () => void
}

/** 当前页面使用教程遮罩：暗色蒙层 + 居中分步卡片，ESC/点击蒙层/关闭按钮均可退出 */
export default function TutorialOverlay({ tutorial, onClose }: TutorialOverlayProps) {
  const [idx, setIdx] = useState(0)
  const total = tutorial.steps.length
  const step = tutorial.steps[Math.min(idx, total - 1)]
  const isLast = idx >= total - 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && !isLast) setIdx((i) => Math.min(i + 1, total - 1))
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, isLast, total])

  return (
    <AnimatePresence>
      <motion.div
        className="tutorial-mask"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      >
        <motion.div
          className="tutorial-card"
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={`使用教程：${tutorial.title}`}
        >
          <div className="tutorial-card-head">
            <div className="tutorial-card-badge">
              <CircleHelp size={16} strokeWidth={2} />
            </div>
            <div className="tutorial-card-title">{tutorial.title}</div>
            <button className="tutorial-close" onClick={onClose} aria-label="关闭教程">
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="tutorial-step" key={idx}>
            <div className="tutorial-step-title">
              <span className="tutorial-step-num">{idx + 1}</span>
              {step.title}
            </div>
            <div className="tutorial-step-desc">{step.desc}</div>
          </div>

          <div className="tutorial-card-foot">
            <div className="tutorial-dots">
              {tutorial.steps.map((_, i) => (
                <span key={i} className={`tutorial-dot ${i === idx ? 'active' : ''}`} />
              ))}
            </div>
            <div className="tutorial-btns">
              <button className="tutorial-btn ghost" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
                <ChevronLeft size={14} strokeWidth={2} />
                上一步
              </button>
              {isLast ? (
                <button className="tutorial-btn primary" onClick={onClose}>知道了</button>
              ) : (
                <button className="tutorial-btn primary" onClick={() => setIdx((i) => i + 1)}>
                  下一步
                  <ChevronRight size={14} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
