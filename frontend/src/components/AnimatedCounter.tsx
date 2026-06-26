import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'motion/react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  style?: React.CSSProperties
}

export default function AnimatedCounter({
  value,
  duration = 1,
  decimals = 0,
  prefix = '',
  suffix = '',
  style,
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => {
    const formatted = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString()
    return `${prefix}${formatted}${suffix}`
  })
  const [displayValue, setDisplayValue] = useState(`${prefix}0${suffix}`)

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
    })

    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v))

    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, duration, motionValue, rounded])

  return (
    <motion.span
      style={{
        display: 'inline-block',
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {displayValue}
    </motion.span>
  )
}

export function AnimatedCounterGroup({
  items,
}: {
  items: Array<{ label: string; value: number; prefix?: string; suffix?: string; color?: string }>
}) {
  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          style={{ textAlign: 'center' }}
        >
          <AnimatedCounter
            value={item.value}
            prefix={item.prefix}
            suffix={item.suffix}
            duration={1.5}
            style={{
              fontSize: '32px',
              fontWeight: '800',
              color: item.color || '#007AFF',
              display: 'block',
            }}
          />
          <span style={{ fontSize: '13px', color: '#666', marginTop: '4px', display: 'block' }}>
            {item.label}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
