import { useState, useCallback } from 'react'

/**
 * Hook that triggers a shake animation when called.
 * Returns [isShaking, triggerShake] tuple.
 * 
 * Usage:
 * const [isShaking, triggerShake] = useShake()
 * // In JSX: style={{ animation: isShaking ? 'shake 0.5s ease-in-out' : 'none' }}
 * // Call triggerShake() on validation error
 */
export function useShake(): [boolean, () => void] {
  const [isShaking, setIsShaking] = useState(false)

  const triggerShake = useCallback(() => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)
  }, [])

  return [isShaking, triggerShake]
}

/**
 * Returns animation style for shaking effect.
 * Use with motion.div: animate={isShaking ? { x: [0, -10, 10, -10, 10, 0] } : {}}
 */
export function getShakeAnimation(isShaking: boolean) {
  return isShaking
    ? {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 },
      }
    : {}
}
