import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  /** 报名截止时间 (ISO string or Date-parseable string) */
  deadline: string
  /** 报名开始时间 */
  startDate?: string
  /** 自定义样式 */
  style?: React.CSSProperties
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

/**
 * 倒计时组件 - 显示距离报名截止的剩余时间
 * 当剩余时间 < 24h 时显示紧急样式
 * 当已过期时显示已截止
 */
export default function CountdownTimer({ deadline, style }: CountdownTimerProps) {
  const [now, setNow] = useState(Date.now())

  // 每秒更新
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 计算剩余时间
  const timeLeft = useMemo<TimeLeft>(() => {
    const end = new Date(deadline).getTime()
    const diff = Math.max(0, end - now)
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      total: diff,
    }
  }, [deadline, now])

  // 紧急状态: 剩余 < 24 小时
  const isUrgent = timeLeft.total > 0 && timeLeft.total < 24 * 60 * 60 * 1000

  // 已截止
  const isExpired = timeLeft.total === 0

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 0',
          fontSize: '12px',
          fontWeight: '500',
          color: 'var(--text-tertiary)',
          ...style,
        }}
      >
        <Clock size={14} strokeWidth={1.5} />
        <span>报名已截止</span>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        ...style,
      }}
    >
      {/* 标签 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        color: isUrgent ? '#f59e0b' : 'var(--text-tertiary)',
        fontWeight: '500',
      }}>
        <Clock size={12} />
        <span>{isUrgent ? '即将截止' : '报名倒计时'}</span>
      </div>

      {/* 倒计时数字 */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {timeLeft.days > 0 && (
          <TimeBlock value={timeLeft.days} label="天" isUrgent={isUrgent} />
        )}
        <TimeBlock value={timeLeft.hours} label="时" isUrgent={isUrgent} />
        <Separator isUrgent={isUrgent} />
        <TimeBlock value={timeLeft.minutes} label="分" isUrgent={isUrgent} />
        <Separator isUrgent={isUrgent} />
        <TimeBlock value={timeLeft.seconds} label="秒" isUrgent={isUrgent} />
      </div>
    </motion.div>
  )
}

/** 时间块 */
function TimeBlock({ value, label, isUrgent }: { value: number; label: string; isUrgent: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: '32px',
    }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{
            fontSize: '16px',
            fontWeight: '800',
            fontFamily: 'monospace',
            color: isUrgent ? '#f59e0b' : 'var(--accent)',
            lineHeight: 1,
          }}
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </AnimatePresence>
      <span style={{
        fontSize: '9px',
        color: 'var(--text-tertiary)',
        marginTop: '2px',
      }}>
        {label}
      </span>
    </div>
  )
}

/** 分隔符 */
function Separator({ isUrgent }: { isUrgent: boolean }) {
  return (
    <motion.span
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
      style={{
        fontSize: '14px',
        fontWeight: '700',
        color: isUrgent ? '#f59e0b' : 'var(--text-tertiary)',
        marginBottom: '12px',
      }}
    >
      :
    </motion.span>
  )
}
