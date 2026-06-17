import { useEffect, useRef, useState } from 'react'

interface DigitRollerProps {
  value: number | string
  className?: string
  style?: React.CSSProperties
  duration?: number
}

/**
 * Digit-rolling number display (Scheme D).
 * Each digit independently scrolls to its target value with a spring-like easing.
 * Non-digit characters (., /, %) are rendered as static text.
 */
export default function DigitRoller({ value, className, style, duration = 800 }: DigitRollerProps) {
  const str = String(value)
  const prevRef = useRef(str)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!mounted) {
      const t = setTimeout(() => setMounted(true), 100)
      return () => clearTimeout(t)
    }
  }, [mounted])

  useEffect(() => {
    prevRef.current = str
  }, [str])

  if (!mounted) {
    return <span className={className} style={style}>0</span>
  }

  const chars = str.split('')

  return (
    <span className={`digit-roller ${className || ''}`} style={style}>
      {chars.map((char, i) => {
        const isDigit = /\d/.test(char)
        if (!isDigit) {
          return (
            <span key={`${i}-static`} className="digit-static">
              {char}
            </span>
          )
        }

        const digit = parseInt(char, 10)
        // translateY: each digit row is 1.1em tall, scroll to show the target digit
        const translateY = -digit * 1.1

        return (
          <span
            key={`${i}-digit`}
            className="digit-column"
            style={{
              transform: `translateY(${translateY}em)`,
              transitionDuration: `${duration}ms`,
              transitionDelay: `${i * 50}ms`,
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        )
      })}
    </span>
  )
}
