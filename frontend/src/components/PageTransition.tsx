import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * 页面切换过渡：按 pathname 重挂载内容；
 * 桌面/移动的内容区都是独立滚动容器，切路由时需手动滚回顶部。
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = ref.current?.closest<HTMLElement>('.desktop-content, .mobile-content')
    scroller?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        ref={ref}
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
        style={{ height: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
