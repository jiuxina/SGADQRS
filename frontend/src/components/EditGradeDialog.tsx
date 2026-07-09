import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Award } from 'lucide-react'

interface EditGradeOptions {
  title?: string
  studentName: string
  defaultScore?: number | null
  defaultRemark?: string | null
  confirmText?: string
  cancelText?: string
}

interface EditGradeResult {
  score: number
  remark: string
}

interface EditGradeState extends EditGradeOptions {
  resolve: (value: EditGradeResult | null) => void
}

let globalEditGrade: ((options: EditGradeOptions) => Promise<EditGradeResult | null>) | null = null

/** 全局调用方法 */
export function editGradeDialog(options: EditGradeOptions): Promise<EditGradeResult | null> {
  if (!globalEditGrade) return Promise.resolve(null)
  return globalEditGrade(options)
}

/** EditGrade 容器 — 需挂载在 App 根部 */
export function EditGradeContainer() {
  const [state, setState] = useState<EditGradeState | null>(null)
  const [score, setScore] = useState('')
  const [remark, setRemark] = useState('')
  const scoreRef = useRef<HTMLInputElement>(null)

  const editGrade = useCallback((options: EditGradeOptions): Promise<EditGradeResult | null> => {
    return new Promise<EditGradeResult | null>((resolve) => {
      setState({ ...options, resolve })
      setScore(options.defaultScore != null ? String(options.defaultScore) : '')
      setRemark(options.defaultRemark ?? '')
    })
  }, [])

  useEffect(() => {
    globalEditGrade = editGrade
    return () => { globalEditGrade = null }
  }, [editGrade])

  useEffect(() => {
    if (state) {
      const timer = setTimeout(() => scoreRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [state])

  const handleConfirm = useCallback(() => {
    const scoreNum = Number(score)
    if (score === '' || isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      return
    }
    state?.resolve({ score: scoreNum, remark })
    setState(null)
  }, [state, score, remark])

  const handleCancel = useCallback(() => {
    state?.resolve(null)
    setState(null)
  }, [state])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) handleConfirm()
    if (e.key === 'Escape') handleCancel()
  }, [handleConfirm, handleCancel])

  if (!state) return null

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
              onClick={handleCancel}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)', padding: '4px',
              }}
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            {/* Icon */}
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'rgba(0, 122, 255, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Award size={24} strokeWidth={1.8} color="#007AFF" />
            </div>

            {/* Title */}
            <div style={{
              fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)',
              textAlign: 'center', marginBottom: '8px',
            }}>
              {state.title || '编辑成绩'}
            </div>

            {/* Message */}
            <div style={{
              fontSize: '14px', color: 'var(--text-secondary)',
              textAlign: 'center', lineHeight: 1.6, marginBottom: '20px',
            }}>
              编辑 {state.studentName} 的成绩信息
            </div>

            {/* Score Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                分数 <span style={{ color: 'var(--text-tertiary)', fontWeight: '400' }}>(0-100)</span>
              </label>
              <input
                ref={scoreRef}
                className="glass-input"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入分数"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Remark Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                备注 <span style={{ color: 'var(--text-tertiary)', fontWeight: '400' }}>(可选)</span>
              </label>
              <textarea
                className="glass-input"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入备注信息"
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '80px',
                  fontFamily: 'inherit',
                }}
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
                {state.confirmText || '保存'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
