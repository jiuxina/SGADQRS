import { useCallback, useRef, useEffect } from 'react'

/**
 * Hook that tracks mouse position on glass elements and updates CSS custom properties
 * for the shimmer light-follow effect (Scheme E).
 */
export function useGlassShimmer() {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    el.style.setProperty('--mouse-x', `${x}px`)
    el.style.setProperty('--mouse-y', `${y}px`)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => el.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  return ref
}

/**
 * Attach shimmer to multiple glass card elements via a container ref.
 * Updates --mouse-x / --mouse-y on whichever child card the mouse is over.
 */
export function useGlassShimmerContainer() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const card = target.closest('.glass-card, .metric-card, .detail-panel') as HTMLElement | null
      if (card) {
        const rect = card.getBoundingClientRect()
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
      }
    }

    container.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => container.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return containerRef
}
